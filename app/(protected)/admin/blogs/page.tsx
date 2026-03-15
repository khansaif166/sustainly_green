"use client";

import { useEffect, useState } from "react";
import { db, storage } from "@/lib/firebase";

import {
collection,
addDoc,
updateDoc,
deleteDoc,
doc,
serverTimestamp,
getDocs,
query,
orderBy,
limit,
startAfter
} from "firebase/firestore";

import {
ref,
uploadBytes,
getDownloadURL
} from "firebase/storage";

import { v4 as uuid } from "uuid";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import {
Bold,
Italic,
Heading2,
List,
ListOrdered,
Quote,
Trash2,
Plus
} from "lucide-react";

/* ================= TYPES ================= */

type Blog = {
id:string
title:string
content:string
image:string
}

/* ================= PAGE ================= */

export default function BlogAdminPage(){

/* ================= STATE ================= */

const [open,setOpen] = useState(false)

const [title,setTitle] = useState("")
const [image,setImage] = useState<File | null>(null)
const [preview,setPreview] = useState("")

const [blogs,setBlogs] = useState<Blog[]>([])

const [editing,setEditing] = useState(false)
const [editingId,setEditingId] = useState("")

const [loading,setLoading] = useState(false)

const [lastDoc,setLastDoc] = useState<any>(null)

const pageSize = 6

/* ================= EDITOR ================= */

const editor = useEditor({
extensions:[StarterKit],
content:"",
immediatelyRender:false
})

/* ================= IMAGE SELECT ================= */

function handleImage(e:any){

const file = e.target.files[0]

if(!file) return

setImage(file)

setPreview(URL.createObjectURL(file))

}

/* ================= LOAD BLOGS ================= */

useEffect(()=>{
loadBlogs()
},[])

async function loadBlogs(next=false){

let q = query(
collection(db,"blogs"),
orderBy("createdAt","desc"),
limit(pageSize)
)

if(next && lastDoc){

q = query(
collection(db,"blogs"),
orderBy("createdAt","desc"),
startAfter(lastDoc),
limit(pageSize)
)

}

const snap = await getDocs(q)

const rows = snap.docs.map(d=>({
id:d.id,
...(d.data() as any)
}))

setBlogs(prev => next ? [...prev,...rows] : rows)

setLastDoc(
snap.docs[snap.docs.length-1]
)

}

/* ================= SAVE BLOG ================= */

async function publishBlog(){

if(!title || !editor?.getHTML()){

alert("Title and content required")

return

}

setLoading(true)

let imageUrl = preview

/* upload image */

if(image){

const storageRef = ref(
storage,
"blogs/"+uuid()
)

await uploadBytes(storageRef,image)

imageUrl = await getDownloadURL(storageRef)

}

/* update */

if(editing){

await updateDoc(
doc(db,"blogs",editingId),
{
title,
content:editor?.getHTML(),
image:imageUrl,
updatedAt:serverTimestamp()
}
)

}else{

await addDoc(
collection(db,"blogs"),
{
title,
content:editor?.getHTML(),
image:imageUrl,
createdAt:serverTimestamp()
}
)

}

/* reset */

resetForm()

loadBlogs()

}

/* ================= RESET ================= */

function resetForm(){

setTitle("")
setImage(null)
setPreview("")
setEditing(false)
setEditingId("")
setOpen(false)

editor?.commands.setContent("")

setLoading(false)

}

/* ================= EDIT BLOG ================= */

function editBlog(blog:any){

setOpen(true)

setEditing(true)

setEditingId(blog.id)

setTitle(blog.title)

setPreview(blog.image)

editor?.commands.setContent(blog.content)

}

/* ================= DELETE BLOG ================= */

async function deleteBlog(id:string){

if(!confirm("Delete this blog?")) return

await deleteDoc(doc(db,"blogs",id))

setBlogs(prev => prev.filter(b=>b.id !== id))

}

/* ================= LOAD MORE ================= */

function loadMore(){

loadBlogs(true)

}

/* ================= UI ================= */

return(

<div className="p-6 space-y-10">

{/* CREATE BUTTON */}

<div className="flex justify-between items-center">

<h1 className="text-2xl font-semibold">
Blogs
</h1>

<button
onClick={()=>setOpen(true)}
className="inline-flex items-center justify-center
            px-5 py-2.5 rounded-full
            text-sm font-medium text-white
            bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))]
            hover:opacity-90
            disabled:opacity-50"
>
<Plus size={18}/>
Create Blog
</button>

</div>

{/* ================= BLOG LIST ================= */}

<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

{blogs?.map(blog=>(

<div
key={blog.id}
className="bg-white border-gray-100 rounded-2xl overflow-hidden shadow-sm"
>

<img
src={blog.image}
className="h-48 w-full object-cover"
/>

<div className="p-5 space-y-3">

<h3 className="font-semibold text-lg line-clamp-2">
{blog.title}
</h3>

<p className="text-sm text-gray-600 line-clamp-2">
  {blog.content.replace(/<[^>]+>/g, "")}
</p>
<div className="flex gap-4">

<button
onClick={()=>editBlog(blog)}
className="text-blue-600 text-sm"
>
Edit
</button>

<button
onClick={()=>deleteBlog(blog.id)}
className="text-red-600 text-sm flex items-center gap-1"
>
<Trash2 size={14}/>
Delete
</button>

</div>

</div>

</div>

))}

</div>

{/* ================= PAGINATION ================= */}

{blogs.length === 0 ? (

  <div className="flex flex-col items-center justify-center py-20 text-center">


    <h3 className="text-lg font-semibold text-gray-700">
      No Blogs Yet
    </h3>

    <p className="text-sm text-gray-500 mt-1">
      Create your first blog to get started.
    </p>

    <button
      onClick={() => setOpen(true)}
      className="
      mt-6
      px-5 py-2.5
      bg-black
      text-white
      rounded-lg
      hover:bg-gray-800
      transition
      "
    >
      Create Blog
    </button>

  </div>

) : (
<></>
  // <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

  //   {blogs.map(blog => (
  //     <div
  //       key={blog.id}
  //       className="bg-white border rounded-2xl overflow-hidden shadow-sm"
  //     >
  //       <img
  //         src={blog.image}
  //         className="h-48 w-full object-cover"
  //       />

  //       <div className="p-5 space-y-3">
  //         <h3 className="font-semibold text-lg line-clamp-2">
  //           {blog.title}
  //         </h3>

  //         <button
  //           onClick={() => editBlog(blog)}
  //           className="text-blue-600 text-sm"
  //         >
  //           Edit
  //         </button>
  //       </div>

  //     </div>
  //   ))}

  // </div>

)}


{/* ================= MODAL ================= */}

{open && (

<div className="fixed inset-0 z-50 flex items-center justify-center">

<div
className="absolute inset-0 bg-black/40"
onClick={()=>setOpen(false)}
/>

<div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-xl p-8 max-h-[90vh] overflow-y-auto">

<button
onClick={()=>setOpen(false)}
className="absolute right-5 top-5"
>
✕
</button>

<h2 className="text-2xl font-semibold mb-8">
{editing ? "Edit Blog" : "Create Blog"}
</h2>

<div className="space-y-6">

{/* TITLE */}

<input
placeholder="Blog Title"
value={title}
onChange={(e)=>setTitle(e.target.value)}
className="w-full border border-gray-300 rounded-xl p-3"
/>

{/* IMAGE */}

<div className="space-y-3">

  <label className="text-sm font-medium">
    Featured Image
  </label>

  {/* Upload Box */}
  <label
    className="
      flex flex-col items-center justify-center
      w-full h-44
      border-2 border-dashed border-gray-300
      rounded-xl
      bg-gray-50
      cursor-pointer
      hover:bg-gray-100
      transition
    "
  >

    <input
      type="file"
      accept="image/*"
      onChange={handleImage}
      className="hidden"
    />

    <span className="text-sm text-gray-500">
      Click to upload or drag image
    </span>

  </label>

  {/* Preview */}
  {preview && (

    <div className="relative">

      <img
        src={preview}
        className="
          w-full
          max-h-80
          object-cover
          rounded-xl
          border
        "
      />

      {/* Remove button */}
      <button
        onClick={()=>{
          setPreview("")
          setImage(null)
        }}
        className="
          absolute top-2 right-2
          bg-black/70 text-white
          text-xs
          px-3 py-1
          rounded-full
          hover:bg-black
        "
      >
        Remove
      </button>

    </div>

  )}

</div>

{/* EDITOR */}

<div className="space-y-3">

  <label className="text-sm font-medium">
    Blog Content
  </label>

  <div
    className="
      border
      border-gray-200
      rounded-xl
      bg-gray-50
      p-3
      min-h-[260px]
      focus-within:ring-2
      focus-within:ring-green-500
      transition
    "
  >

    <div
      className="
        bg-white
        rounded-lg
        p-4
        w-full
        min-h-[220px]
      "
    >
      <EditorContent editor={editor} className="w-full h-full" />
    </div>

  </div>

</div>

{/* SAVE */}

<button
onClick={publishBlog}
className="w-full bg-black text-white py-3 rounded-full"
>
{loading ? "Saving..." : editing ? "Update Blog" : "Publish Blog"}
</button>

</div>

</div>

</div>

)}

</div>

)

}