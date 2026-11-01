import type { ImportReceipt } from "./productImport";

export type ImportOutcome = { state: "created"; productId: string } | { state: "failed" | "uncertain"; message: string };
export type ImportWorkflow = {
  check: () => Promise<{ state: string; productId?: string | null }>;
  prepare: () => Promise<ImportReceipt>;
  upload: (index: number, path: string) => Promise<void>;
  commit: (attemptId: string) => Promise<{ state: string; productId?: string | null }>;
  abort: (attemptId: string) => Promise<{ state: string; productId?: string | null; cleanupWarning?: string }>;
  stage: (message: string) => void;
};

export async function executeImportRow(workflow: ImportWorkflow, wasUncertain = false): Promise<ImportOutcome> {
  let receipt: ImportReceipt;
  try {
    workflow.stage("Checking saved status…");
    const existing = await workflow.check();
    if (existing.state === "created" && existing.productId) return { state: "created", productId: existing.productId };
    workflow.stage("Preparing product and photos…");
    receipt = await workflow.prepare();
    if (receipt.state === "created" && receipt.productId) return { state: "created", productId: receipt.productId };
    if (receipt.state !== "prepared" || !receipt.attemptId) throw new Error("This row could not be prepared. Please retry.");
  } catch (error) {
    return { state: wasUncertain ? "uncertain" : "failed", message: error instanceof Error ? error.message : "Unable to prepare this row." };
  }
  try {
    for (let index = 0; index < receipt.images.length; index++) {
      workflow.stage(`Uploading photo ${index + 1}/${receipt.images.length}…`);
      await workflow.upload(index, receipt.images[index].path);
    }
  } catch (error) {
    // No commit was sent. Abort under the same database lock used by commit,
    // then clean up only this attempt's owned, unreferenced files.
    let cleanupWarning = "";
    try {
      const aborted = await workflow.abort(receipt.attemptId);
      if (aborted.state === "created" && aborted.productId) return { state: "created", productId: aborted.productId };
      cleanupWarning = aborted.cleanupWarning ?? "";
    } catch { cleanupWarning = "Unused photo cleanup was not confirmed; retry this row on this page."; }
    return { state: "failed", message: `${error instanceof Error ? error.message : "Photo upload failed."} ${cleanupWarning}`.trim() };
  }
  try {
    workflow.stage("Saving product…");
    const committed = await workflow.commit(receipt.attemptId);
    if (committed.state !== "created" || !committed.productId) throw new Error("Missing save confirmation.");
    return { state: "created", productId: committed.productId };
  } catch (error) {
    // A timeout/failed response does not prove rollback. Never delete these
    // images or create a new row identity: status/retry recovers the receipt.
    return { state: "uncertain", message: `Save not confirmed. Retry this row to check whether it was created. ${error instanceof Error ? error.message : ""}`.trim() };
  }
}

export async function runImportQueue<T>(items: T[], worker: (item: T) => Promise<void>) {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(2, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++];
      await worker(item);
    }
  }));
}
