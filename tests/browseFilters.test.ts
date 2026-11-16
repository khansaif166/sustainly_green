import assert from "node:assert/strict";
import test from "node:test";
import { browseSort, normalizeBrowseParams, updateBrowseParams } from "../lib/browseFilters";
import { createBrowseNavigation } from "../lib/browseNavigation";

const waitForInput = () => new Promise(resolve => setTimeout(resolve, 390));
function fixture(query: string) {
  const calls: Array<{ href: string; replace: boolean }> = [];
  const navigation = createBrowseNavigation(query, (href, replace) => calls.push({ href, replace }));
  return { navigation, calls, params: () => new URL(calls.at(-1)!.href, "https://example.test").searchParams };
}

test("all six type switches start fresh; clicking the current type keeps filters", () => {
  for (const source of ["Product", "Vendor", "Service"]) {
    for (const target of ["Product", "Vendor", "Service"]) {
      const { navigation, calls, params } = fixture(`type=${source}&q=desk&category=computers&subcategory=s1&product_type=t1&badge=verified&loc=Delhi&claim_status=CLAIMED&sort=name_az&page=3`);
      navigation.changeType(target);
      if (source === target) assert.equal(calls.length, 0);
      else assert.deepEqual([...params()], [["type", target]]);
      navigation.dispose();
    }
  }
});

test("a delayed search cannot undo a type switch or Reset", async () => {
  for (const action of ["switch", "reset"]) {
    const { navigation, calls, params } = fixture("type=Vendor&badge=verified&page=2");
    navigation.input("q", "desk");
    if (action === "switch") navigation.changeType("Service");
    else navigation.reset();
    await waitForInput();
    assert.equal(calls.length, 1);
    assert.deepEqual([...params()], [["type", action === "switch" ? "Service" : "Vendor"]]);
    assert.equal(navigation.getSnapshot().search, "");
    navigation.dispose();
  }
});

test("ordinary filter changes preserve pending input and clear dependent taxonomy", async () => {
  const { navigation, calls, params } = fixture("type=Product&category=computers&subcategory=s1&product_type=t1&page=3");
  navigation.input("q", "desk");
  navigation.update({ category: "packing" });
  navigation.update({ badge: "eco_verified" });
  await waitForInput();
  assert.equal(calls.length, 2);
  assert.equal(params().get("q"), "desk");
  assert.equal(params().get("category"), "packing");
  assert.equal(params().get("badge"), "eco_verified");
  for (const key of ["subcategory", "product_type", "page"]) assert.equal(params().has(key), false);
  navigation.dispose();
});

test("search and location share one debounced update without dropping either field", async () => {
  const { navigation, calls, params } = fixture("type=Vendor&page=3");
  navigation.input("q", "equipment");
  navigation.input("loc", "Delhi");
  await waitForInput();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].replace, true);
  assert.equal(params().get("q"), "equipment");
  assert.equal(params().get("loc"), "Delhi");
  assert.equal(params().has("page"), false);
  navigation.dispose();
});

test("intermediate server responses do not replace a newer target or input draft", async () => {
  const { navigation, calls, params } = fixture("type=Product");
  navigation.update({ category: "computers" });
  const first = new URL(calls[0].href, "https://example.test").search.slice(1);
  navigation.update({ subcategory: "s1" });
  const second = new URL(calls[1].href, "https://example.test").search.slice(1);
  navigation.input("q", "desktop");
  navigation.synchronize(first);
  navigation.synchronize(second);
  await waitForInput();
  assert.equal(params().get("subcategory"), "s1");
  assert.equal(params().get("q"), "desktop");
  navigation.dispose();
});

test("history navigation restores inputs and cancels pending work", async () => {
  const { navigation, calls } = fixture("type=Vendor&q=old&loc=Pune");
  navigation.input("q", "pending");
  navigation.synchronize("type=Service&q=consulting", true);
  await waitForInput();
  assert.equal(calls.length, 0);
  assert.equal(navigation.getSnapshot().search, "consulting");
  assert.equal(navigation.getSnapshot().location, "");
  navigation.dispose();
});

test("unmount cancels delayed input updates", async () => {
  const { navigation, calls } = fixture("type=Vendor");
  navigation.input("loc", "Delhi");
  navigation.dispose();
  await waitForInput();
  assert.equal(calls.length, 0);
});

test("pagination retains draft and URL filters and can return to page one", () => {
  const { navigation, params } = fixture("type=Vendor&badge=unclaimed&claim_status=UNCLAIMED&sort=name_az");
  navigation.input("q", "office");
  const link = new URL(navigation.pageHref(2), "https://example.test").searchParams;
  assert.equal(link.get("q"), "office");
  assert.equal(link.get("badge"), "unclaimed");
  navigation.update({ page: "2" }, false, false);
  assert.equal(params().get("page"), "2");
  navigation.update({ page: "" }, false, false);
  assert.equal(params().has("page"), false);
  assert.equal(params().get("q"), "office");
  navigation.dispose();
});

test("subcategory removal clears its type; category removal clears both descendants", () => {
  const query = new URLSearchParams("type=Product&category=c1&subcategory=s1&product_type=t1");
  const sub = updateBrowseParams(query, { subcategory: "" });
  assert.equal(sub.has("subcategory"), false);
  assert.equal(sub.has("product_type"), false);
  assert.equal(sub.get("category"), "c1");
  const cat = updateBrowseParams(query, { category: "" });
  assert.deepEqual([...cat], [["type", "Product"]]);
});

test("legacy sort and badge links normalize; invalid hierarchy values are kept for rejection", () => {
  assert.equal(browseSort("eco_score"), "newest");
  assert.equal(browseSort("name_az"), "name_az");
  const params = normalizeBrowseParams("type=Vendor&sort=eco_score&badge=listed&category=computers&subcategory=invalid&claim_status=ALL");
  assert.equal(params.get("badge"), "unclaimed");
  assert.equal(params.has("sort"), false);
  assert.equal(params.has("category"), false);
  assert.equal(params.has("claim_status"), false);
  assert.equal(params.get("subcategory"), "invalid");
});

test("normalization replaces a legacy URL once and not on every render", () => {
  const { navigation, calls } = fixture("type=Product&sort=eco_score");
  navigation.synchronize("type=Product&sort=eco_score");
  navigation.synchronize("type=Product&sort=eco_score");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].href, "/browse?type=Product");
  assert.equal(calls[0].replace, true);
  navigation.dispose();
});

test("unsupported badge facets cannot appear active while being ignored by the query", () => {
  assert.equal(normalizeBrowseParams("type=Service&badge=verified").has("badge"), false);
  assert.equal(normalizeBrowseParams("type=Vendor&badge=eco_verified").has("badge"), false);
  assert.equal(normalizeBrowseParams("type=Product&badge=eco_verified").get("badge"), "eco_verified");
  assert.equal(normalizeBrowseParams("type=Vendor&badge=approved").get("badge"), "approved");
});

test("submitted selection and pending state publish together before navigation", () => {
  const navigation = createBrowseNavigation("type=Product&category=computers", () => {
    assert.equal(new URLSearchParams(navigation.getSnapshot().submittedQuery).has("category"), false);
    assert.equal(navigation.getSnapshot().pending, true);
  });
  const snapshots: ReturnType<typeof navigation.getSnapshot>[] = [];
  navigation.subscribe(() => snapshots.push(navigation.getSnapshot()));
  navigation.update({ category: "" });
  assert.equal(snapshots.length, 1);
  assert.equal(snapshots[0].pending, true);
  navigation.synchronize("type=Product");
  assert.equal(navigation.getSnapshot().pending, false);
  navigation.dispose();
});

test("input drafts do not change submitted chips or start loading before submission", async () => {
  const { navigation, calls } = fixture("type=Vendor&q=old&loc=Delhi");
  navigation.input("q", "new");
  navigation.input("loc", "Pune");
  const draft = navigation.getSnapshot();
  assert.equal(draft.search, "new");
  assert.equal(new URLSearchParams(draft.submittedQuery).get("q"), "old");
  assert.equal(new URLSearchParams(draft.submittedQuery).get("loc"), "Delhi");
  assert.equal(draft.pending, false);
  let notified = false;
  navigation.subscribe(() => { notified = true; });
  await waitForInput();
  assert.equal(calls.length, 1);
  assert.equal(notified, true, "Committing an unchanged preview must still notify subscribers");
  assert.equal(navigation.getSnapshot().pending, true);
  assert.equal(new URLSearchParams(navigation.getSnapshot().submittedQuery).get("loc"), "Pune");
  navigation.dispose();
});

test("rapid removals preserve the latest selection while intermediate responses are pending", () => {
  const { navigation, calls } = fixture("type=Product&category=c1&subcategory=s1&product_type=t1&badge=eco_verified&q=desk&page=2");
  navigation.update({ subcategory: "" });
  navigation.update({ badge: "" });
  navigation.update({ q: "" });
  const latest = navigation.getSnapshot().submittedQuery;
  assert.deepEqual([...new URLSearchParams(latest)], [["category", "c1"], ["type", "Product"]]);
  for (const call of calls.slice(0, -1)) {
    navigation.synchronize(new URL(call.href, "https://example.test").search.slice(1));
    assert.equal(navigation.getSnapshot().submittedQuery, latest);
    assert.equal(navigation.getSnapshot().pending, true);
  }
  navigation.synchronize(new URL(calls.at(-1)!.href, "https://example.test").search.slice(1));
  assert.equal(navigation.getSnapshot().pending, false);
  navigation.dispose();
});

test("an older response after the latest response cannot restore removed filters", () => {
  const { navigation, calls } = fixture("type=Product&category=c1&badge=eco_verified");
  navigation.update({ badge: "" });
  navigation.reset();
  const latest = navigation.getSnapshot().submittedQuery;
  navigation.synchronize(new URL(calls[1].href, "https://example.test").search.slice(1));
  assert.equal(navigation.getSnapshot().pending, false);
  navigation.synchronize(new URL(calls[0].href, "https://example.test").search.slice(1));
  assert.equal(navigation.getSnapshot().submittedQuery, latest);
  assert.equal(navigation.getSnapshot().pending, true, "Old results must remain hidden");
  navigation.dispose();
});

test("Reset with unchanged results and returning to the loaded selection do not leave a loader", () => {
  const { navigation } = fixture("type=Product");
  navigation.reset();
  assert.equal(navigation.getSnapshot().pending, false);
  navigation.update({ category: "c1" });
  assert.equal(navigation.getSnapshot().pending, true);
  navigation.update({ category: "" });
  assert.equal(navigation.getSnapshot().pending, false);
  navigation.dispose();
});

test("history replaces an optimistic selection and cancels its pending input", async () => {
  const { navigation, calls } = fixture("type=Product&category=c1");
  navigation.reset();
  navigation.input("q", "pending");
  navigation.synchronize("type=Vendor&loc=Delhi", true);
  await waitForInput();
  assert.equal(calls.length, 1);
  assert.equal(navigation.getSnapshot().pending, false);
  assert.equal(navigation.getSnapshot().submittedQuery, "loc=Delhi&type=Vendor");
  navigation.dispose();
});
