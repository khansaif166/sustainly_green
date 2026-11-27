import assert from "node:assert/strict";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

(async () => {
  const db = new PGlite({ extensions: { citext, pgcrypto } });
  const results = [];
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
      create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;
      create function auth.role() returns text language sql stable as $$select current_user::text$$;
      create schema storage;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text,metadata jsonb);
      alter table storage.objects enable row level security;
      grant usage on schema public,auth,storage to anon,authenticated,service_role;
    `);
    for (const file of ["20260623055559_initial_sustainly_schema.sql", "20261123090000_rich_vendor_profiles.sql", "20261126090000_replace_vendor_cover.sql"]) {
      await db.exec(fs.readFileSync(`supabase/migrations/${file}`, "utf8"));
    }
    // Existing profile/ad/permission regressions use the actual original SQL suite.
    await db.exec(fs.readFileSync("supabase/tests/rich_vendor_profiles.sql", "utf8"));
    results.push({ name: "Original rich profile SQL regression suite", status: "PASS" });
    const ids = Object.fromEntries(["admin", "owner", "outsider", "buyer", "vendor", "otherVendor"].map(key => [key, randomUUID()]));
    for (const [key, role] of [["admin", "ADMIN"], ["owner", "VENDOR"], ["outsider", "VENDOR"], ["buyer", "BUYER"]]) {
      await db.query("insert into profiles(id,legacy_firebase_uid,name,email,role,vendor_approved) values($1::uuid,$1::uuid::text,$2,$3,$4,true)", [ids[key], key, `${key}@cover.test`, role]);
    }
    await db.query("insert into vendors(id,profile_id,company_name,approved) values($1,$2,'Cover supplier',true),($3,$4,'Other supplier',true)", [ids.vendor, ids.owner, ids.otherVendor, ids.outsider]);
    const write = async (action, data, actor = ids.admin, vendor = ids.vendor) => (await db.query("select write_vendor_rich_profile($1,$2,$3,$4::jsonb) as result", [vendor, actor, action, JSON.stringify(data)])).rows[0].result;
    const rows = async () => (await db.query("select * from vendor_rich_media where vendor_id=$1 and purpose='cover'", [ids.vendor])).rows;
    const check = async (name, run) => {
      try { await run(); results.push({ name, status: "PASS" }); }
      catch (error) { results.push({ name, status: "FAIL", message: error.message }); }
    };
    let coverId;
    await check("Admin can upload a cover before activating Rich Profile", async () => {
      coverId = (await write("add_media", { purpose: "cover", title: "Original", storagePath: `${ids.vendor}/original`, mimeType: "image/png" })).id;
      assert.equal((await rows()).length, 1);
    });
    await check("Second add is rejected and original cover survives", async () => {
      await assert.rejects(write("add_media", { purpose: "cover", title: "Duplicate", storagePath: `${ids.vendor}/duplicate`, mimeType: "image/png" }), error => error.code === "23514");
      assert.equal((await rows())[0].storage_path, `${ids.vendor}/original`);
    });
    const replacement = { id: coverId, title: "Updated cover", storagePath: `${ids.vendor}/replacement`, mimeType: "image/webp" };
    await check("Replacement at the one-cover limit is atomic and returns the old path", async () => {
      const result = await write("replace_cover", replacement);
      assert.deepEqual(result, { id: coverId, oldPath: `${ids.vendor}/original` });
      const [row] = await rows();
      assert.equal((await rows()).length, 1);
      assert.equal(row.id, coverId); assert.equal(row.storage_path, replacement.storagePath);
      assert.equal(row.title, "Updated cover"); assert.equal(row.mime_type, "image/webp"); assert.equal(row.source_url, null);
    });
    await check("Invalid replacement payload rolls back without touching current cover", async () => {
      for (const patch of [{ storagePath: "" }, { storagePath: `${ids.otherVendor}/foreign` }, { mimeType: "application/pdf" }, { mimeType: null }, { title: " " }, { sourceUrl: "https://example.test/image.png" }]) {
        await assert.rejects(write("replace_cover", { ...replacement, ...patch }), error => error.code === "23514");
        assert.equal((await rows())[0].storage_path, replacement.storagePath);
      }
    });
    await check("Unknown ID and other vendor's cover cannot be replaced", async () => {
      await assert.rejects(write("replace_cover", { ...replacement, id: randomUUID() }), error => error.code === "P0002");
      await assert.rejects(write("replace_cover", replacement, ids.admin, ids.otherVendor), error => error.code === "P0002");
      await assert.rejects(write("replace_cover", replacement, ids.outsider), error => error.code === "P0002");
    });
    await check("Replacing a non-cover media ID is rejected", async () => {
      const gallery = await write("add_media", { purpose: "gallery", title: "Gallery", storagePath: `${ids.vendor}/gallery`, mimeType: "image/png" });
      await assert.rejects(write("replace_cover", { ...replacement, id: gallery.id }), error => error.code === "P0002");
    });
    await check("Inactive vendor and buyer cannot replace covers", async () => {
      await assert.rejects(write("replace_cover", replacement, ids.owner), error => error.code === "42501");
      await assert.rejects(write("replace_cover", replacement, ids.buyer), error => error.code === "42501");
    });
    await check("Approved owner can replace cover after activation", async () => {
      await write("activate", { active: true });
      const result = await write("replace_cover", { ...replacement, storagePath: `${ids.vendor}/owner` }, ids.owner);
      assert.equal(result.id, coverId); assert.equal(result.oldPath, replacement.storagePath);
    });
    await check("Replacement racing after deletion fails without recreating the cover", async () => {
      const result = await write("delete_media", { id: coverId });
      assert.equal(result.oldPath, `${ids.vendor}/owner`);
      await assert.rejects(write("replace_cover", replacement), error => error.code === "P0002");
      assert.equal((await rows()).length, 0);
    });
    await check("Anonymous/authenticated roles cannot execute the write RPC", async () => {
      for (const role of ["anon", "authenticated"]) {
        await db.exec(`set role ${role}`);
        try { await assert.rejects(write("replace_cover", replacement), error => error.code === "42501"); }
        finally { await db.exec("reset role"); }
      }
    });
    console.log(JSON.stringify(results, null, 2));
    fs.writeFileSync(fileURLToPath(new URL("database-results.json", import.meta.url)), JSON.stringify(results, null, 2) + "\n");
    if (results.some(result => result.status === "FAIL")) process.exitCode = 1;
  } finally { await db.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
