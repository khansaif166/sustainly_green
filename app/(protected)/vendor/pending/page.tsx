"use client";

import Link from "next/link";

export default function VendorPendingApprovalPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          {/* Icon */}
          <div className="mx-auto mb-5 h-14 w-14 rounded-full bg-orange-50 flex items-center justify-center">
            <svg
              className="h-7 w-7 text-orange-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-xl font-semibold text-gray-900">
            Profile Under Review
          </h1>

          {/* Message */}
          <p className="mt-2 text-sm text-gray-600">
            Thanks for submitting your vendor profile. Our team is currently
            reviewing your details to ensure authenticity and sustainability
            compliance.
          </p>

          {/* Status */}
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1.5 text-xs font-medium text-orange-700">
            ⏳ Status: Pending Approval
          </div>

          {/* Info */}
          <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4 text-left">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              What happens next?
            </h3>
            <ul className="space-y-1 text-sm text-gray-600 list-disc list-inside">
              <li>Our team verifies your business details</li>
              <li>Uploaded certifications are reviewed</li>
              <li>You’ll receive an email once approved</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/vendor/profile"
              className="rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              View Submitted Profile
            </Link>

            <Link
              href="/"
              className="rounded-full bg-black text-white px-4 py-2 text-sm hover:bg-gray-900"
            >
              Go to Home
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <p className="mt-4 text-center text-xs text-gray-400">
          Typical approval time: 24–48 business hours
        </p>
      </div>
    </main>
  );
}
