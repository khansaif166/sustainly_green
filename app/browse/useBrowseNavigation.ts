"use client";

import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBrowseNavigation } from "@/lib/browseNavigation";
import { normalizeBrowseParams } from "@/lib/browseFilters";

export function useBrowseNavigation(query: string) {
  const router = useRouter();
  const [loading, startNavigation] = useTransition();
  const [navigation] = useState(() => createBrowseNavigation(query, (href, replace) => {
    startNavigation(() => replace ? router.replace(href, { scroll: false }) : router.push(href));
  }));
  const inputs = useSyncExternalStore(navigation.subscribe, navigation.getSnapshot, navigation.getSnapshot);

  useEffect(() => { navigation.synchronize(query); }, [navigation, query]);
  useEffect(() => {
    const onHistory = () => navigation.synchronize(window.location.search.slice(1), true);
    window.addEventListener("popstate", onHistory);
    return () => { window.removeEventListener("popstate", onHistory); navigation.dispose(); };
  }, [navigation]);

  // Hide old rows during the render before the URL synchronization effect as
  // well, including Back/Forward navigation and intermediate server responses.
  const resultsParams = normalizeBrowseParams(query);
  resultsParams.sort();
  return { navigation, inputs, loading: loading || inputs.pending || resultsParams.toString() !== inputs.submittedQuery };
}
