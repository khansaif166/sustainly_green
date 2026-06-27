"use client";

import React, { useState } from "react";
import { Tabs } from "./_components/UI";
import { RequestsTab } from "./_components/RequestsTab";
import { MasterDataTab } from "./_components/MasterDataTab";
import { Toaster } from "sonner";
import { ShieldCheck, Database, Building2 } from "lucide-react";

export default function AdminCertificationsPage() {
  const [activeTab, setActiveTab] = useState("my-certs");

  const tabs = [
    { id: "my-certs",    label: "My Certifications",    icon: ShieldCheck },
    { id: "cert-master", label: "Certification Master", icon: Database    },
    { id: "cert-bodies", label: "Certifying Bodies",    icon: Building2   },
  ];

  return (
    <>
      <style>{`
        .acrt-page{display:flex;flex-direction:column;gap:18px;padding-bottom:40px}
        .acrt-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:22px 26px;position:relative;overflow:hidden}
        .acrt-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 380px 230px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .acrt-hero-inner{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
        .acrt-hero-title{font-size:21px;font-weight:900;color:#fff;margin:0 0 3px;letter-spacing:-.025em}
        .acrt-hero-sub{font-size:13px;color:rgba(255,255,255,.38);margin:0}
        .acrt-content{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.04)}
      `}</style>
      <Toaster position="top-right" richColors />

      <div className="acrt-page">
        <div className="acrt-hero">
          <div className="acrt-hero-inner">
            <div>
              <h1 className="acrt-hero-title">Certification Hub</h1>
              <p className="acrt-hero-sub">Manage sustainability credentials and verification master data</p>
            </div>
            <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>

        <div className="acrt-content" style={{ padding: 20 }}>
          {activeTab === "my-certs"    && <RequestsTab />}
          {activeTab === "cert-master" && <MasterDataTab collectionName="certificationsMaster" title="Certification" />}
          {activeTab === "cert-bodies" && <MasterDataTab collectionName="certifyingBodies" title="Certifying Body" />}
        </div>
      </div>
    </>
  );
}
