"use client";

import Link from "next/link";
import Image from "next/image";
import { FaLinkedinIn, FaYoutube } from "react-icons/fa6";
import { OPEN_RFQ_PROMPT_EVENT } from "../RfqPrompt";

const COPYRIGHT_YEAR = 2026;
const LINKEDIN_URL = "https://www.linkedin.com/in/irshad-ahmedk";
const YOUTUBE_URL = "https://www.youtube.com/@SustainlyGreen";

export default function Footer() {
  return (
    <footer>
      <div className="footer-grid">
        {/* Brand */}
        <div>
          <div className="footer-logo-row">
            <Image src="/log.webp" alt="Sustainly Green" width={150} height={40} className="footer-logo-img" />
            <div className="footer-brand-name">Sustainly<span> Green</span></div>
          </div>
          <p className="footer-brand-sub">
            India&apos;s first verified B2B marketplace for sustainable sourcing — connecting ESG-certified vendors with corporate buyers under a zero-greenwashing standard.
          </p>
          <div className="footer-social">
            <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="fsoc" aria-label="LinkedIn">
              <FaLinkedinIn aria-hidden="true" />
            </a>
            <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className="fsoc" aria-label="YouTube">
              <FaYoutube aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* For Buyers */}
        <div className="footer-col">
          <h5>For Buyers</h5>
          <Link href="/register?role=BUYER">Start Sourcing</Link>
          <Link href="/browse?type=vendor">Browse Vendors</Link>
          <button
            type="button"
            className="footer-text-button"
            onClick={() => window.dispatchEvent(new Event(OPEN_RFQ_PROMPT_EVENT))}
          >
            Submit RFQ
          </button>
          <Link href="/help/buyers">Buyer FAQs</Link>
        </div>

        {/* For Vendors */}
        <div className="footer-col">
          <h5>For Vendors</h5>
          <Link href="/register?role=VENDOR">List Your Business</Link>
          <Link href="/browse?type=vendor">Browse Vendors</Link>
          <Link href="/contact">Supplier Verification</Link>
          <Link href="/help/vendors">Vendor FAQs</Link>
        </div>

        {/* Platform */}
        <div className="footer-col">
          <h5>Platform</h5>
          <Link href="/about">About Us</Link>
          <Link href="/sdg-commitment">Our SDG Commitment</Link>
          <Link href="/resources">Resources</Link>
          <Link href="/blogs">Blogs</Link>
          <Link href="/careers">Careers</Link>
          <Link href="/contact">Contact Us</Link>
        </div>

        {/* Legal */}
        <div className="footer-col">
          <h5>Legal</h5>
          <Link href="/terms">Terms &amp; Conditions</Link>
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/cookie-policy">Cookie Policy</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-left">
          <p>
            {`© ${COPYRIGHT_YEAR} Sustainly Ecohub India Pvt Ltd · Vaniyambadi, Tamil Nadu, India `}
            <span className="cin">grow@sustainlygreen.com</span>
          </p>
        </div>
        <div className="footer-bottom-right">
          <a href="https://www.sustainlygreen.com" target="_blank" rel="noopener noreferrer">www.sustainlygreen.com</a>
          <Link href="/privacy-policy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
