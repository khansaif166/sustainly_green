import Link from "next/link";
import {
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
} from "react-icons/hi";

export default function Footer() {
  return (
    <footer className="bg-[#111827] text-[#E5E7EB] border-t border-white/10 text-sm">
      <div className="max-w-full mx-auto px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
          
          {/* Brand */}
          <div>
            <h3 className="text-white text-base font-semibold">
              Sustainly Green
            </h3>
            <p className="mt-3 text-[13px] text-[#E5E7EB]/80 leading-relaxed">
              A global B2B marketplace connecting verified buyers and suppliers
              for sustainable products and services.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">
              Marketplace
            </h4>
            <ul className="space-y-2 text-[13px]">
              <li>
                <Link
                  href="/browse"
                  className="hover:text-[#6BCF9B] transition"
                >
                  Browse Products
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="hover:text-[#6BCF9B] transition"
                >
                  Categories
                </Link>
              </li>
              <li>
                <Link
                  href="/find-vendors"
                  className="hover:text-[#6BCF9B] transition"
                >
                  Find Vendors
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="hover:text-[#6BCF9B] transition"
                >
                  Become a Vendor
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">
              Company
            </h4>
            <ul className="space-y-2 text-[13px]">
              <li>
                <Link
                  href="/about"
                  className="hover:text-[#6BCF9B] transition"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-[#6BCF9B] transition"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="hover:text-[#6BCF9B] transition"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-[#6BCF9B] transition"
                >
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">
              Contact
            </h4>
            <ul className="space-y-3 text-[13px]">
              <li className="flex items-center gap-2">
                <HiOutlineMail className="text-[#6BCF9B] text-base" />
                support@sustainlygreen.com
              </li>
              <li className="flex items-center gap-2">
                <HiOutlinePhone className="text-[#6BCF9B] text-base" />
                +44 20 39961521
              </li>
              <li className="flex items-center gap-2 w-[80%]">
                <HiOutlineLocationMarker className="text-[#6BCF9B] text-base w-[35] h-[35]" />
                Winchester House 259 - 269 Old Marylebone Road, London, NW1 5RA, United Kingdom.
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[12px] text-[#E5E7EB]/70">
            © {new Date().getFullYear()} Sustainly. All rights reserved.
          </p>

          <div className="flex gap-4 text-[12px]">
            <Link
              href="/privacy-policy"
              className="hover:text-[#6BCF9B] transition"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-[#6BCF9B] transition"
            >
              Terms
            </Link>
            <Link
              href="/support"
              className="hover:text-[#6BCF9B] transition"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
