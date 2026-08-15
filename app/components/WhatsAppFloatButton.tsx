import { FaWhatsapp } from "react-icons/fa";

const WHATSAPP_NUMBER = "919003991874";

export default function WhatsAppFloatButton() {
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
            bottom: 16px;
            width: 50px;
            height: 50px;
          }
        }
      `}</style>
    </>
  );
}
