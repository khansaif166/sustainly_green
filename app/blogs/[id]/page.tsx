"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation";
import Footer from "@/app/components/layouts/Footer";
import Header from "@/app/components/Header";
import Link from "next/link";

export default function BlogDetail() {
  const { id } = useParams();
  const [blog, setBlog] = useState<any>(null);

  useEffect(() => {
    const fetchBlog = async () => {
      const ref = doc(db, "blogs", id as string);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setBlog({ id: snap.id, ...snap.data() });
      }
    };

    fetchBlog();
  }, [id]);

  if (!blog) return <p className="text-center mt-20">Loading...</p>;

  return (
    <>
      <Header />
      <div className="w-full mx-auto px-6 pt-10">
        <nav className="text-sm text-gray-500 flex items-center gap-2">
          <Link href="/" className="hover:text-black">
            Home
          </Link>

          <span>/</span>

          <Link href="/blogs" className="hover:text-black">
            Blogs
          </Link>

          <span>/</span>

          <span className="text-gray-800 font-medium">{blog.title}</span>
        </nav>
      </div>
      <div className="w-auto mx-auto py-16 px-6 flex flex-col md:flex-col items-start gap-10">
        {/* Blog Image */}
        <div className="w-full">
          {blog.image && (
            <img
              src={blog.image}
              className="w-[350px] rounded-2xl shadow-md object-cover"
            />
          )}
        </div>

        {/* Blog Content */}
        <div className=" w-full">
          <h1 className="text-4xl font-bold mb-6 leading-tight">
            {blog.title}
          </h1>

          <div
            className="prose max-w-none text-gray-700 text-lg leading-relaxed"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </div>
      </div>
      <Footer />
    </>
  );
}
