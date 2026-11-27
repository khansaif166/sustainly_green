"use client";

import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { Toaster, toast } from "sonner";
import {
  Building2, Check, Circle, CircleCheck, Clock3, ExternalLink,
  Leaf, LoaderCircle, MapPin, Pencil, Save, ShieldCheck, ShoppingBag, Sparkles, User, X,
  type LucideIcon,
} from "lucide-react";
import type { OnboardingFormData } from "../../../vendor/onboarding/schema";
import { Input, Select, TextArea, MultiSelect, Toggle, FileUpload } from "../../../vendor/onboarding/_components/FormFields";
import RichProfileEditor from "@/app/components/rich-vendor/RichProfileEditor";
import { getStoredSession } from "@/lib/supabaseAuth";
import { uploadFileToSupabaseStorage } from "@/lib/storage";
import { getVendorBadgeMeta, VENDOR_BADGES, type VendorBadgeLike } from "@/lib/vendorBadges";
import styles from "./vendorProfile.module.css";

const fields = [
  "companyName", "registrationType", "cinRegistration", "gstNumber", "yearOfIncorporation",
  "businessEmail", "whatsapp", "primaryContactName", "designation", "city", "state", "pinCode",
  "country", "businessType", "primaryCategory", "subCategories", "shortDescription", "keyProducts",
  "exportCapability", "exportMarkets", "primarySustainabilityCert", "issuingBody",
  "sustainabilityPractice", "recycledContent", "carbonFootprint", "socialCompliance",
] as const satisfies readonly (keyof OnboardingFormData)[];

type BasicFields = Pick<OnboardingFormData, (typeof fields)[number]>;
type BasicForm = BasicFields & { logoFile?: File; certificateFile?: File };
type Vendor = BasicFields & VendorBadgeLike & {
  id: string;
  approved: boolean;
  updatedAt: string;
  logoUrl: string;
  registeredAddress: string;
  certificateFileUrl: string;
  listingTier: string;
  language: string;
  paymentTerms: string;
  awardsImageUrl: string;
};

const views = [
  { id: "basic", label: "Basic Profile", description: "Company details and verification", icon: Building2 },
  { id: "rich", label: "Rich Profile", description: "Enhanced content, media and ads", icon: Sparkles },
] as const;

type ProfileView = (typeof views)[number]["id"];
const notificationId = "admin-vendor-profile";

async function vendorRequest<T = { ok: true }>(uid: string, updates?: Partial<Vendor>): Promise<T> {
  const session = getStoredSession();
  if (!session) throw new Error("Please sign in again.");
  const response = await fetch(`/api/admin/vendors/${encodeURIComponent(uid)}`, {
    method: updates ? "PATCH" : "GET",
    headers: { Authorization: `Bearer ${session.accessToken}`, ...(updates && { "Content-Type": "application/json" }) },
    body: updates && JSON.stringify(updates),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Unable to update or load this vendor.");
  return data as T;
}

function Detail({ label, children, wide }: { label: string; children?: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? styles.wide : undefined}>
      <dt>{label}</dt>
      <dd>{children || "—"}</dd>
    </div>
  );
}

function Card({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <section className={styles.card}>
      <h3><span className={styles.sectionIcon}><Icon size={18} aria-hidden="true" /></span>{title}</h3>
      {children}
    </section>
  );
}

function ProfileLoading({ backLink }: { backLink: ReactNode }) {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.identity}>
          <span className={styles.logo} aria-hidden="true"><LoaderCircle size={24} className={styles.loadingSpinner} /></span>
          <div className={styles.company}>
            <p className={styles.loadingTitle} role="status">Loading vendor profile…</p>
            <span className={`${styles.skeleton} ${styles.loadingMetadata}`} aria-hidden="true" />
          </div>
        </div>
        {backLink}
      </header>

      <div className={styles.panel} aria-hidden="true">
        <div className={styles.tabs}>
          {views.map(({ id }) => (
            <div key={id} className={styles.loadingTab}>
              <span className={`${styles.skeleton} ${styles.tabIcon}`} />
              <div className={styles.loadingLines}><span className={styles.skeleton} /><span className={styles.skeleton} /></div>
            </div>
          ))}
        </div>
        <div className={styles.toolbar}>
          <span className={`${styles.skeleton} ${styles.loadingHeading}`} />
          <span className={`${styles.skeleton} ${styles.loadingAction}`} />
        </div>
        <div className={styles.columns}>
          {[{ id: "details", fields: 9, layout: styles.details }, { id: "checklist", fields: 4, layout: styles.loadingList }]
            .map(({ id, fields, layout }) => (
              <div className={styles.card} key={id}>
                <div className={styles.loadingCardHeading}>
                  <span className={`${styles.skeleton} ${styles.sectionIcon}`} />
                  <span className={`${styles.skeleton} ${styles.loadingHeading}`} />
                </div>
                <div className={layout}>
                  {Array.from({ length: fields }, (_, index) => (
                    <div key={index} className={styles.loadingLines}><span className={styles.skeleton} /><span className={styles.skeleton} /></div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminVendorDetailsPage() {
  const { uid } = useParams<{ uid: string }>();
  return (
    <>
      <Toaster
        id={notificationId}
        position="top-right"
        className={styles.toastStack}
        offset={{ top: "var(--vendor-toast-top, 24px)", right: 24 }}
        mobileOffset={{ top: 64, left: 12, right: 12 }}
        duration={4500}
        closeButton
        icons={{ success: <Check size={20} aria-hidden="true" /> }}
        toastOptions={{
          unstyled: true,
          closeButtonAriaLabel: "Dismiss notification",
          classNames: {
            toast: styles.toast,
            icon: styles.toastIcon,
            title: styles.toastTitle,
            description: styles.toastDescription,
            closeButton: styles.toastClose,
          },
        }}
      />
      <VendorDetails key={uid} uid={uid} />
    </>
  );
}

function VendorDetails({ uid }: { uid: string }) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loadFailure, setLoadFailure] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [view, setView] = useState<ProfileView>("basic");
  const [richOpened, setRichOpened] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const methods = useForm<BasicForm>();
  const { reset, handleSubmit } = methods;

  useEffect(() => {
    let current = true;
    vendorRequest<{ vendor: Vendor }>(uid).then(({ vendor }) => {
      if (current) setVendor(vendor);
    }).catch(error => {
      if (current) setLoadFailure(error instanceof Error ? error.message : "Unable to load this vendor.");
    });
    return () => { current = false; };
  }, [uid, loadAttempt]);

  function selectView(next: ProfileView) {
    if (next === "rich") setRichOpened(true);
    setView(next);
  }

  function navigateTabs(event: KeyboardEvent<HTMLButtonElement>, current: ProfileView) {
    let next: ProfileView;
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowRight": next = current === "basic" ? "rich" : "basic"; break;
      case "Home": next = "basic"; break;
      case "End": next = "rich"; break;
      default: return;
    }
    event.preventDefault();
    selectView(next);
    document.getElementById(`vendor-tab-${next}`)?.focus();
  }

  function notifySaved(message: string, companyName = vendor?.companyName) {
    toast.success(message, { toasterId: notificationId, description: companyName });
  }

  async function runUpdate(update: () => Promise<Partial<Vendor>>, message: string) {
    setBusy(true);
    setUpdateError("");
    try {
      const changes = await update();
      setVendor(current => current && { ...current, ...changes });
      notifySaved(message, changes.companyName);
      return true;
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : "Unable to update this vendor.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function updateListing(changes: Partial<Vendor>, message: string) {
    return runUpdate(async () => {
      await vendorRequest(uid, changes);
      return changes;
    }, message);
  }

  async function saveBasicProfile(data: BasicForm) {
    const saved = await runUpdate(async () => {
      const session = getStoredSession();
      if (!session) throw new Error("Please sign in again.");
      const [logo, certificate] = await Promise.all([
        data.logoFile instanceof File ? uploadFileToSupabaseStorage(data.logoFile, { bucket: "marketplace", folder: "vendors/logos", accessToken: session.accessToken }) : null,
        data.certificateFile instanceof File ? uploadFileToSupabaseStorage(data.certificateFile, { bucket: "marketplace", folder: "vendors/certificates", accessToken: session.accessToken }) : null,
      ]);
      const updates = {
        ...Object.fromEntries(fields.map(field => [field, data[field]])),
        ...(logo && { logoUrl: logo.url }),
        ...(certificate && { certificateFileUrl: certificate.url }),
      };
      await vendorRequest(uid, updates);
      return updates;
    }, "Basic Profile saved");
    if (saved) setEditing(false);
  }

  const backLink = (
    <Link href="/admin/vendors" className={styles.backButton}>
      Back to vendors
    </Link>
  );

  if (!vendor && !loadFailure) return <ProfileLoading backLink={backLink} />;

  if (!vendor) return (
    <div className={styles.page}>
      <div className={styles.empty}>
        {backLink}
        <h1>Couldn’t open vendor profile</h1>
        <p role="alert">{loadFailure}</p>
        <button type="button" className={styles.button} onClick={() => {
          setLoadFailure("");
          setLoadAttempt(attempt => attempt + 1);
        }}>Try again</button>
      </div>
    </div>
  );

  const badge = getVendorBadgeMeta(vendor);
  const location = [vendor.city, vendor.state, vendor.country].filter(Boolean).join(", ");
  const address = [vendor.registeredAddress, vendor.city, vendor.state, vendor.pinCode, vendor.country].filter(Boolean).join(", ");

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.identity}>
          <div className={styles.logo} aria-hidden="true">
            {vendor.logoUrl
              // eslint-disable-next-line @next/next/no-img-element -- vendor logos may come from external sites.
              ? <img src={vendor.logoUrl} alt="" />
              : <Building2 size={28} />}
          </div>
          <div className={styles.company}>
            <div className={styles.companyTitle}>
              <h1>{vendor.companyName || "Vendor profile"}</h1>
              <span className={styles.status} data-approved={vendor.approved}>
                {vendor.approved ? <CircleCheck size={14} aria-hidden="true" /> : <Clock3 size={14} aria-hidden="true" />}
                {vendor.approved ? "Approved" : "Pending verification"}
              </span>
            </div>
            {(location || vendor.primaryCategory || vendor.updatedAt) && (
              <div className={styles.metadata}>
                {location && <span><MapPin size={15} aria-hidden="true" />{location}</span>}
                {vendor.primaryCategory && <span><ShoppingBag size={15} aria-hidden="true" />{vendor.primaryCategory}</span>}
                {vendor.updatedAt && (
                  <span>
                    <Clock3 size={15} aria-hidden="true" />
                    <time dateTime={vendor.updatedAt}>Updated {new Date(vendor.updatedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</time>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        {backLink}
      </header>

      {updateError && <p className={styles.updateError} role="alert">{updateError}</p>}

      <div className={styles.tabs} role="tablist" aria-label="Vendor profiles">
        {views.map(({ id, label, description, icon: Icon }) => (
          <button key={id} type="button" role="tab" id={`vendor-tab-${id}`} aria-controls={`vendor-panel-${id}`}
            aria-selected={view === id} aria-label={label} aria-describedby={`vendor-description-${id}`}
            tabIndex={view === id ? 0 : -1} onClick={() => selectView(id)} onKeyDown={event => navigateTabs(event, id)}>
            <span className={styles.tabIcon}><Icon size={20} aria-hidden="true" /></span>
            <span><strong>{label}</strong><small id={`vendor-description-${id}`}>{description}</small></span>
          </button>
        ))}
      </div>

      <section role="tabpanel" id="vendor-panel-basic" aria-labelledby="vendor-tab-basic" tabIndex={0}
        className={styles.panel} hidden={view !== "basic"}>
        <FormProvider {...methods}>
          <form className={styles.panel} onSubmit={handleSubmit(saveBasicProfile)}>
            <div className={styles.toolbar}>
              <h2>{editing ? "Edit Basic Profile" : "Basic Profile"}</h2>
              <div className={styles.actions}>
                {editing ? (
                  <>
                    <button type="button" className={styles.button} disabled={busy} onClick={() => setEditing(false)}>Cancel</button>
                    <button type="submit" className={`${styles.button} ${styles.primary}`} disabled={busy}>
                      <Save size={16} aria-hidden="true" /> {methods.formState.isSubmitting ? "Saving…" : "Save changes"}
                    </button>
                  </>
                ) : (
                  <button type="button" className={styles.button} disabled={busy} onClick={() => {
                    reset(vendor);
                    setEditing(true);
                  }}><Pencil size={16} aria-hidden="true" /> Edit profile</button>
                )}
              </div>
            </div>

            <div className={styles.columns}>
              <div className={styles.stack}>
                <Card icon={User} title="Identity & legal">
                  {editing ? (
                    <div className={styles.formGrid}>
                      <div className={styles.wide}><FileUpload name="logoFile" label="Company logo" /></div>
                      <Input name="companyName" id="companyName" label="Company name" />
                      <Select name="registrationType" id="registrationType" label="Registration type" options={[{ label: "Pvt Ltd", value: "pvt-ltd" }, { label: "LLP", value: "llp" }, { label: "Sole Proprietorship", value: "sole-proprietorship" }]} />
                      <Input name="cinRegistration" id="cinRegistration" label="CIN number" />
                      <Input name="gstNumber" id="gstNumber" label="GST number" />
                      <Input name="yearOfIncorporation" id="yearOfIncorporation" label="Year of incorporation" />
                      <Input name="businessEmail" id="businessEmail" label="Business email" />
                      <Input name="whatsapp" id="whatsapp" label="WhatsApp / mobile" />
                      <Input name="primaryContactName" id="primaryContactName" label="Primary contact" />
                      <Input name="designation" id="designation" label="Designation" />
                      <Input name="city" id="city" label="City" />
                      <Input name="state" id="state" label="State" />
                      <Input name="pinCode" id="pinCode" label="PIN code" />
                      <Input name="country" id="country" label="Country" />
                    </div>
                  ) : (
                    <dl className={styles.details}>
                      <Detail label="Company name">{vendor.companyName}</Detail>
                      <Detail label="Registration type">{vendor.registrationType}</Detail>
                      <Detail label="Year of incorporation">{vendor.yearOfIncorporation}</Detail>
                      <Detail label="CIN number">{vendor.cinRegistration}</Detail>
                      <Detail label="GST number">{vendor.gstNumber}</Detail>
                      <Detail label="Business email">{vendor.businessEmail}</Detail>
                      <Detail label="Primary contact">{vendor.primaryContactName}</Detail>
                      <Detail label="Designation">{vendor.designation}</Detail>
                      <Detail label="WhatsApp / mobile">{vendor.whatsapp}</Detail>
                      <Detail label="Registered address" wide>{address}</Detail>
                    </dl>
                  )}
                </Card>

                <Card icon={Building2} title="Business overview">
                  {editing ? (
                    <div className={styles.formGrid}>
                      <Select name="businessType" id="businessType" label="Business type" options={[{ label: "Manufacturer", value: "manufacturer" }, { label: "Trader", value: "trader" }]} />
                      <Input name="primaryCategory" id="primaryCategory" label="Primary category" />
                      <div className={styles.wide}><MultiSelect name="subCategories" label="Subcategories" max={3} /></div>
                      <div className={styles.wide}><TextArea name="shortDescription" id="shortDescription" label="Company description" rows={3} /></div>
                      <div className={styles.wide}><MultiSelect name="keyProducts" label="Key products" max={5} /></div>
                      <Toggle name="exportCapability" label="Export capability" />
                      <Input name="exportMarkets" id="exportMarkets" label="Export markets" />
                    </div>
                  ) : (
                    <dl className={styles.details}>
                      <Detail label="Business type">{vendor.businessType}</Detail>
                      <Detail label="Primary category">{vendor.primaryCategory}</Detail>
                      <Detail label="Export capability">{vendor.exportCapability ? "Yes" : "No"}</Detail>
                      <Detail label="Export markets">{vendor.exportMarkets}</Detail>
                      <Detail label="Subcategories">{vendor.subCategories.join(", ")}</Detail>
                      <Detail label="Company description" wide>{vendor.shortDescription}</Detail>
                      {vendor.keyProducts.length > 0 && (
                        <Detail label="Key products" wide>
                          <ul className={styles.chips}>{vendor.keyProducts.map((product, index) => <li key={index}>{product}</li>)}</ul>
                        </Detail>
                      )}
                    </dl>
                  )}
                </Card>

                <Card icon={Leaf} title="Sustainability credentials">
                  {editing ? (
                    <div className={styles.formGrid}>
                      <Input name="primarySustainabilityCert" id="primarySustainabilityCert" label="Primary certification" />
                      <Input name="issuingBody" id="issuingBody" label="Issuing body" />
                      <div className={styles.wide}><FileUpload name="certificateFile" label="Sustainability certificate" /></div>
                      <div className={styles.wide}><TextArea name="sustainabilityPractice" id="sustainabilityPractice" label="Sustainability practice" rows={3} /></div>
                      <Input name="recycledContent" id="recycledContent" label="Recycled content %" />
                      <Input name="carbonFootprint" id="carbonFootprint" label="Carbon footprint" />
                      <Input name="socialCompliance" id="socialCompliance" label="Social compliance" />
                    </div>
                  ) : (
                    <>
                      <dl className={styles.details}>
                        <Detail label="Primary certification">{vendor.primarySustainabilityCert}</Detail>
                        <Detail label="Issuing body">{vendor.issuingBody}</Detail>
                        <Detail label="Recycled content %">{vendor.recycledContent}</Detail>
                        <Detail label="Carbon footprint">{vendor.carbonFootprint}</Detail>
                        <Detail label="Social compliance">{vendor.socialCompliance}</Detail>
                        <Detail label="Sustainability practice" wide>{vendor.sustainabilityPractice}</Detail>
                      </dl>
                      {vendor.certificateFileUrl && (
                        <a className={styles.documentLink} href={vendor.certificateFileUrl} target="_blank" rel="noreferrer">
                          View certificate <ExternalLink size={14} aria-hidden="true" />
                        </a>
                      )}
                    </>
                  )}
                </Card>
              </div>

              <div className={styles.stack}>
                <Card icon={ShieldCheck} title="Verification checklist">
                  <ul className={styles.checklist}>
                    {[
                      { label: "GST or CIN number provided", complete: Boolean(vendor.gstNumber || vendor.cinRegistration) },
                      { label: "Sustainability certificate uploaded", complete: Boolean(vendor.certificateFileUrl) },
                      { label: "Contact details provided", complete: Boolean(vendor.whatsapp || vendor.businessEmail) },
                      { label: "Admin approval", complete: vendor.approved },
                    ].map(({ label, complete }) => {
                      const Icon = complete ? CircleCheck : Circle;
                      return (
                        <li key={label} data-complete={complete}>
                          <Icon size={17} aria-hidden="true" /><span className="sr-only">{complete ? "Complete. " : "Incomplete. "}</span>{label}
                        </li>
                      );
                    })}
                  </ul>
                  <div className={styles.verificationActions}>
                    <button type="button" disabled={busy} className={`${styles.button} ${vendor.approved ? styles.danger : styles.primary}`}
                      onClick={() => void updateListing({ approved: !vendor.approved }, vendor.approved ? "Vendor suspended." : "Vendor approved.")}>
                      {vendor.approved ? <X size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
                      {vendor.approved ? "Suspend vendor" : "Approve vendor"}
                    </button>
                  </div>
                </Card>

                <Card icon={ShoppingBag} title="Marketplace">
                  <dl className={styles.details}>
                    <Detail label="Listing tier">{vendor.listingTier}</Detail>
                    <Detail label="Language">{vendor.language}</Detail>
                    <Detail label="Payment terms">{vendor.paymentTerms}</Detail>
                    <Detail label="Buyer-facing badge" wide>{badge?.label || "Not assigned"}</Detail>
                  </dl>
                  <div className={styles.badgeActions}>
                    {badge && (
                      // eslint-disable-next-line @next/next/no-img-element -- this is a small badge preview.
                      <img src={badge.src} alt="" width={34} height={42} />
                    )}
                    <button type="button" className={styles.button} disabled={busy} onClick={() => {
                      const listingBadgeType = badge ? "" : "verified_supplier";
                      void updateListing({ listingBadgeType, listingVerified: Boolean(listingBadgeType) }, badge ? "Buyer-facing badge removed." : "Verified Supplier badge assigned.");
                    }}>{badge ? "Remove badge" : `Assign ${VENDOR_BADGES.verified_supplier.label} badge`}</button>
                  </div>
                  {vendor.awardsImageUrl && (
                    <a className={styles.awards} href={vendor.awardsImageUrl} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element -- awards may come from external sites. */}
                      <img src={vendor.awardsImageUrl} alt="" loading="lazy" />
                      <span className={styles.documentLink}>View awards &amp; recognitions <ExternalLink size={14} aria-hidden="true" /></span>
                    </a>
                  )}
                </Card>
              </div>
            </div>
          </form>
        </FormProvider>
      </section>

      <section role="tabpanel" id="vendor-panel-rich" aria-labelledby="vendor-tab-rich" tabIndex={0}
        className={styles.panel} hidden={view !== "rich"}>
        {richOpened && (
          <RichProfileEditor
            adminVendorId={vendor.id}
            adminVendorApproved={vendor.approved}
            onSaveSuccess={() => notifySaved("Rich Profile saved")}
          />
        )}
      </section>
    </div>
  );
}
