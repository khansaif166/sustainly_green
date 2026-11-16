import { browseHref, browseType, normalizeBrowseParams, updateBrowseParams } from "./browseFilters";

type InputKey = "q" | "loc";
type Snapshot = { search: string; location: string; query: string; submittedQuery: string; pending: boolean };

function queryKey(params: URLSearchParams) {
  const sorted = new URLSearchParams(params);
  sorted.sort();
  return sorted.toString();
}

// Own the latest navigation target and both input drafts together. A delayed
// input must never build a URL from an older render's searchParams closure.
export function createBrowseNavigation(initial: string, navigate: (href: string, replace: boolean) => void) {
  let params = normalizeBrowseParams(initial);
  let observed = initial;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let drafts: Partial<Record<InputKey, string>> = {};
  const targets = new Set<string>();
  const listeners = new Set<() => void>();
  let snapshot: Snapshot = {
    search: params.get("q") || "", location: params.get("loc") || "", query: params.toString(),
    submittedQuery: queryKey(params), pending: false,
  };

  function publish() {
    const preview = updateBrowseParams(params, drafts, false);
    const submittedQuery = queryKey(params);
    const next = {
      search: preview.get("q") || "", location: preview.get("loc") || "", query: preview.toString(),
      submittedQuery, pending: submittedQuery !== queryKey(normalizeBrowseParams(observed)),
    };
    if (next.query !== snapshot.query || next.submittedQuery !== snapshot.submittedQuery || next.pending !== snapshot.pending) {
      snapshot = next;
      listeners.forEach(listener => listener());
    }
  }

  function cancelPending() {
    clearTimeout(timer);
    timer = undefined;
    drafts = {};
  }

  function commit(next: URLSearchParams, replace = false) {
    cancelPending();
    params = next;
    targets.add(queryKey(params));
    publish();
    navigate(browseHref(params), replace);
  }

  function update(changes: Record<string, string>, replace = false, resetPage = true) {
    commit(updateBrowseParams(params, { ...drafts, ...changes }, resetPage), replace);
  }

  return {
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => snapshot,
    input(key: InputKey, value: string) {
      drafts[key] = value;
      clearTimeout(timer);
      publish();
      timer = setTimeout(() => update({}, true), 350);
    },
    update,
    changeType(value: string) {
      if (browseType(value) === browseType(params.get("type"))) return;
      commit(new URLSearchParams({ type: browseType(value) }));
    },
    reset() { commit(new URLSearchParams({ type: browseType(params.get("type")) })); },
    pageHref(page: number) {
      return browseHref(updateBrowseParams(updateBrowseParams(params, drafts, false), { page: page > 1 ? String(page) : "" }, false));
    },
    synchronize(raw: string, historyNavigation = false) {
      const next = normalizeBrowseParams(raw);
      const key = queryKey(next);
      if (historyNavigation) {
        cancelPending();
        targets.clear();
        params = next;
      } else if (raw !== observed) {
        if (targets.has(key)) {
          // Acknowledge only this response. Other outstanding targets may still
          // arrive late and must not restore an older submitted selection.
          targets.delete(key);
        } else {
          cancelPending();
          targets.clear();
          params = next;
        }
      }
      observed = raw;
      publish();
      if (key === queryKey(params) && queryKey(new URLSearchParams(raw)) !== key && !targets.has(key)) {
        targets.add(key);
        navigate(browseHref(next), true);
      }
    },
    dispose() { cancelPending(); },
  };
}
