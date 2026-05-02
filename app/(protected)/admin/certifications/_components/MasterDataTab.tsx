"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Table, THead, TBody, TH, TD, Badge, Button, Modal, cn } from "./UI";
import { Edit2, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

interface MasterDataTabProps {
  collectionName: string;
  title: string;
}

export const MasterDataTab = ({ collectionName, title }: MasterDataTabProps) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", description: "", country: "", status: "Active" });

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, collectionName), orderBy("name", "asc")));
      setData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error loading master data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [collectionName]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Name is required");

    try {
      if (editingItem) {
        await updateDoc(doc(db, collectionName, editingItem.id), formData);
        toast.success(`${title} updated successfully`);
      } else {
        await addDoc(collection(db, collectionName), { ...formData, createdAt: new Date() });
        toast.success(`${title} added successfully`);
      }
      setIsModalOpen(false);
      load();
    } catch (error) {
      toast.error("Error saving data");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this?")) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      toast.success("Deleted successfully");
      load();
    } catch (error) {
      toast.error("Error deleting data");
    }
  };

  const openModal = (item: any = null) => {
    setEditingItem(item);
    setFormData(item ? { 
      name: item.name, 
      description: item.description || "", 
      country: item.country || "", 
      status: item.status || "Active" 
    } : { name: "", description: "", country: "", status: "Active" });
    setIsModalOpen(true);
  };

  if (loading) return <div className="py-20 text-center text-gray-400">Loading {title}...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500">Manage dropdown data for vendor onboarding</p>
        </div>
        <Button onClick={() => openModal()} className="shadow-lg shadow-green-100">
          <Plus size={18} /> Add New
        </Button>
      </div>

      <Table>
        <THead>
          <tr>
            <TH>Name</TH>
            {collectionName === "certifyingBodies" && <TH>Country</TH>}
            <TH>Status</TH>
            <TH className="text-right">Actions</TH>
          </tr>
        </THead>
        <TBody>
          {data.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
              <TD>
                <div className="font-bold text-gray-900">{item.name}</div>
                {item.description && <div className="text-xs text-gray-400 max-w-xs truncate">{item.description}</div>}
              </TD>
              {collectionName === "certifyingBodies" && <TD>{item.country || "—"}</TD>}
              <TD>
                <Badge variant={item.status === "Active" ? "active" : "inactive"}>
                  {item.status}
                </Badge>
              </TD>
              <TD className="text-right">
                <div className="flex justify-end gap-2">
                  <button onClick={() => openModal(item)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-green-600 transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </TD>
            </tr>
          ))}
        </TBody>
      </Table>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? `Edit ${title}` : `Add New ${title}`}>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Name *</label>
            <input 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              placeholder={`Enter ${title} name`}
            />
          </div>
          {collectionName === "certificationsMaster" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all resize-none"
                rows={3}
                placeholder="Brief description..."
              />
            </div>
          )}
          {collectionName === "certifyingBodies" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Country</label>
              <input 
                value={formData.country}
                onChange={e => setFormData({...formData, country: e.target.value})}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                placeholder="e.g. USA, UK, India"
              />
            </div>
          )}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="text-sm font-medium text-gray-700">Status</span>
            <div className="flex gap-2">
              {["Active", "Inactive"].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFormData({...formData, status: s})}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                    formData.status === s ? "bg-white text-green-600 shadow-sm border border-gray-200" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Save {title}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
