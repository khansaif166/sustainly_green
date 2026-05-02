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
    { id: "my-certs", label: "My Certifications", icon: ShieldCheck },
    { id: "cert-master", label: "Certification Master", icon: Database },
    { id: "cert-bodies", label: "Certifying Bodies", icon: Building2 },
  ];

  return (
    <main className="min-h-screen bg-[#fafbfc] py-8 px-4 md:py-12">
      <Toaster position="top-right" richColors />
      
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-green-50 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-blue-50 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Certification Hub</h1>
            <p className="text-sm text-gray-500">Manage sustainability credentials and verification master data.</p>
          </div>
          
          <Tabs 
            tabs={tabs} 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
          />
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === "my-certs" && <RequestsTab />}
          {activeTab === "cert-master" && (
            <MasterDataTab collectionName="certificationsMaster" title="Certification" />
          )}
          {activeTab === "cert-bodies" && (
            <MasterDataTab collectionName="certifyingBodies" title="Certifying Body" />
          )}
        </div>

        {/* Footer info */}
        <div className="text-center pt-12 border-t border-gray-100/50">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">
            Sustainly Ecohub • Admin Control Panel
          </p>
        </div>
      </div>
    </main>
  );
}