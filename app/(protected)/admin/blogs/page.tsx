"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Plus, Trash2, FileText, Pencil, X } from "lucide-react";
import { getStoredSession } from "@/lib/supabaseAuth";
import { uploadFileToSupabaseStorage } from "@/lib/storage";

type Blog = {
  id: string;
  title: string;
  content: string;
  image: string;
  imageUrl: string;
  published: boolean;
};

const pageSize = 6;

export default function BlogAdminPage() {
  const [open,       setOpen]       = useState(false);
  const [title,      setTitle]      = useState("");
  const [imageUrl,   setImageUrl]   = useState("");
  const [imageFile,  setImageFile]  = useState<File | null>(null);
  const [preview,    setPreview]    = useState("");
  const [blogs,      setBlogs]      = useState<Blog[]>([]);
  const [editing,    setEditing]    = useState(false);
  const [editingId,  setEditingId]  = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [offset,     setOffset]     = useState(0);
  const [hasMore,    setHasMore]    = useState(false);

  const editor = useEditor({ extensions: [StarterKit], content: "", immediatelyRender: false });

  function getAuthHeaders() {
    const session = getStoredSession();
    if (!session) throw new Error("Please sign in again.");
    return { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" };
  }

  function handleImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function loadBlogs(next = false) {
    const nextOffset = next ? offset : 0;
    const res = await fetch(`/api/admin/blogs?${new URLSearchParams({ limit: String(pageSize), offset: String(nextOffset) })}`, {
      headers: { Authorization: getAuthHeaders().Authorization },
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload?.error?.message || "Unable to load blogs.");
    const rows = payload.blogs || [];
    setBlogs(prev => next ? [...prev, ...rows] : rows);
    setOffset(nextOffset + rows.length);
    setHasMore(rows.length === pageSize);
  }

  async function publishBlog() {
    const content = editor?.getHTML() || "";
    if (!title.trim() || !content.trim()) { setError("Title and content are required."); return; }
    try {
      setLoading(true);
      setError("");
      const authHeaders = getAuthHeaders();
      const uploadedImage = imageFile
        ? await uploadFileToSupabaseStorage(imageFile, { bucket: "marketplace", folder: "blogs", accessToken: authHeaders.Authorization.replace(/^Bearer\s+/i, "") })
        : null;
      const finalImageUrl = uploadedImage?.url || imageUrl;
      const res = await fetch(editing ? `/api/admin/blogs/${editingId}` : "/api/admin/blogs", {
        method: editing ? "PATCH" : "POST",
        headers: authHeaders,
        body: JSON.stringify({ title, content, imageUrl: finalImageUrl, published: true }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error?.message || "Unable to save blog.");
      resetForm();
      await loadBlogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save blog.");
    } finally { setLoading(false); }
  }

  function resetForm() {
    setTitle(""); setImageUrl(""); setImageFile(null); setPreview("");
    setEditing(false); setEditingId(""); setOpen(false);
    editor?.commands.setContent(""); setError("");
  }

  function editBlog(blog: Blog) {
    setOpen(true); setEditing(true); setEditingId(blog.id);
    setTitle(blog.title); setImageFile(null);
    setImageUrl(blog.imageUrl || blog.image || "");
    setPreview(blog.imageUrl || blog.image || "");
    editor?.commands.setContent(blog.content || "");
  }

  async function deleteBlog(id: string) {
    if (!confirm("Delete this blog?")) return;
    try {
      const res = await fetch(`/api/admin/blogs/${id}`, { method: "DELETE", headers: { Authorization: getAuthHeaders().Authorization } });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error?.message || "Unable to delete blog.");
      setBlogs(prev => prev.filter(b => b.id !== id));
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to delete blog."); }
  }

  useEffect(() => {
    loadBlogs().catch(err => setError(err instanceof Error ? err.message : "Unable to load blogs."));
  }, []);

  return (
    <>
      <style>{`
        .abl-page{display:flex;flex-direction:column;gap:18px;padding-bottom:40px}
        .abl-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:22px 26px;position:relative;overflow:hidden}
        .abl-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 380px 230px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .abl-hero-inner{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
        .abl-hero-title{font-size:21px;font-weight:900;color:#fff;margin:0 0 3px;letter-spacing:-.025em}
        .abl-hero-sub{font-size:13px;color:rgba(255,255,255,.38);margin:0}
        .abl-stat-val{font-size:26px;font-weight:900;color:#4ade80;letter-spacing:-.03em;line-height:1;margin:0;text-align:right}
        .abl-stat-label{font-size:10.5px;color:rgba(255,255,255,.3);margin:3px 0 0;font-weight:600;text-transform:uppercase;letter-spacing:.05em;text-align:right}
        .abl-create-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:50px;font-size:13px;font-weight:700;background:rgba(255,255,255,.15);color:#fff;border:1.5px solid rgba(255,255,255,.2);cursor:pointer;font-family:inherit;transition:all .15s}
        .abl-create-btn:hover{background:rgba(255,255,255,.22)}

        .abl-err{background:#fef2f2;border:1px solid rgba(220,38,38,.12);border-radius:14px;padding:12px 16px;font-size:13px;color:#dc2626}
        .abl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
        .abl-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.04);display:flex;flex-direction:column}
        .abl-card-img{width:100%;height:170px;object-fit:cover;display:block;background:#f0fdf4}
        .abl-card-img-ph{width:100%;height:170px;background:#f0fdf4;display:flex;align-items:center;justify-content:center}
        .abl-card-body{padding:14px 16px;flex:1}
        .abl-card-title{font-size:14px;font-weight:800;color:#111;margin:0 0 5px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
        .abl-card-excerpt{font-size:12.5px;color:#6b7280;margin:0;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
        .abl-card-foot{padding:10px 16px;border-top:1px solid #f3f4f6;display:flex;gap:10px}
        .abl-edit-btn{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:700;color:#3b82f6;background:transparent;border:none;cursor:pointer;font-family:inherit;padding:0}
        .abl-del-btn{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:700;color:#dc2626;background:transparent;border:none;cursor:pointer;font-family:inherit;padding:0}
        .abl-more-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 20px;border-radius:50px;font-size:13px;font-weight:700;background:#fff;border:1.5px solid rgba(0,0,0,.1);color:#374151;cursor:pointer;font-family:inherit;transition:all .15s}
        .abl-more-btn:hover{background:#f9fafb}

        .abl-empty{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:16px;padding:40px 24px;text-align:center;color:#9ca3af}

        .abl-overlay{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center}
        .abl-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.45)}
        .abl-modal{position:relative;width:100%;max-width:720px;background:#fff;border-radius:24px;box-shadow:0 24px 60px rgba(0,0,0,.2);padding:28px;max-height:90vh;overflow-y:auto}
        .abl-modal-close{position:absolute;right:18px;top:18px;width:32px;height:32px;border-radius:50%;border:none;background:#f3f4f6;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s}
        .abl-modal-close:hover{background:#e5e7eb}
        .abl-modal-title{font-size:20px;font-weight:900;color:#111;margin:0 0 20px;letter-spacing:-.02em}
        .abl-modal-label{font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px}
        .abl-modal-input{width:100%;padding:11px 14px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;color:#111;box-sizing:border-box;transition:border .15s}
        .abl-modal-input:focus{border-color:#16a34a}
        .abl-upload-zone{display:flex;flex-direction:column;align-items:center;justify-content:center;border:2px dashed rgba(0,0,0,.12);border-radius:14px;padding:24px;cursor:pointer;transition:all .15s;text-align:center;font-size:13px;color:#9ca3af}
        .abl-upload-zone:hover{border-color:#16a34a;background:#f0fdf4;color:#16a34a}
        .abl-editor-wrap{border:1.5px solid rgba(0,0,0,.1);border-radius:14px;background:#f9fafb;padding:14px;min-height:220px}
        .abl-editor-wrap:focus-within{border-color:#16a34a;background:#fff}
        .abl-publish-btn{width:100%;padding:12px;border-radius:50px;font-size:14px;font-weight:700;background:#16a34a;color:#fff;border:none;cursor:pointer;font-family:inherit;box-shadow:0 3px 10px rgba(22,163,74,.3);transition:all .15s}
        .abl-publish-btn:disabled{opacity:.6;cursor:not-allowed}
        .abl-gap{display:flex;flex-direction:column;gap:16px}
      `}</style>

      <div className="abl-page">

        {/* Hero */}
        <div className="abl-hero">
          <div className="abl-hero-inner">
            <div>
              <h1 className="abl-hero-title">Blogs</h1>
              <p className="abl-hero-sub">Create and manage platform content</p>
            </div>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <div>
                <p className="abl-stat-val">{blogs.length}</p>
                <p className="abl-stat-label">Published</p>
              </div>
              <button onClick={() => setOpen(true)} className="abl-create-btn">
                <Plus size={14} /> Create Blog
              </button>
            </div>
          </div>
        </div>

        {error && <div className="abl-err">{error}</div>}

        {/* Grid */}
        {blogs.length === 0 ? (
          <div className="abl-empty">
            <FileText size={36} color="#d1fae5" style={{ margin: "0 auto 10px" }} />
            <p style={{ fontSize: 14, fontWeight: 700, color: "#374151", margin: "0 0 4px" }}>No blogs yet</p>
            <p style={{ fontSize: 13, margin: 0 }}>Create your first blog to get started.</p>
          </div>
        ) : (
          <>
            <div className="abl-grid">
              {blogs.map(blog => (
                <div key={blog.id} className="abl-card">
                  {(blog.image || blog.imageUrl)
                    ? <img src={blog.imageUrl || blog.image} alt={blog.title} className="abl-card-img" />
                    : <div className="abl-card-img-ph"><FileText size={28} color="#86efac" /></div>
                  }
                  <div className="abl-card-body">
                    <p className="abl-card-title">{blog.title}</p>
                    <p className="abl-card-excerpt">{blog.content.replace(/<[^>]+>/g, "")}</p>
                  </div>
                  <div className="abl-card-foot">
                    <button onClick={() => editBlog(blog)} className="abl-edit-btn"><Pencil size={12} />Edit</button>
                    <button onClick={() => deleteBlog(blog.id)} className="abl-del-btn"><Trash2 size={12} />Delete</button>
                  </div>
                </div>
              ))}
            </div>
            {hasMore && (
              <div>
                <button onClick={() => loadBlogs(true).catch(err => setError(err instanceof Error ? err.message : "Error"))} className="abl-more-btn">
                  Load More
                </button>
              </div>
            )}
          </>
        )}

        {/* Modal */}
        {open && (
          <div className="abl-overlay">
            <div className="abl-backdrop" onClick={resetForm} />
            <div className="abl-modal">
              <button onClick={resetForm} className="abl-modal-close"><X size={15} /></button>
              <p className="abl-modal-title">{editing ? "Edit Blog" : "Create Blog"}</p>
              <div className="abl-gap">
                <div>
                  <p className="abl-modal-label">Blog Title</p>
                  <input className="abl-modal-input" placeholder="Enter a compelling title…" value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div>
                  <p className="abl-modal-label">Featured Image URL</p>
                  <input className="abl-modal-input" placeholder="https://…" value={imageUrl} onChange={e => { setImageUrl(e.target.value); setPreview(e.target.value); }} />
                </div>
                <label className="abl-upload-zone">
                  <input type="file" accept="image/*" onChange={handleImage} style={{ display: "none" }} />
                  Or upload from device
                </label>
                {preview && (
                  <div style={{ position: "relative" }}>
                    <img src={preview} alt="" style={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: 12, border: "1px solid rgba(0,0,0,.08)" }} />
                    <button onClick={() => { setPreview(""); setImageUrl(""); setImageFile(null); }} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,.6)", color: "#fff", border: "none", borderRadius: 50, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>Remove</button>
                  </div>
                )}
                <div>
                  <p className="abl-modal-label">Blog Content</p>
                  <div className="abl-editor-wrap">
                    <EditorContent editor={editor} style={{ minHeight: 200 }} />
                  </div>
                </div>
                {error && <div className="abl-err">{error}</div>}
                <button onClick={publishBlog} disabled={loading} className="abl-publish-btn">
                  {loading ? "Saving…" : editing ? "Update Blog" : "Publish Blog"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
