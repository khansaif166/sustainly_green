import { Suspense } from "react";
import CheckEmailClient from "./CheckEmailClient";

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 text-sm text-gray-500">
          Loading email instructions...
        </main>
      }
    >
      <CheckEmailClient />
    </Suspense>
  );
}
