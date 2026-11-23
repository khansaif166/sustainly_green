import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AddVendorForm from "../AddVendorForm";

export default function AdminAddVendorPage() {
  return (
    <div className="avn-page">
      <style>{`
        .avn-page{display:flex;flex-direction:column;gap:18px;width:100%;padding-bottom:48px;min-width:0}
        .avn-header{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:22px 26px;position:relative;overflow:hidden}
        .avn-header::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 380px 230px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .avn-header-inner{position:relative;z-index:1;display:flex;align-items:center;gap:14px}
        .avn-back{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,.1);color:#fff;border:none;cursor:pointer;flex-shrink:0;transition:background .15s;text-decoration:none}
        .avn-back:hover{background:rgba(255,255,255,.18)}
        .avn-back:focus-visible{outline:2px solid #4ade80;outline-offset:4px;border-radius:4px}
        .avn-header h1{font-size:20px;font-weight:900;color:#fff;margin:0 0 2px;letter-spacing:-.025em}
        .avn-header p{font-size:13px;color:rgba(255,255,255,.65);margin:0}
      `}</style>
      <header className="avn-header">
        <div className="avn-header-inner">
          <Link href="/admin/vendors" className="avn-back" aria-label="Back to Vendors"><ArrowLeft size={16} aria-hidden="true" /></Link>
          <div>
            <h1 id="add-vendor-title">Add Vendor</h1>
            <p>Create and publish an unclaimed business profile.</p>
          </div>
        </div>
      </header>
      <AddVendorForm />
    </div>
  );
}
