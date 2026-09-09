"use client";

import { Check, Link2, Linkedin, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function ShareButtons({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard is unavailable over plain http and when the user has denied
      // permission. Selecting the URL by hand still works, so fail quietly.
    }
  }

  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      label: "Share on LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
      Icon: Linkedin,
    },
    {
      label: "Share on WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20${encoded}`,
      Icon: MessageCircle,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm text-gray-500">Share</span>

      {links.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:border-green-600 hover:text-green-700"
        >
          <Icon size={16} aria-hidden="true" />
        </a>
      ))}

      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Link copied" : "Copy link"}
        title={copied ? "Link copied" : "Copy link"}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-gray-200 px-3 text-sm text-gray-600 transition-colors hover:border-green-600 hover:text-green-700"
      >
        {copied ? (
          <Check size={16} className="text-green-600" aria-hidden="true" />
        ) : (
          <Link2 size={16} aria-hidden="true" />
        )}
        <span>{copied ? "Copied" : "Copy link"}</span>
      </button>
    </div>
  );
}
