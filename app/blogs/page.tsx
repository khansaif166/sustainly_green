"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/layouts/Footer";
import { fetchPublishedBlogs } from "@/lib/supabasePublic";

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchBlogs = async (next = false) => {
    setLoading(true);

    const nextOffset = next ? offset : 0;
    const data = await fetchPublishedBlogs({ limit: 10, offset: nextOffset });

    setBlogs(next ? [...blogs, ...data] : data);
    setOffset(nextOffset + data.length);
    setHasMore(data.length === 10);
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
                {blog.excerpt || blog.content}
              </p>
            </div>

          </Link>
        ))}

      </div>

      {/* Load More */}
      <div className="flex justify-center mt-12">
        {hasMore && (
          <button
            onClick={() => fetchBlogs(true)}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        )}
      </div>

    </div>
    <Footer/>
    </>
  );
}
