import type { Metadata } from "next";
import CertificationRequestClient from "./CertificationRequestClient";

export const metadata: Metadata = {
  title: "Certification Request",
  robots: { index: false, follow: false },
};

export default function CertificationRequestPage() {
  return <CertificationRequestClient />;
}
