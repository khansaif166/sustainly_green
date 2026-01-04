"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Search, User } from "lucide-react";

type UserType = {
  id: string;
  email: string;
  role: string;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadUsers() {
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      setLoading(false);
    }
    loadUsers();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl p-6">
      {/* ---------- HEADER ---------- */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all registered buyers and vendors
          </p>
        </div>

        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-sm
                       focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
      </div>

      {/* ---------- TABLE CARD ---------- */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mt-10">
        {/* Table */}
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-700">
                User
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">
                Role
              </th>
            </tr>
          </thead>

          <tbody>
            {/* Loading */}
            {loading &&
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b">
                  <td className="px-6 py-4">
                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  </td>
                </tr>
              ))}

            {/* Empty */}
            {!loading && filteredUsers.length === 0 && (
              <tr>
                <td
                  colSpan={2}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No users found
                </td>
              </tr>
            )}

            {/* Rows */}
            {!loading &&
              filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className="border-b last:border-none hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                    <span className="text-gray-900">{u.email}</span>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium
                        ${
                          u.role === "ADMIN"
                            ? "bg-purple-50 text-purple-700"
                            : u.role === "VENDOR"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                    >
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
