"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Search, User, Filter, X } from "lucide-react";

/* ================= TYPES ================= */

type UserType = {
  id: string;
  email: string;
  role: string;
};

/* ================= PAGE ================= */

export default function AdminUsers() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"ALL" | "ADMIN" | "VENDOR" | "BUYER">("ALL");

  /* ================= LOAD USERS ================= */

  useEffect(() => {
    async function loadUsers() {
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      setLoading(false);
    }
    loadUsers();
  }, []);

  /* ================= FILTERED ================= */

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.role?.toLowerCase().includes(search.toLowerCase());

      const matchRole = role === "ALL" || u.role === role;

      return matchSearch && matchRole;
    });
  }, [users, search, role]);

  /* ================= CLEAR ================= */

  function clearFilters() {
    setSearch("");
    setRole("ALL");
  }

  return (
    <div className="max-w-full mx-auto space-y-8">

      {/* ================= HEADER ================= */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            Users
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Manage all registered buyers, vendors and admins
          </p>
        </div>
      </section>

      {/* ================= FILTER BAR ================= */}
      <section
        className="
          rounded-2xl
          bg-[var(--color-bg-white)]
          border border-[var(--color-border)]
          p-4
          flex flex-col md:flex-row gap-4
        "
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-secondary)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or role"
            className="
              w-full rounded-xl
              border border-[var(--color-border)]
              pl-9 pr-3 py-2.5 text-sm
              bg-[var(--color-bg-white)]
              focus:outline-none
              focus:ring-2
              focus:ring-[var(--color-ocean-blue)]/30
            "
          />
        </div>

        {/* Role Filter */}
        <div className="w-full md:w-48 relative">
          <Filter className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-secondary)]" />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="
              w-full rounded-xl
              border border-[var(--color-border)]
              pl-9 pr-3 py-2.5 text-sm
              bg-[var(--color-bg-white)]
              focus:outline-none
              focus:ring-2
              focus:ring-[var(--color-ocean-blue)]/30
            "
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="BUYER">Buyer</option>
            <option value="VENDOR">Vendor</option>
          </select>
        </div>

        {/* Clear */}
        {(search || role !== "ALL") && (
          <button
            onClick={clearFilters}
            className="
              inline-flex items-center gap-2
              px-4 py-2.5 rounded-xl
              text-sm font-medium
              border border-[var(--color-border)]
              bg-[var(--color-bg-soft)]
              text-[var(--color-text-secondary)]
              hover:bg-[var(--color-bg-white)]
              transition
            "
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </section>

      {/* ================= TABLE ================= */}
      <section
        className="
          rounded-2xl
          bg-[var(--color-bg-white)]
          border border-[var(--color-border)]
          overflow-hidden
        "
      >
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-bg-soft)] border-b border-[var(--color-border)]">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-[var(--color-text-secondary)]">
                User
              </th>
              <th className="px-6 py-3 text-left font-medium text-[var(--color-text-secondary)]">
                Role
              </th>
            </tr>
          </thead>

          <tbody>
            {/* Loading */}
            {loading &&
              [...Array(6)].map((_, i) => (
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
                  className="px-6 py-14 text-center text-[var(--color-text-secondary)]"
                >
                  No users match the selected filters
                </td>
              </tr>
            )}

            {/* Rows */}
            {!loading &&
              filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className="
                    border-b last:border-none
                    hover:bg-[var(--color-bg-soft)]
                    transition
                  "
                >
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[var(--color-bg-soft)] flex items-center justify-center">
                      <User className="h-4 w-4 text-[var(--color-text-secondary)]" />
                    </div>
                    <span className="text-[var(--color-text-primary)]">
                      {u.email}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <RoleBadge role={u.role} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

/* ================= UI ================= */

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    ADMIN:
      "bg-purple-100 text-purple-700",
    VENDOR:
      "bg-[var(--color-ocean-blue)]/10 text-[var(--color-ocean-blue)]",
    BUYER:
      "bg-[var(--color-primary-green)]/10 text-[var(--color-primary-green)]",
  };

  return (
    <span
      className={`
        inline-flex px-3 py-1 rounded-full
        text-xs font-semibold
        ${map[role] || "bg-gray-100 text-gray-700"}
      `}
    >
      {role}
    </span>
  );
}
