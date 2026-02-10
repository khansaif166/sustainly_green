"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { uploadFileWithProgress } from "@/lib/storage";
import { onAuthStateChanged, User } from "firebase/auth";

/* ------------------ CONSTANTS ------------------ */
const BUSINESS_TYPES = [
  "Manufacturer",
  "Distributor / Trader",
  "Service Provider",
  "Consultant",
  "Wholesaler / Retailer",
  "NGO / Social Enterprise",
];

const CERTIFICATIONS = [
  "ISO 14001",
  "FSC",
  "GOTS",
  "Fair Trade",
  "Carbon Neutral",
  "Other",
];

export default function VendorOnboardingPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  /* ------------------ FORM STATE ------------------ */
  const [companyName, setCompanyName] = useState("");
  const [registrationNo, setRegistrationNo] = useState("");
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0]);
  const [primaryCategory, setPrimaryCategory] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [hasCertifications, setHasCertifications] = useState(false);
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [certFiles, setCertFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );

  // Optional
  const [description, setDescription] = useState("");
  const [yearEstablished, setYearEstablished] = useState("");
  const [website, setWebsite] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* ------------------ AUTH ------------------ */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!loadingAuth && !user) router.push("/login");
  }, [loadingAuth, user, router]);

  /* ------------------ HELPERS ------------------ */
  function toggleCert(name: string) {
    setSelectedCerts((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setCertFiles(e.target.files ? Array.from(e.target.files) : []);
  }

  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidPhone(phone: string) {
    return /^[0-9]{8,15}$/.test(phone); // international safe
  }

  function isValidURL(url: string) {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  function validateForm() {
    const newErrors: Record<string, string> = {};

    if (!companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }

    if (!primaryCategory.trim()) {
      newErrors.primaryCategory = "Primary category is required";
    }

    if (!country.trim()) {
      newErrors.country = "Country is required";
    }

    if (!city.trim()) {
      newErrors.city = "City is required";
    }

    if (!businessEmail.trim()) {
      newErrors.businessEmail = "Business email is required";
    } else if (!isValidEmail(businessEmail)) {
      newErrors.businessEmail = "Invalid email format";
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!isValidPhone(phone)) {
      newErrors.phone = "Invalid phone number";
    }

    if (yearEstablished) {
      const year = Number(yearEstablished);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1900 || year > currentYear) {
        newErrors.yearEstablished = "Invalid year";
      }
    }

    if (!isValidURL(website)) {
      newErrors.website = "Invalid website URL";
    }

    if (!isValidURL(linkedin)) {
      newErrors.linkedin = "Invalid LinkedIn URL";
    }

    if (!isValidURL(twitter)) {
      newErrors.twitter = "Invalid Twitter URL";
    }

    if (!isValidURL(instagram)) {
      newErrors.instagram = "Invalid Instagram URL";
    }

    if (hasCertifications) {
      if (selectedCerts.length === 0) {
        newErrors.certifications = "Select at least one certification";
      }
      if (certFiles.length === 0) {
        newErrors.certFiles = "Upload certification files";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  /* ------------------ SUBMIT ------------------ */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // clear previous errors
    setErrors({});

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const certUrls: string[] = [];

      if (hasCertifications) {
        for (const file of certFiles) {
          const path = `vendors/${user?.uid}/certs/${Date.now()}_${file.name}`;
          const url = await uploadFileWithProgress(file, path, (p) =>
            setUploadProgress((prev) => ({ ...prev, [file.name]: p })),
          );
          certUrls.push(url);
        }
      }

      await setDoc(doc(db, "vendors", user!.uid), {
        uid: user!.uid,
        companyName,
        registrationNo,
        businessType,
        primaryCategory,
        country,
        city,
        businessEmail,
        phone,
        hasCertifications,
        certifications: selectedCerts,
        certificateFiles: certUrls,
        description,
        yearEstablished,
        website,
        socialLinks: { linkedin, twitter, instagram },
        approved: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await setDoc(
        doc(db, "users", user!.uid),
        {
          role: "VENDOR",
          vendorProfileComplete: true,
          companyName,
        },
        { merge: true },
      );

      router.push("/vendor/pending");
    } catch (err) {
      console.error(err);
      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  /* ------------------ UI ------------------ */
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              Vendor Onboarding
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Tell us about your business to get verified on Sustainly.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* CORE INFO */}
            <section>
              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                Core Business Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input
                    className="input"
                    placeholder="Company Name *"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                  {errors.companyName && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.companyName}
                    </p>
                  )}
                </div>

                <input
                  className="input"
                  placeholder="Company Registration No"
                  value={registrationNo}
                  onChange={(e) => setRegistrationNo(e.target.value)}
                />

                <select
                  className="input"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                >
                  {BUSINESS_TYPES.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>

                <input
                  className="input"
                  placeholder="Primary Business Category"
                  value={primaryCategory}
                  onChange={(e) => setPrimaryCategory(e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
                <input
                  className="input"
                  placeholder="City / Region"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Business Email */}
                  <div>
                    <input
                      className="input"
                      placeholder="Business Email *"
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                    />
                    {errors.businessEmail && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors.businessEmail}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <input
                      className="input"
                      placeholder="WhatsApp / Phone *"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* CERTIFICATIONS */}
            <section>
              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                Sustainability Certifications
              </h2>

              <label className="flex items-center gap-2 text-sm mb-4">
                <input
                  type="checkbox"
                  checked={hasCertifications}
                  onChange={(e) => setHasCertifications(e.target.checked)}
                />
                We have sustainability certifications
              </label>

              {hasCertifications && (
                <>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {CERTIFICATIONS.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => toggleCert(c)}
                        className={`px-3 py-1 rounded-full text-xs border ${
                          selectedCerts.includes(c)
                            ? "bg-black text-white"
                            : "bg-white"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                    {errors.certifications && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors.certifications}
                      </p>
                    )}

                    {errors.certFiles && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors.certFiles}
                      </p>
                    )}
                  </div>

                  <input type="file" multiple onChange={handleFiles} />
                </>
              )}
            </section>

            {/* OPTIONAL */}
            <section>
              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                Optional Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <textarea
                  className="input md:col-span-2"
                  maxLength={300}
                  placeholder="Short description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Year Established"
                  value={yearEstablished}
                  onChange={(e) => setYearEstablished(e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Website URL"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
                <input
                  className="input"
                  placeholder="LinkedIn URL"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Twitter URL"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Instagram URL"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                />
              </div>
            </section>

            {errors.form && (
              <p className="text-sm text-red-600">{errors.form}</p>
            )}

            <div className="flex justify-end">
              <button className="rounded-full bg-black text-white px-6 py-2 text-sm">
                {submitting ? "Submitting..." : "Submit for Approval"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Tailwind input utility */}
      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          border-color: #000;
        }
      `}</style>
    </main>
  );
}
