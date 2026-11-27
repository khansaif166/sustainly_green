import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { webcrypto } from "node:crypto";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const root = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(import.meta.url);
const scripts = new Map();
const vendorId = "10000000-0000-4000-8000-000000000001";
const mediaId = "10000000-0000-4000-8000-000000000002";
const otherVendorId = "10000000-0000-4000-8000-000000000003";
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1sAAAAASUVORK5CYII=", "base64");

// Run actual routes/auth/storage code against an isolated HTTP fixture.
function fixture({ active = true, approved = true, rpcError, refreshFailure = false, uploadFailure = false, cleanupFailure = false, transientUploadFailures = 0, uploadCommittedThenThrows = false, verificationFailures = 0, wrongStoredObject = false, uploadTimeout = false, uploadStatus = 503 } = {}) {
  const calls = [];
  const cache = new Map();
  const objects = new Map([[`${vendorId}/original`, png]]);
  let uploadAttempts = 0;
  let verificationAttempts = 0;
  let content = {};
  let revision = 0;
  let current = { id: mediaId, vendor_id: vendorId, purpose: "cover", title: "Original cover", storage_path: `${vendorId}/original`, mime_type: "image/png", source_url: null };
  const context = vm.createContext({
    URL, URLSearchParams, Request, Response, Headers, File, FormData, Uint8Array,
    TransformStream, AbortSignal, setTimeout, crypto: webcrypto,
    process: { env: { NEXT_PUBLIC_SUPABASE_URL: "https://supabase.test", NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon", SUPABASE_SERVICE_ROLE_KEY: "test-service" } },
    console: { error() {} },
    async fetch(input, options = {}) {
      const url = new URL(input);
      const headers = new Headers(options.headers);
      const method = options.method || "GET";
      calls.push({ url, method, headers, body: options.body, signal: options.signal });
      if (url.pathname === "/auth/v1/user") {
        const role = headers.get("Authorization")?.replace("Bearer ", "");
        return role === "expired" ? Response.json({}, { status: 401 }) : Response.json({ id: role });
      }
      if (url.pathname === "/rest/v1/profiles") {
        const role = url.searchParams.get("auth_user_id").slice(3);
        return Response.json([{ id: role === "OTHER" ? "profile-other" : "profile-1", role: role === "OTHER" ? "VENDOR" : role, vendor_approved: true }]);
      }
      if (url.pathname === "/rest/v1/buyers") return Response.json([]);
      if (url.pathname === "/rest/v1/vendors") return Response.json([{ id: url.searchParams.get("profile_id")?.includes("profile-other") ? otherVendorId : vendorId, approved, slug: "test-vendor" }]);
      if (url.pathname === "/rest/v1/vendor_rich_profiles") {
        if (url.searchParams.has("active") && (!active || !approved)) return Response.json([]);
        return Response.json([{ active, content, revision }]);
      }
      if (url.pathname === "/rest/v1/vendor_rich_media") return Response.json(current && ["id", "vendor_id", "storage_path", "purpose", "news_record_only"].every(key =>
        !url.searchParams.has(key) || String(current[key]) === url.searchParams.get(key).slice(3)) ? [current] : []);
      if (["/rest/v1/vendor_rich_ads", "/rest/v1/categories", "/rest/v1/subcategories", "/rest/v1/certifying_bodies"].includes(url.pathname)) return Response.json([]);
      if (url.pathname === "/rest/v1/rpc/write_vendor_rich_profile" || url.pathname === "/rest/v1/rpc/add_vendor_rich_news_image") {
        if (rpcError === "transport") throw new Error("Connection lost after commit");
        if (rpcError && rpcError !== "committed") return Response.json({ message: "Cover changed in another session.", code: "P0002" }, { status: 400 });
        const { p_action: action, p_data: data } = JSON.parse(options.body);
        if (action === "content") {
          content = data.content;
          revision++;
          return Response.json({ id: null, oldPath: null });
        }
        if (action === "delete_media") { const oldPath = current.storage_path; current = null; return Response.json({ id: mediaId, oldPath }); }
        const oldPath = action === "replace_cover" ? current.storage_path : null;
        const newsImage = url.pathname.endsWith("/add_vendor_rich_news_image");
        current = { ...current, id: mediaId, purpose: newsImage ? "gallery" : data.purpose || "cover",
          news_record_only: newsImage, title: data.title, storage_path: data.storagePath, mime_type: data.mimeType };
        if (rpcError === "committed") throw new Error("Response lost after commit");
        return Response.json({ id: mediaId, oldPath });
      }
      if (url.pathname.startsWith("/storage/v1/object/")) {
        if (method === "POST") {
          uploadAttempts++;
          if (uploadTimeout) throw new DOMException("Upload timeout", "TimeoutError");
          if (uploadFailure || uploadAttempts <= transientUploadFailures) return new Response(null, { status: uploadStatus });
          const path = url.pathname.replace("/storage/v1/object/vendor-rich/", "");
          if (objects.has(path)) return Response.json({ error: "Duplicate", message: "The resource already exists" }, { status: 400 });
          objects.set(path, wrongStoredObject ? Buffer.from("different file") : Buffer.from(options.body));
          if (uploadCommittedThenThrows && uploadAttempts === 1) throw new Error("Upload response lost");
          return Response.json({ Key: "uploaded" });
        }
        if (method === "DELETE") return cleanupFailure ? new Response(null, { status: 503 }) : Response.json([]);
        if (refreshFailure) return new Response(null, { status: 503 });
        verificationAttempts++;
        if (verificationAttempts <= verificationFailures) return new Response(null, { status: 503 });
        const object = objects.get(url.pathname.replace("/storage/v1/object/authenticated/vendor-rich/", ""));
        if (!object) return new Response(null, { status: 404 });
        return new Response(method === "HEAD" ? null : object, { headers: { "Content-Type": "image/png", "Content-Length": String(object.length) } });
      }
      throw new Error(`Unhandled request ${method} ${url.pathname}`);
    },
  });
  function load(file) {
    const path = resolve(root, file);
    if (cache.has(path)) return cache.get(path).exports;
    const mod = { exports: {} };
    cache.set(path, mod);
    if (!scripts.has(path)) {
      const code = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
      scripts.set(path, new vm.Script(`(function(require,module,exports){${code}\n})`, { filename: path }));
    }
    const localRequire = name => name === "server-only" ? {} : name.startsWith("@/") ? load(`${name.slice(2)}.ts`) : name.startsWith(".") ? load(`${resolve(dirname(path), name)}.ts`) : require(name);
    scripts.get(path).runInContext(context)(localRequire, mod, mod.exports);
    return mod.exports;
  }
  return { calls, load, get current() { return current; } };
}

function upload({ role = "ADMIN", action = "add_media", purpose = "cover", id, file = new File([png], "cover.png", { type: "image/png" }), title = "New cover", sourceUrl = "" } = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ action, purpose, title, sourceUrl, id })) if (value !== undefined) form.set(key, value);
  if (file) form.set("file", file);
  return new Request("https://app.test/api/admin/vendors/test/rich-profile", { method: "PATCH", headers: role ? { Authorization: `Bearer ${role}` } : {}, body: form });
}
const context = { params: Promise.resolve({ id: vendorId }) };
const adminRoute = f => f.load("app/api/admin/vendors/[id]/rich-profile/route.ts");
const storageCalls = f => f.calls.filter(call => call.url.pathname.startsWith("/storage/v1/"));

const newsUpdate = {
  id: "10000000-0000-4000-8000-000000000004", headline: "Company update",
  body: "Example update", date: "2026-11-27", imageId: mediaId, sourceUrl: "",
};
function saveNews(f, revision, published) {
  return adminRoute(f).PATCH(new Request("https://app.test", {
    method: "PATCH",
    headers: { Authorization: "Bearer ADMIN", "Content-Type": "application/json" },
    body: JSON.stringify({ action: "content", revision, content: { news: [{ ...newsUpdate, published }] } }),
  }), context);
}

test("news images are private before draft save, public with a published update, and private again after unpublishing", async () => {
  const f = fixture();
  const { loadPublicRichProfile, serveRichMedia } = f.load("lib/richVendorServer.ts");
  const preview = (role, method = "GET") => serveRichMedia(new Request("https://app.test", {
    method, headers: role ? { Authorization: `Bearer ${role}` } : {},
  }), "asset", mediaId);
  const profile = () => loadPublicRichProfile({ id: vendorId });

  assert.equal((await adminRoute(f).PATCH(upload({ action: "add_news_image" }), context)).status, 200);
  assert(f.calls.some(call => call.url.pathname.endsWith("/add_vendor_rich_news_image")));
  assert.equal((await preview()).status, 404);
  assert.equal((await preview(undefined, "HEAD")).status, 404);
  assert.equal((await preview("ADMIN")).status, 200);
  assert.equal((await preview("VENDOR")).status, 200);
  assert.equal((await preview("OTHER")).status, 404);
  assert.equal((await profile()).media.length, 0);

  assert.equal((await saveNews(f, 0, false)).status, 200);
  assert.equal((await preview()).status, 404);
  assert.equal((await profile()).news.length, 0);

  assert.equal((await saveNews(f, 1, true)).status, 200);
  assert.equal((await preview()).status, 200);
  const published = await profile();
  assert.equal(published.news[0].imageUrl, `/api/rich-vendor-media/asset/${mediaId}`);
  assert.equal(published.media.length, 0);

  assert.equal((await saveNews(f, 2, false)).status, 200);
  assert.equal((await preview()).status, 404);
  assert.equal((await profile()).news.length, 0);
});

test("regular gallery images stay public and cannot be attached as private news images", async () => {
  const f = fixture();
  assert.equal((await adminRoute(f).PATCH(upload({ purpose: "gallery" }), context)).status, 200);
  const { loadPublicRichProfile, serveRichMedia } = f.load("lib/richVendorServer.ts");
  assert.equal((await serveRichMedia(new Request("https://app.test"), "asset", mediaId)).status, 200);
  assert.equal((await loadPublicRichProfile({ id: vendorId })).media[0].purpose, "gallery");
  assert.equal((await saveNews(f, 0, false)).status, 400);
});

test("admin cover upload rejects anonymous, expired, buyer and vendor credentials", async () => {
  for (const [role, status] of [[null, 401], ["expired", 401], ["BUYER", 403], ["VENDOR", 403]]) {
    const f = fixture();
    assert.equal((await adminRoute(f).PATCH(upload({ role }), context)).status, status);
    assert.equal(storageCalls(f).length, 0);
  }
});

test("cover upload accepts PNG, trims title and uses private Storage", async () => {
  const f = fixture();
  assert.equal((await adminRoute(f).PATCH(upload({ title: "  New cover  " }), context)).status, 200);
  assert.equal(f.current.title, "New cover");
  const call = storageCalls(f)[0];
  assert(call.url.pathname.startsWith(`/storage/v1/object/vendor-rich/${vendorId}/`));
  assert.equal(call.headers.get("x-upsert"), "false");
});

test("invalid, empty, spoofed, oversized and missing cover files fail before storage", async () => {
  for (const file of [null, new File([], "empty.png", { type: "image/png" }), new File(["svg"], "cover.svg", { type: "image/svg+xml" }), new File(["fake"], "cover.png", { type: "image/png" })]) {
    const f = fixture();
    assert.equal((await adminRoute(f).PATCH(upload({ file }), context)).status, 400);
    assert.equal(storageCalls(f).length, 0);
  }
});

test("admin and vendor routes accept 5 MB images and PDFs and reject one byte more before storage", async () => {
  const limit = 5 * 1024 * 1024;
  for (const role of ["ADMIN", "VENDOR"]) {
    for (const [purpose, filename, type, bytes] of [
      ["cover", "cover.png", "image/png", png],
      ["brochure", "brochure.pdf", "application/pdf", Buffer.from("%PDF-1.4\n")],
    ]) {
      const f = fixture();
      const patch = role === "ADMIN" ? adminRoute(f).PATCH : f.load("app/api/vendor/rich-profile/route.ts").PATCH;
      const request = size => upload({ role, purpose, file: new File([bytes, new Uint8Array(size - bytes.length)], filename, { type }) });
      const rejected = await patch(request(limit + 1), context);
      assert.equal(rejected.status, 400);
      assert.match((await rejected.json()).error.message, /up to 5 MB/);
      assert.equal(storageCalls(f).length, 0);
      assert.equal((await patch(request(limit), context)).status, 200);
      assert.equal(storageCalls(f)[0].body.byteLength, limit);
    }
  }
});

test("oversized replacement preserves the stored cover", async () => {
  const f = fixture();
  const oldPath = f.current.storage_path;
  const file = new File([png, new Uint8Array(5 * 1024 * 1024 + 1 - png.length)], "cover.png", { type: "image/png" });
  const response = await adminRoute(f).PATCH(upload({ action: "replace_cover", id: mediaId, file }), context);
  assert.equal(response.status, 400);
  assert.equal(storageCalls(f).length, 0);
  assert.equal(f.current.storage_path, oldPath);
});

test("uploads over 5 MB and supported links are still accepted for profile videos", async () => {
  const f = fixture();
  const patch = adminRoute(f).PATCH;
  assert.equal(f.load("lib/richVendorProfile.ts").ASSET_LIMIT_MB.video, 25);
  const bytes = new Uint8Array(6 * 1024 * 1024);
  bytes.set([0, 0, 0, 24, 102, 116, 121, 112]);
  const file = new File([bytes], "intro.mp4", { type: "video/mp4" });
  assert.equal((await patch(upload({ purpose: "intro", file }), context)).status, 200);
  assert.equal(storageCalls(f)[0].body.byteLength, bytes.length);
  assert.equal((await patch(upload({ purpose: "intro", file: null, sourceUrl: "https://youtu.be/dQw4w9WgXcQ" }), context)).status, 200);
  assert.equal(storageCalls(f).length, 1);
});

test("blank title and image URL are rejected without uploading", async () => {
  for (const input of [{ title: "   " }, { file: null, sourceUrl: "https://example.test/cover.png" }, { sourceUrl: "https://example.test/cover.png" }]) {
    const f = fixture();
    assert.equal((await adminRoute(f).PATCH(upload(input), context)).status, 400);
    assert.equal(storageCalls(f).length, 0);
  }
});

test("replacement saves new file before deleting old Storage object", async () => {
  const f = fixture();
  const response = await adminRoute(f).PATCH(upload({ action: "replace_cover", id: mediaId }), context);
  assert.equal(response.status, 200, JSON.stringify(await response.json()));
  assert.equal(f.current.id, mediaId);
  assert.notEqual(f.current.storage_path, `${vendorId}/original`);
  const changes = f.calls.filter(call => call.method === "POST" || call.method === "DELETE");
  assert.deepEqual(changes.map(call => call.url.pathname.includes("rpc/") ? "commit" : call.method), ["POST", "commit", "DELETE"]);
  assert.deepEqual(JSON.parse(changes[2].body).prefixes, [`${vendorId}/original`]);
});

test("replacement requires an existing cover ID and a new file", async () => {
  for (const input of [{}, { id: "invalid" }, { id: mediaId, file: null }]) {
    const f = fixture();
    assert.equal((await adminRoute(f).PATCH(upload({ action: "replace_cover", ...input }), context)).status, 400);
    assert.equal(storageCalls(f).length, 0);
  }
});

test("rejected replacement preserves original and cleans only the new upload", async () => {
  const f = fixture({ rpcError: "rejected" });
  const response = await adminRoute(f).PATCH(upload({ action: "replace_cover", id: mediaId }), context);
  assert.equal(response.status, 404);
  assert.equal(f.current.storage_path, `${vendorId}/original`);
  const removed = storageCalls(f).filter(call => call.method === "DELETE");
  assert.equal(removed.length, 1);
  assert(!JSON.parse(removed[0].body).prefixes.includes(`${vendorId}/original`));
});

test("ambiguous commit failure does not delete either possible live object", async () => {
  const f = fixture({ rpcError: "transport" });
  const response = await adminRoute(f).PATCH(upload({ action: "replace_cover", id: mediaId }), context);
  assert.equal(response.status, 503);
  assert.match((await response.json()).error.message, /Reload the editor before retrying/);
  assert.equal(storageCalls(f).filter(call => call.method === "DELETE").length, 0);
});

test("non-retried database requests preserve their caller's timeout signal", async () => {
  const f = fixture();
  const controller = new AbortController();
  await f.load("lib/supabaseServer.ts").supabaseServiceFetch("/rest/v1/vendor_rich_media", { signal: controller.signal }, false);
  assert.equal(f.calls.at(-1).signal, controller.signal);
});

test("Storage upload failure never commits or deletes the current cover", async () => {
  const f = fixture({ uploadFailure: true });
  assert.equal((await adminRoute(f).PATCH(upload({ action: "replace_cover", id: mediaId }), context)).status, 503);
  assert.equal(f.current.storage_path, `${vendorId}/original`);
  assert(!f.calls.some(call => call.url.pathname.includes("/rpc/")));
  assert(!storageCalls(f).some(call => call.method === "DELETE"));
  assert.equal(storageCalls(f).filter(call => call.method === "POST").length, 2);
});

test("transient Storage failure retries the same path and commits once", async () => {
  const f = fixture({ transientUploadFailures: 1 });
  assert.equal((await adminRoute(f).PATCH(upload({ action: "replace_cover", id: mediaId }), context)).status, 200);
  const uploads = storageCalls(f).filter(call => call.method === "POST");
  assert.equal(uploads.length, 2);
  assert.equal(uploads[0].url.href, uploads[1].url.href);
  assert(uploads.every(call => call.headers.get("x-upsert") === "false"));
  assert.equal(f.calls.filter(call => call.url.pathname.includes("/rpc/")).length, 1);
});

test("lost upload response is recovered by verifying stored bytes", async () => {
  const f = fixture({ uploadCommittedThenThrows: true });
  assert.equal((await adminRoute(f).PATCH(upload({ action: "replace_cover", id: mediaId }), context)).status, 200);
  assert.equal(storageCalls(f).filter(call => call.method === "POST").length, 1);
});

test("retry handles Supabase's HTTP 400 duplicate without overwriting", async () => {
  const f = fixture({ uploadCommittedThenThrows: true, verificationFailures: 1 });
  assert.equal((await adminRoute(f).PATCH(upload({ action: "replace_cover", id: mediaId }), context)).status, 200);
  assert.equal(storageCalls(f).filter(call => call.method === "POST").length, 2);
});

test("different bytes at a retry path never count as a successful upload", async () => {
  const f = fixture({ uploadCommittedThenThrows: true, wrongStoredObject: true });
  assert.equal((await adminRoute(f).PATCH(upload({ action: "replace_cover", id: mediaId }), context)).status, 503);
  assert(!f.calls.some(call => call.url.pathname.includes("/rpc/")));
});

test("permanent storage rejection is not retried and gives an upload-specific message", async () => {
  const f = fixture({ uploadFailure: true, uploadStatus: 403 });
  const response = await adminRoute(f).PATCH(upload(), context);
  assert.equal(response.status, 503);
  assert.match((await response.json()).error.message, /storage rejected/i);
  assert.equal(storageCalls(f).filter(call => call.method === "POST").length, 1);
});

test("upload timeout returns a useful message and preserves current cover", async () => {
  const f = fixture({ uploadTimeout: true });
  const response = await adminRoute(f).PATCH(upload({ action: "replace_cover", id: mediaId }), context);
  assert.equal(response.status, 503);
  assert.match((await response.json()).error.message, /upload timed out/i);
  assert.equal(f.current.storage_path, `${vendorId}/original`);
});

test("lost commit response returns the saved cover without repeating the mutation", async () => {
  for (const action of ["add_media", "replace_cover"]) {
    const f = fixture({ rpcError: "committed" });
    const response = await adminRoute(f).PATCH(upload({ action, ...(action === "replace_cover" ? { id: mediaId } : {}) }), context);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).id, mediaId);
    assert.equal(f.calls.filter(call => call.url.pathname.includes("/rpc/")).length, 1);
    assert.notEqual(f.current.storage_path, `${vendorId}/original`);
    assert.equal(storageCalls(f).filter(call => call.method === "DELETE").length, action === "replace_cover" ? 1 : 0);
  }
});

test("old-object cleanup failure does not misreport a committed replacement", async () => {
  const f = fixture({ cleanupFailure: true });
  assert.equal((await adminRoute(f).PATCH(upload({ action: "replace_cover", id: mediaId }), context)).status, 200);
  assert.notEqual(f.current.storage_path, `${vendorId}/original`);
  assert.equal(f.current.title, "New cover");
});

test("malformed multipart returns a client error", async () => {
  const f = fixture();
  const request = new Request("https://app.test", { method: "PATCH", headers: { Authorization: "Bearer ADMIN", "Content-Type": "multipart/form-data; boundary=broken" }, body: "not multipart" });
  assert.equal((await adminRoute(f).PATCH(request, context)).status, 400);
  assert.equal(storageCalls(f).length, 0);
});

test("editor returns a file version so replacing a cover invalidates its blob preview", async () => {
  const f = fixture();
  const initial = await (await adminRoute(f).GET(new Request("https://app.test", { headers: { Authorization: "Bearer ADMIN" } }), context)).json();
  assert.equal(initial.profile.media[0].fileVersion, "original");
});

test("public cover is available only on active, approved rich profiles", async () => {
  for (const [active, approved, status] of [[true, true, 200], [false, true, 404], [true, false, 404]]) {
    const f = fixture({ active, approved });
    const response = await f.load("app/api/rich-vendor-media/[type]/[id]/route.ts").GET(new Request("https://app.test"), { params: Promise.resolve({ id: mediaId, type: "asset" }) });
    assert.equal(response.status, status);
    if (status === 200) {
      assert.equal(response.headers.get("Cache-Control"), "private, no-store");
      assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
      assert.equal(response.headers.get("Content-Type"), "image/png");
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), png);
    }
  }
});

test("admin can preview an inactive cover and HEAD returns no body", async () => {
  const f = fixture({ active: false });
  const response = await f.load("app/api/rich-vendor-media/[type]/[id]/route.ts").HEAD(new Request("https://app.test", { method: "HEAD", headers: { Authorization: "Bearer ADMIN" } }), { params: Promise.resolve({ id: mediaId, type: "asset" }) });
  assert.equal(response.status, 200);
  assert.equal((await response.arrayBuffer()).byteLength, 0);
});

test("private preview allows the owner and rejects unrelated vendors and buyers", async () => {
  for (const [role, status] of [["VENDOR", 200], ["OTHER", 404], ["BUYER", 403], ["expired", 401]]) {
    const f = fixture({ active: false });
    const response = await f.load("app/api/rich-vendor-media/[type]/[id]/route.ts").GET(new Request("https://app.test", { headers: { Authorization: `Bearer ${role}` } }), { params: Promise.resolve({ id: mediaId, type: "asset" }) });
    assert.equal(response.status, status, role);
  }
});

test("invalid media IDs/types never query Storage", async () => {
  for (const params of [{ id: "invalid", type: "asset" }, { id: mediaId, type: "unknown" }]) {
    const f = fixture();
    assert.equal((await f.load("app/api/rich-vendor-media/[type]/[id]/route.ts").GET(new Request("https://app.test"), { params: Promise.resolve(params) })).status, 404);
    assert.equal(storageCalls(f).length, 0);
  }
});
