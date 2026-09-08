"use client";

import { usePathname } from "next/navigation";
import { FaWhatsapp } from "react-icons/fa";

const WHATSAPP_NUMBER = "919003991874";

// Signed-in workspaces have their own support routes, and on a phone this
// button lands on top of the sticky action bars in those forms.
const HIDDEN_PREFIXES = ["/vendor", "/buyer", "/admin"];

export default function WhatsAppFloatButton() {
  const pathname = usePathname();
  if (HIDDEN_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return null;
  }

  return (
    <>
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="whatsapp-float-button"
      >
        <FaWhatsapp size={30} />
      </a>

      <style>{`
        .whatsapp-float-button {
          position: fixed;
          right: 20px;
          bottom: 20px;
          z-index: 60;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 9999px;
          background-color: #25d366;
          color: #fff;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
          transition: transform 170ms ease, box-shadow 170ms ease;
        }

        .whatsapp-float-button:hover {
          transform: scale(1.08);
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.3);
        }

        @media (max-width: 640px) {
          .whatsapp-float-button {
            right: 16px;
            bottom: calc(16px + env(safe-area-inset-bottom));
            width: 50px;
            height: 50px;
          }
        }
      `}</style>
    </>
  );
}
