"use client";

import React, { useEffect, useState } from "react";
import { Table, THead, TBody, TH, TD, Badge, Button, Drawer } from "./UI";
import { ExternalLink, User, Phone, Mail, MapPin, Users, Briefcase, Calendar, Info } from "lucide-react";
import { getStoredSession } from "@/lib/supabaseAuth";

export const RequestsTab = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  function getAuthHeaders() {
    const session = getStoredSession();
    if (!session) throw new Error("Please sign in again.");
    return {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    };
  }

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/admin/certifications/requests", {
          headers: { Authorization: getAuthHeaders().Authorization },
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error?.message || "Unable to load requests.");
        }

        setData(payload.requests || []);
      } catch (error) {
        console.error("Error loading requests:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    try {
      const response = await fetch(`/api/admin/certifications/requests/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message || "Unable to update request.");
      }

      setData((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item)),
      );
      setSelectedRequest((prev: any) => prev ? { ...prev, status } : prev);
    } catch (error) {
      console.error("Error updating request:", error);
    }
  }

  const DetailItem = ({ icon: Icon, label, value, fullWidth = false }: any) => (
    <div className={`p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3 ${fullWidth ? 'col-span-full' : ''}`}>
      <div className="mt-1 text-gray-400">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-gray-900 mt-0.5">{value || "—"}</p>
      </div>
    </div>
  );

  if (loading) return <div className="py-20 text-center text-gray-400">Loading requests...</div>;
  if (data.length === 0) return <div className="py-20 text-center text-gray-400">No certification requests found.</div>;

  return (
    <div className="space-y-6">
      <Table>
        <THead>
          <tr>
            <TH>Company</TH>
            <TH>Certification</TH>
            <TH>Submitted Date</TH>
            <TH>Status</TH>
            <TH className="text-right">Actions</TH>
          </tr>
        </THead>
        <TBody>
          {data.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
              <TD>
                <div className="font-bold text-gray-900">{r.companyName}</div>
                <div className="text-xs text-gray-400">{r.email}</div>
              </TD>
              <TD>
                <div className="font-medium text-gray-700">{r.certificationName}</div>
              </TD>
              <TD>
                <div className="text-gray-500">
                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "-"}
                </div>
              </TD>
              <TD>
                <Badge variant={r.status || "pending"}>{r.status || "pending"}</Badge>
              </TD>
              <TD className="text-right">
                <Button variant="outline" size="sm" onClick={() => setSelectedRequest(r)}>
                  View Details <ExternalLink size={12} />
                </Button>
              </TD>
            </tr>
          ))}
        </TBody>
      </Table>

      <Drawer 
        isOpen={!!selectedRequest} 
        onClose={() => setSelectedRequest(null)} 
        title="Certification Request Details"
      >
        {selectedRequest && (
          <div className="space-y-8">
            
            {/* Header / Summary */}
            <div className="flex flex-col gap-4 p-6 bg-gray-900 rounded-3xl text-white shadow-xl">
              <div className="flex items-center justify-between">
                <Badge variant={selectedRequest.status} className="bg-white/10 border-white/20 text-white">
                  {selectedRequest.status}
                </Badge>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                  {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleDateString() : "-"}
                </p>
              </div>
              <div>
                <h4 className="text-2xl font-black">{selectedRequest.companyName}</h4>
                <p className="text-gray-400 text-sm mt-1">{selectedRequest.certificationName}</p>
              </div>
            </div>

            {/* Grid Sections */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-full">
                <h5 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <User size={14} className="text-green-600" /> Contact Information
                </h5>
              </div>
              <DetailItem icon={User} label="Contact Person" value={selectedRequest.contactPerson} />
              <DetailItem icon={Briefcase} label="Designation" value={selectedRequest.designation} />
              <DetailItem icon={Mail} label="Email Address" value={selectedRequest.email} />
              <DetailItem icon={Phone} label="Phone Number" value={selectedRequest.phone} />

              <div className="col-span-full mt-4">
                <h5 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Briefcase size={14} className="text-green-600" /> Business Overview
                </h5>
              </div>
              <DetailItem icon={Users} label="Employees" value={selectedRequest.employees} />
              <DetailItem icon={MapPin} label="Locations" value={selectedRequest.locations} />
              <DetailItem icon={Info} label="Business Scope" value={selectedRequest.businessScope} fullWidth />

              <div className="col-span-full mt-4">
                <h5 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-green-600" /> Certification Specs
                </h5>
              </div>
              <DetailItem icon={Calendar} label="Timeline" value={selectedRequest.timeline} />
              <DetailItem icon={ShieldCheck} label="Previous Cert" value={selectedRequest.previousCertification} />
              
              {selectedRequest.message && (
                <div className="col-span-full mt-4">
                  <h5 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Info size={14} className="text-green-600" /> Additional Message
                  </h5>
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm text-gray-700 italic">
                    "{selectedRequest.message}"
                  </div>
                </div>
              )}
            </div>

            <div className="pt-12 pb-8 flex flex-col gap-3">
              <Button
                variant="primary"
                className="w-full py-4 rounded-2xl shadow-lg shadow-green-100"
                onClick={() => updateStatus(selectedRequest.id, "APPROVED")}
              >
                Approve Request
              </Button>
              <Button variant="outline" className="w-full py-4 rounded-2xl" onClick={() => setSelectedRequest(null)}>Close</Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

// Add ShieldCheck icon since it's used
const ShieldCheck = ({ size, className }: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
