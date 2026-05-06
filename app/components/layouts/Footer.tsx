import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <div className="footer-grid">
        {/* Brand */}
        <div>
          <div className="footer-brand-name">Sustainly<span> Green</span></div>
          <p className="footer-brand-sub">
            India's first verified B2B marketplace for sustainable sourcing — connecting ESG-certified vendors with corporate buyers under a zero-greenwashing standard.
          </p>
          <div className="footer-badges">
            <span className="fbadge">Green Lens</span>
            <span className="fbadge">B2B Only</span>
            <span className="fbadge">DPDP Compliant</span>
          </div>
          <div className="footer-social">
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="fsoc" aria-label="LinkedIn">in</a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="fsoc" aria-label="Twitter">tw</a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="fsoc" aria-label="YouTube">yt</a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="fsoc" aria-label="Instagram">ig</a>
          </div>
        </div>

        {/* For Buyers */}
        <div className="footer-col">
          <h5>For Buyers</h5>
          <Link href="/register?role=BUYER">Start Sourcing</Link>
          <Link href="/browse?type=vendor">Browse Vendors</Link>
          <Link href="/rfq">Submit RFQ</Link>
          <Link href="/esg-reports">ESG Reports</Link>
          <Link href="/help">Buyer FAQ</Link>
        </div>

        {/* For Vendors */}
        <div className="footer-col">
          <h5>For Vendors</h5>
          <Link href="/register?role=VENDOR">List Your Business</Link>
          <Link href="/pricing">Pricing Plans</Link>
          <Link href="/Green-lens">Green Lens Process</Link>
          <Link href="/eco-score">Eco Score Guide</Link>
          <Link href="/help">Vendor FAQ</Link>
        </div>

        {/* Platform */}
        <div className="footer-col">
          <h5>Platform</h5>
          <Link href="/about">About Us</Link>
          <Link href="/Green-lens">Green Lens</Link>
          <Link href="/blogs">Blog</Link>
          <Link href="/careers">Careers</Link>
          <Link href="/contact">Contact Us</Link>
        </div>

        {/* Legal */}
        <div className="footer-col">
          <h5>Legal</h5>
          <Link href="/terms">Terms &amp; Conditions</Link>
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/cookie-policy">Cookie Policy</Link>
          <Link href="/refund-policy">Refund Policy</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-left">
          <p>
            © {new Date().getFullYear()} Sustainly Green India Pvt Ltd · Chennai, Tamil Nadu, India &nbsp;
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
