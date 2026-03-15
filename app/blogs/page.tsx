"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
} from "firebase/firestore";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/layouts/Footer";

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchBlogs = async (next = false) => {
    setLoading(true);

    let q;

    if (next && lastDoc) {
      q = query(
        collection(db, "blogs"),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(10)
      );
    } else {
      q = query(
        collection(db, "blogs"),
        orderBy("createdAt", "desc"),
        limit(10)
      );
    }

    const snap = await getDocs(q);

    const data = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setBlogs(next ? [...blogs, ...data] : data);

    setLastDoc(snap.docs[snap.docs.length - 1]);
    setLoading(false);
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  return (
    <>
    <Header/>
     <nav className="text-sm text-gray-500 flex items-center gap-2 p-[2%]">
          <Link href="/" className="hover:text-black">
            Home
          </Link>

          <span>/</span>

          <Link href="/blogs" className="hover:text-black">
            Blogs
          </Link>
        </nav>
    <div className="w-full mx-auto px-[2%] pb-16">

      <h1 className="text-4xl font-bold mb-10">Blogs</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

        {blogs.map((blog) => (
          <Link
            key={blog.id}
            href={`/blogs/${blog.id}`}
            className="border border-gray-400 rounded-2xl overflow-hidden hover:shadow-lg transition"
          >

            {blog.image && (
              <img
                src={blog.image}
                className="w-full h-68 object-cover"
              />
            )}

            <div className="p-5">
              <h2 className="text-lg font-semibold mb-2">
                {blog.title}
              </h2>

              <p className="text-gray-500 text-sm line-clamp-3">
                {blog.content}
              </p>
            </div>

          </Link>
        ))}

      </div>

      {/* Load More */}
      <div className="flex justify-center mt-12">
        <button
          onClick={() => fetchBlogs(true)}
          className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800"
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      </div>

    </div>
    <Footer/>
    </>
  );
}