"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import {
  Search,
  User,
  Filter,
  X,
  Ban,
  CheckCircle,
  Edit2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* ================= TYPES ================= */

type UserType = {
  id: string;
  email: string;
  role: "ADMIN" | "VENDOR" | "BUYER";
  blocked?: boolean;
};

/* ================= PAGE ================= */

export default function AdminUsers() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"ALL" | "ADMIN" | "VENDOR" | "BUYER">("ALL");

  /* PAGINATION */
  const [page, setPage] = useState(1);
  const pageSize = 8;

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

  /* ================= PAGINATED ================= */

  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  const paginatedUsers = filteredUsers.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  /* ================= ACTIONS ================= */

  async function toggleBlock(user: UserType) {
    await updateDoc(doc(db, "users", user.id), {
      blocked: !user.blocked,
    });

    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, blocked: !u.blocked } : u)),
    );
  }

  async function changeRole(user: UserType, newRole: UserType["role"]) {
    await updateDoc(doc(db, "users", user.id), {
      role: newRole,
    });

    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)),
    );
  }

  /* ================= CLEAR ================= */

  function clearFilters() {
    setSearch("");
    setRole("ALL");
    setPage(1);
  }

  return (
    <div className="max-w-full mx-auto space-y-8">
      {/* ================= HEADER ================= */}
      <section>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          Users
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Manage all registered buyers, vendors and admins
        </p>
      </section>

      {/* ================= FILTER BAR ================= */}
      <section className="rounded-2xl bg-white border border-[var(--color-border)] p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by email or role"
            className="w-full rounded-xl border border-[var(--color-border)] pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ocean-blue)]/30"
          />
        </div>

        <div className="w-full md:w-full relative">
          <Filter className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value as any);
              setPage(1);
            }}
            className="w-full rounded-xl border border-[var(--color-border)] pl-9 pr-3 py-2.5 text-sm"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="BUYER">Buyer</option>
            <option value="VENDOR">Vendor</option>
          </select>
        </div>

        {(search || role !== "ALL") && (
          <button
            onClick={clearFilters}
            className="px-4 py-2.5 rounded-xl border text-sm"
          >
            <X className="h-4 w-4 inline" /> Clear
          </button>
        )}
      </section>

      {/* ================= MOBILE VIEW ================= */}
      <div className="space-y-4 md:hidden">
        {!loading &&
          paginatedUsers.map((u) => (
            <div
              key={u.id}
              className="rounded-xl border border-[var(--color-border)] bg-white p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium truncate">{u.email}</p>
                  <RoleBadge role={u.role} />
                </div>
              </div>

              <div className="flex justify-between text-xs">
                <span className={u.blocked ? "text-red-600" : "text-green-600"}>
                  {u.blocked ? "Blocked" : "Active"}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() =>
                    changeRole(u, u.role === "BUYER" ? "VENDOR" : "BUYER")
                  }
                  className="flex-1 border rounded-lg py-2 text-xs text-blue-600"
                >
                  Change Role
                </button>

                <button
                  onClick={() => toggleBlock(u)}
                  className={`flex-1 border rounded-lg py-2 text-xs ${
                    u.blocked ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {u.blocked ? "Unblock" : "Block"}
                </button>
              </div>
            </div>
          ))}
      </div>

      <section className="hidden md:block rounded-2xl bg-white border border-[var(--color-border)] overflow-x-auto">
        <table className="min-w-[700px] w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 md:px-6 py-3 text-left">User</th>
              <th className="px-3 md:px-6 py-3 text-left">Role</th>
              <th className="px-3 md:px-6 py-3 text-left">Status</th>
              <th className="px-3 md:px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {!loading &&
              paginatedUsers.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-[var(--color-border)] hover:bg-gray-50"
                >
                  {/* USER */}
                  <td className="px-3 md:px-6 py-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                    <span className="truncate max-w-[160px] md:max-w-none">
                      {u.email}
                    </span>
                  </td>

                  {/* ROLE */}
                  <td className="px-3 md:px-6 py-4">
                    <RoleBadge role={u.role} />
                  </td>

                  {/* STATUS */}
                  <td className="px-3 md:px-6 py-4">
                    {u.blocked ? (
                      <span className="text-red-600 text-xs font-medium">
                        Blocked
                      </span>
                    ) : (
                      <span className="text-green-600 text-xs font-medium">
                        Active
                      </span>
                    )}
                  </td>

                  {/* ACTIONS */}
                  <td className="px-3 md:px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    {/* CHANGE ROLE */}
                    {/* <button
                      onClick={() =>
                        changeRole(u, u.role === "BUYER" ? "VENDOR" : "BUYER")
                      }
                      className="text-blue-600 hover:underline inline-flex items-center gap-1 text-xs"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span className="hidden md:inline">Change Role</span>
                    </button> */}

                    {/* BLOCK / UNBLOCK */}
                    <button
                      onClick={() => toggleBlock(u)}
                      className={`inline-flex items-center gap-1 text-xs ${
                        u.blocked ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {u.blocked ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          <span className="hidden md:inline">Unblock</span>
                        </>
                      ) : (
                        <>
                          <Ban className="h-3 w-3" />
                          <span className="hidden md:inline">Block</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>

      {/* ================= PAGINATION ================= */}
      {totalPages > 1 && (
        <div className="flex justify-center md:justify-end items-center gap-3 text-sm flex-wrap mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="p-2 border rounded disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="text-xs md:text-sm">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="p-2 border rounded disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ================= UI ================= */

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700",
    VENDOR: "bg-blue-100 text-blue-700",
    BUYER: "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${map[role]}`}
    >
      {role}
    </span>
  );
}
