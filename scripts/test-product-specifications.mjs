import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const output = mkdtempSync(join(tmpdir(), "sustainly-product-specifications-"));
const cwd = fileURLToPath(new URL("..", import.meta.url));
try {
  const compiled = spawnSync(process.execPath, [fileURLToPath(import.meta.resolve("typescript/bin/tsc")),
    "--target", "ES2020", "--module", "commonjs", "--esModuleInterop", "--skipLibCheck", "--outDir", output, "tests/productSpecifications.test.ts"], { cwd, stdio: "inherit" });
  if (compiled.error) throw compiled.error;
  if (compiled.status !== 0) process.exitCode = compiled.status ?? 1;
  else {
    const tested = spawnSync(process.execPath, ["--test", join(output, "tests/productSpecifications.test.js")], { cwd, stdio: "inherit" });
    if (tested.error) throw tested.error;
    process.exitCode = tested.status ?? 1;
  }
} finally { rmSync(output, { recursive: true, force: true }); }
