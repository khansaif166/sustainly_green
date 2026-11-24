/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Inter } from "next/font/google";
import type { CSSProperties, ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Award, Building2, CalendarDays, CheckCircle2, ChevronDown, ChevronRight, Clock, Download, Factory, FileBadge, FileText, Globe, Handshake, Leaf, Mail, MapPin, MessageCircle, Phone, Share2, ShieldCheck, Trophy, UserRound, type LucideIcon } from "lucide-react";
import type { IconType } from "react-icons";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter, FaYoutube } from "react-icons/fa6";
import Header from "@/app/components/Header";
import Footer from "@/app/components/layouts/Footer";
import { safeWebUrl } from "@/lib/richVendorProfile";
import type { PublicRichProfile } from "@/lib/richVendorServer";
import type { fetchApprovedProductsPage } from "@/lib/supabasePublic";
import {
  BannerAds, CatalogGrid, ClaimBusiness, CredentialCarousel, Gallery, LatestNews, ProfileNavigation, ProfileVideos, PromotionalVideos, QuoteForm, ShareProfile,
} from "./RichProfileInteractions";
import styles from "./richProfile.module.css";

const inter = Inter({ subsets: ["latin"], variable: "--rich-profile-inter" });

type CatalogPage = Awaited<ReturnType<typeof fetchApprovedProductsPage>>;
type Media = PublicRichProfile["media"][number];

const socialPlatformIcons: Partial<Record<string, IconType>> = {
  Facebook: FaFacebookF,
  Instagram: FaInstagram,
  LinkedIn: FaLinkedinIn,
  X: FaXTwitter,
  YouTube: FaYoutube,
};

function Panel({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return <section id={id} className={styles.panel}><h2>{title}</h2>{children}</section>;
}

function Facts({ items, className = styles.facts }: { items: { label: string; value: string }[]; className?: string }) {
  if (!items.length) return null;
  return <dl className={className}>{items.map(({ label, value }) => (
    <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
  ))}</dl>;
}

function SidebarCard({ id, title, icon: Icon, greenHeading = false, children }: {
  id?: string; title: string; icon: LucideIcon; greenHeading?: boolean; children: ReactNode;
}) {
  return (
    <section id={id} className={`${styles.panel} ${styles.sidebarCard}${greenHeading ? ` ${styles.sidebarCardWithGreenHeading}` : ""}`}>
      <div className={styles.panelTitle}><span className={styles.iconTile}><Icon size={17} aria-hidden="true" /></span><h2>{title}</h2></div>
      {greenHeading ? <div className={styles.sidebarCardBody}>{children}</div> : children}
    </section>
  );
}

function BusinessHours({ hours }: { hours: string }) {
  const lines = hours.split(/\r\n?|\n/).map(line => line.trim()).filter(Boolean);

  return <ul role="list" className={styles.hoursList}>
    {lines.map((line, index) => {
      const schedule = line.match(/^([^\d:]+?)\s*[:,]\s*((?:\d|closed\b|open\b|by appointment\b).*)$/i);

      return <li className={styles.hoursRow} key={`${index}-${line}`}>
        {schedule ? <><strong>{schedule[1]}</strong><span>{schedule[2]}</span></> : line}
      </li>;
    })}
  </ul>;
}

function Person({ name, title, role, photo }: {
  name?: string | null; title: string; role?: string | null; photo?: Media;
}) {
  if (!name && !role && !photo) return null;
  return <div className={styles.person}>
    {photo ? <img src={photo.url} alt={name || photo.title} loading="lazy" /> : <span className={styles.personIcon}><UserRound aria-hidden="true" size={20} /></span>}
    <div><h3>{name || title}</h3>{(role || name) && <p>{role || title}</p>}</div>
  </div>;
}

function FileLink({ href, label, download, className = styles.file }: {
  href: string; label: string; download?: string; className?: string;
}) {
  return (
    <a href={href} target="_blank" rel="noreferrer" download={download} className={className}>
      <Download size={18} aria-hidden="true" />{label}
    </a>
  );
}

const certificateDateFormat = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "UTC" });

function certificateDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value) return date;
}

function CertificateCard({ certificate, today }: {
  certificate: PublicRichProfile["certificates"][number]; today: Date;
}) {
  const { name, issuer, scope, number, issued, expires, documentUrl, proofUrl } = certificate;
  const expiryDate = certificateDate(expires);
  const fields = [
    { label: "Scope", value: scope },
    { label: "Certificate number", value: number },
    { label: "Issued", value: issued, date: certificateDate(issued) },
    { label: "Expires", value: expires, date: expiryDate },
  ].filter(field => field.value);

  return <article className={styles.certificate}>
    <div className={styles.credentialIdentity}>
      <span className={styles.iconTile}><Award size={17} aria-hidden="true" /></span>
      <div>
        <div className={styles.certificateTitle}>
          <h3>{name}</h3>
          {expiryDate && expiryDate < today && <span className={styles.expiredCertificate}>Expired</span>}
        </div>
        {issuer && <p>{issuer}</p>}
      </div>
    </div>
    {fields.length > 0 && <dl className={styles.certificateFacts}>
      {fields.map(({ label, value, date }) => <div key={label}>
        <dt>{label}</dt>
        <dd>{date ? <time dateTime={value}>{certificateDateFormat.format(date)}</time> : value}</dd>
      </div>)}
    </dl>}
    {(documentUrl || proofUrl) && <div className={styles.documentActions}>
      {documentUrl && <a href={documentUrl} target="_blank" rel="noreferrer"
        className={`${styles.button} ${styles.tint} ${styles.credentialAction}`} aria-label={`View document for ${name} (opens in a new tab)`}>
        View document <ArrowUpRight size={14} aria-hidden="true" />
      </a>}
      {proofUrl && <a href={proofUrl} target="_blank" rel="noreferrer"
        className={`${styles.button} ${styles.credentialAction}`} aria-label={`Verify certificate ${name} (opens in a new tab)`}>
        Verify certificate <ArrowUpRight size={14} aria-hidden="true" />
      </a>}
    </div>}
  </article>;
}

function Credentials({ profile }: { profile: PublicRichProfile }) {
  const documents = profile.media.filter(item => item.purpose === "credential" &&
    !profile.certificates.some(cert => cert.documentUrl === item.url));
  const report = profile.media.find(item => item.purpose === "report");
  const files = report ? [...documents, report] : documents;
  const count = profile.certificates.length + files.length;
  if (!count) return null;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return <section className={styles.panel} id="credentials" aria-labelledby="credentials-title">
    <div className={styles.iconHeading}>
      <span className={styles.iconTile}><FileBadge size={17} aria-hidden="true" /></span>
      <h2 id="credentials-title">Certifications and documents</h2>
    </div>
    <CredentialCarousel count={count}>
      {profile.certificates.map((certificate, index) => <li key={`${certificate.name}-${index}`}>
        <CertificateCard certificate={certificate} today={today} />
      </li>)}
      {files.map(item => <li key={item.id}>
        <a className={styles.credentialDocument} href={item.url} target="_blank" rel="noreferrer"
          aria-label={`View PDF ${item.title} (opens in a new tab)`}>
          <div className={styles.credentialIdentity}>
            <span className={styles.iconTile}><FileText size={17} aria-hidden="true" /></span>
            <div>
              <h3>{item.title}</h3>
              <p>{item.purpose === "report" ? "Sustainability report or policy" : "Certification document"}</p>
            </div>
          </div>
          <span className={styles.credentialDocumentAction}>View PDF <ArrowUpRight size={14} aria-hidden="true" /></span>
        </a>
      </li>)}
    </CredentialCarousel>
  </section>;
}

function AwardCard({ name, description, issuer, year, imageUrl, proofUrl }: {
  name?: string; description?: string | null; issuer?: string; year?: string; imageUrl?: string; proofUrl?: string;
}) {
  const title = name || (description ? undefined : "Award image");

  return <article className={styles.awardCard}>
    {imageUrl && <a className={styles.awardArtwork} href={imageUrl} target="_blank" rel="noreferrer"
      aria-label={name ? `View award image for ${name} (opens in a new tab)` : "View award image (opens in a new tab)"}>
      <img src={imageUrl} alt="" loading="lazy" decoding="async" />
      <span className={styles.awardArtworkAction}><ArrowUpRight size={16} aria-hidden="true" /></span>
    </a>}
    <div className={styles.awardBody}>
      <div className={styles.awardIdentity}>
        {!imageUrl && <span className={styles.iconTile}><Award size={17} aria-hidden="true" /></span>}
        <div>
          {(title || year) && <div className={styles.awardTitle}>
            {title && <h3>{title}</h3>}
            {year && <span className={styles.awardYear}>{year}</span>}
          </div>}
          {issuer && <p className={styles.awardIssuer}>{issuer}</p>}
          {description && <p className={styles.awardDescription}>{description}</p>}
        </div>
      </div>
      {proofUrl && <a className={`${styles.button} ${styles.tint} ${styles.awardProof}`} href={proofUrl} target="_blank" rel="noreferrer"
        aria-label={`View proof for ${title} (opens in a new tab)`}>
        View proof <ArrowUpRight size={14} aria-hidden="true" />
      </a>}
    </div>
  </article>;
}

function Awards({ profile }: { profile: PublicRichProfile }) {
  const otherImages = profile.media.filter(item => item.purpose === "award" && !profile.awards.some(award => award.imageUrl === item.url));
  const hasLegacyAward = profile.legacyAward || profile.legacyAwardImage;
  if (!profile.awards.length && !hasLegacyAward && !otherImages.length) return null;

  return <section className={styles.panel} aria-labelledby="awards-title">
    <div className={styles.iconHeading}>
      <span className={styles.iconTile}><Trophy size={17} aria-hidden="true" /></span>
      <h2 id="awards-title">Awards and recognition</h2>
    </div>
    <div className={styles.awardsGrid}>
      {profile.awards.map((award, index) => <AwardCard key={`${award.name}-${index}`} {...award} />)}
      {hasLegacyAward && <AwardCard imageUrl={profile.legacyAwardImage} description={profile.legacyAward} />}
      {otherImages.map(item => <AwardCard key={item.id} name={item.title} imageUrl={item.url} />)}
    </div>
  </section>;
}

export default function RichVendorProfile({ profile, products, services }: {
  profile: PublicRichProfile;
  products: CatalogPage;
  services: CatalogPage;
}) {
  const cover = profile.media.find(item => item.purpose === "cover");
  const contactPhoto = profile.media.find(item => item.purpose === "contact");
  const directorPhoto = profile.media.find(item => item.purpose === "director");
  const brochure = profile.media.find(item => item.purpose === "brochure");
  const gallery = profile.media.filter(item => item.purpose === "gallery");
  const partners = profile.media.filter(item => item.purpose === "partner");
  const introduction = profile.media.filter(item => item.purpose === "intro");
  const productVideos = profile.media.filter(item => item.purpose === "video");
  const banners = profile.ads.filter(ad => ad.kind === "banner");
  const hasBanners = banners.length > 0;
  const videoAds = profile.ads.filter(ad => ad.kind === "video");
  const credentials = Boolean(profile.certificates.length || profile.media.some(item => item.purpose === "credential" || item.purpose === "report"));
  const contactMethods = [
    { label: "Phone", value: profile.phone, href: `tel:${profile.phone}`, icon: Phone },
    { label: "Email", value: profile.email, href: `mailto:${profile.email}`, icon: Mail },
  ].filter(method => method.value);
  const hasContactPerson = Boolean(profile.contact && (profile.contact.name || profile.contact.role || contactPhoto));
  const hasDirectContact = Boolean(hasContactPerson || contactMethods.length || profile.whatsapp);
  const address = profile.address || profile.location;
  const mapQuery = encodeURIComponent([profile.address, profile.location].filter(Boolean).join(", "));
  const mapUrl = profile.mapUrl || (mapQuery ? `https://www.google.com/maps/search/?api=1&query=${mapQuery}` : null);
  const mapPreview = profile.address && mapUrl &&
    /(^|\.)(?:google\.com|maps\.app\.goo\.gl)$/.test(new URL(mapUrl).hostname)
    ? `https://www.google.com/maps?q=${mapQuery}&output=embed` : null;
  const contactSection = hasDirectContact ? "contact" : profile.hours ? "hours" : mapUrl ? "address"
    : profile.socialLinks.length ? "social" : brochure ? "catalogue" : undefined;
  const coverCategory = profile.categories[0];
  const coverHeading = profile.tagline || coverCategory;
  const legalName = profile.companyData.find(item => item.label === "Legal company name")?.value;
  const sections = [
    { title: "Overview", id: "overview", visible: true },
    { title: "Products", id: "products", visible: Boolean(products.total) },
    { title: "Services", id: "services", visible: Boolean(services.total) },
    { title: "Promotional videos", id: "promotional-videos", visible: Boolean(videoAds.length) },
    { title: "Gallery", id: "gallery", visible: Boolean(gallery.length) },
    { title: "Videos", id: "videos", visible: Boolean(introduction.length || productVideos.length) },
    { title: "Credentials", id: "credentials", visible: credentials },
    { title: "Contact", id: contactSection ?? "contact", visible: Boolean(contactSection) },
  ].filter(section => section.visible);
  const leadFacts = [
    profile.companyData.find(item => item.label === "Industry"),
    profile.location && { label: "Location", value: profile.location },
    profile.companyData.find(item => item.label === "Established"),
    profile.companyData.find(item => item.label === "Business type"),
  ].filter((item): item is { label: string; value: string } => Boolean(item));
  const remainingFacts = profile.companyData.filter(item => !leadFacts.some(fact => fact.label === item.label));
  const sustainabilityStatus = profile.sustainability.find(item => item.label === "Claim status");
  const sustainabilityFacts = profile.sustainability.filter(item => item !== sustainabilityStatus);

  return <>
    <Header />
    <div className={`${styles.page} ${inter.variable}`}>
      <main key={profile.id} className={styles.shell} id="rich-profile">
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Home</Link><ChevronRight size={13} aria-hidden="true" />
          <Link href="/find-vendors">Suppliers</Link><ChevronRight size={13} aria-hidden="true" />
          <span aria-current="page">{profile.name}</span>
        </nav>
        <header className={styles.hero} data-cover={!hasBanners && Boolean(cover || coverHeading)}>
          {hasBanners ? <BannerAds ads={banners} /> : (cover || coverHeading) && <div className={styles.cover} data-image={Boolean(cover)}>
            {cover && <img src={cover.url} alt={cover.title} fetchPriority="high" />}
            {coverHeading && <div className={styles.coverCopy}>
              {profile.tagline && coverCategory && <p>{coverCategory}</p>}
              <div>{coverHeading}</div>
            </div>}
          </div>}
          <div className={styles.identity}>
            <div className={styles.logo} aria-hidden="true">{profile.logo
              ? <img src={profile.logo} alt="" width={96} height={96} />
              : profile.initials}</div>
            <div className={styles.identityCopy}>
              <div className={styles.titleRow}>
                <h1>{profile.name}</h1>
                {profile.verified && <span className={styles.badge}><ShieldCheck size={13} aria-hidden="true" /> Verified</span>}
                {profile.claimed && <span className={`${styles.badge} ${styles.claimed}`}><CheckCircle2 size={13} aria-hidden="true" /> Claimed</span>}
                {profile.unclaimed && <span className={`${styles.badge} ${styles.unclaimed}`}>Unclaimed listing</span>}
              </div>
              {profile.tagline && <p className={styles.tagline}>{profile.tagline}</p>}
              <div className={styles.meta}>
                {profile.location && <span><MapPin size={14} aria-hidden="true" /> {profile.location}</span>}
                {profile.established && <span><CalendarDays size={14} aria-hidden="true" /> Established {profile.established}</span>}
              </div>
            </div>
            <div className={styles.actions}>
              <div className={styles.actionGroup}>
                <a href="#quote" className={`${styles.button} ${styles.primary}`}><FileText size={17} aria-hidden="true" /> Request a quote</a>
                {(profile.unclaimed || profile.claimRequested) && <ClaimBusiness id={profile.id} href={profile.href} requested={profile.claimRequested} />}
              </div>
              <div className={styles.actionGroup}>
                {profile.phone && <a href={`tel:${profile.phone}`} className={`${styles.button} ${styles.actionSecondary}`} aria-label="Call" title="Call"><Phone size={17} aria-hidden="true" /><span>Call</span></a>}
                {profile.website && <a href={profile.website} className={`${styles.button} ${styles.actionSecondary}`} target="_blank" rel="noreferrer" aria-label="Website" title="Website"><Globe size={17} aria-hidden="true" /><span>Website</span></a>}
                <ShareProfile href={profile.href} name={profile.name} />
              </div>
            </div>
            {profile.categories.length > 0 && <ul className={styles.tags} aria-label="Vendor categories">
              {profile.categories.map(category => <li key={category}>{category}</li>)}
            </ul>}
          </div>
        </header>

        <ProfileNavigation sections={sections} />

        <div className={styles.contentGrid}>
          <div className={styles.mainColumn}>
            <section id="overview" className={`${styles.panel} ${styles.aboutPanel}`} aria-labelledby="overview-title">
              <div className={styles.iconHeading}>
                <span className={styles.iconTile}><Building2 size={17} aria-hidden="true" /></span>
                <h2 id="overview-title">About the business</h2>
              </div>
              {profile.description && <p className={styles.prose}>{profile.description}</p>}
              {profile.offerings && <dl className={styles.aboutOfferings}>
                <dt>Offerings</dt><dd>{profile.offerings}</dd>
              </dl>}
              {leadFacts.length > 0 && <dl className={styles.businessFacts}>
                {leadFacts.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
              </dl>}
              {(remainingFacts.length > 0 || profile.director) && <details className={styles.companyDetails}>
                <summary>Company details <ChevronDown size={17} aria-hidden="true" /></summary>
                <div className={styles.companyDetailsBody}>
                  <Facts items={remainingFacts} />
                  {profile.director && <Person name={profile.director.name} title="Director" role={profile.director.role} photo={directorPhoto} />}
                </div>
              </details>}
              {profile.sustainability.length > 0 && <section className={styles.sustainability} aria-labelledby="sustainability-title">
                <div className={styles.sustainabilityHeading}>
                  <div className={styles.iconHeading}>
                    <Leaf size={17} aria-hidden="true" />
                    <h3 id="sustainability-title">Sustainability highlights</h3>
                  </div>
                  {sustainabilityStatus && <p className={styles.claimStatus}>{sustainabilityStatus.label} <strong>{sustainabilityStatus.value}</strong></p>}
                </div>
                <Facts items={sustainabilityFacts} />
              </section>}
            </section>
            {products.total > 0 && <CatalogGrid vendorId={profile.id} kind="Product" initial={products} />}
            {services.total > 0 && <CatalogGrid vendorId={profile.id} kind="Service" initial={services} />}
            <PromotionalVideos videos={videoAds} />
            <Gallery images={gallery} />
            <ProfileVideos introduction={introduction} products={productVideos} />
            <Credentials profile={profile} />
            {profile.caseStudies && <Panel title="Project case studies"><div className={styles.caseStudy}><p className={styles.prose}>{profile.caseStudies}</p></div></Panel>}
            {partners.length > 0 && <section className={styles.panel} aria-labelledby="partners-title">
              <div className={styles.iconHeading}>
                <span className={styles.iconTile}><Handshake size={17} aria-hidden="true" /></span>
                <h2 id="partners-title">Our partners</h2>
              </div>
              <ul className={styles.partners} role="list" style={{ "--partner-count": partners.length } as CSSProperties}>
                {partners.map(item => <li key={item.id} className={styles.partnerCard}>
                  <div className={styles.partnerLogo}><img src={item.url} alt="" loading="lazy" decoding="async" /></div>
                  <span className={styles.partnerName}>{item.title}</span>
                </li>)}
              </ul>
            </section>}
            <Awards profile={profile} />
            {profile.commercial.length > 0 && <section className={styles.panel} aria-labelledby="capabilities-title">
              <div className={styles.iconHeading}>
                <span className={styles.iconTile}><Factory size={17} aria-hidden="true" /></span>
                <h2 id="capabilities-title">Production and commercial capabilities</h2>
              </div>
              <Facts items={profile.commercial} className={styles.capabilityFacts} />
            </section>}
            {profile.procurement.length > 0 && <Panel title="Procurement preferences"><Facts items={profile.procurement} /></Panel>}
            {profile.memberships.length > 0 && <Panel title="Trade associations and memberships"><ul className={styles.related}>
              {profile.memberships.map((item, index) => <li key={`${item.name}-${index}`}>
                {safeWebUrl(item.proofUrl) ? <a href={item.proofUrl} target="_blank" rel="noreferrer">{item.name}</a> : item.name}
              </li>)}
            </ul></Panel>}
            {profile.news.length > 0 && <LatestNews updates={profile.news} />}
          </div>

          <aside className={styles.sidebar} aria-label="Quotes and supplier contact">
            <QuoteForm id={profile.id} name={profile.name} href={profile.href} categories={profile.categories} />
            {hasDirectContact && <SidebarCard id="contact" title="Contact supplier" icon={UserRound} greenHeading>
              <div className={styles.supplierContact}>
                {profile.contact && <Person name={profile.contact.name} title="Contact person" role={profile.contact.role} photo={contactPhoto} />}
                {contactMethods.length > 0 && <ul role="list" className={styles.contactMethods}>
                  {contactMethods.map(({ label, value, href, icon: Icon }) => (
                    <li key={label}>
                      <a href={href} className={styles.contactMethod}>
                        <span className={styles.contactMethodIcon}><Icon size={16} aria-hidden="true" /></span>
                        <span className={styles.contactMethodText}>
                          <span className={styles.contactMethodLabel}>{label}</span>
                          <span className={styles.contactMethodValue}>{value}</span>
                        </span>
                        <ChevronRight size={16} className={styles.contactMethodArrow} aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>}
                {profile.whatsapp && (
                  <a className={`${styles.button} ${styles.tint} ${styles.contactWhatsApp}`} href={`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                    <MessageCircle size={17} aria-hidden="true" /> Chat on WhatsApp
                  </a>
                )}
              </div>
            </SidebarCard>}
            {profile.hours && <SidebarCard id="hours" title="Business hours" icon={Clock} greenHeading>
              <BusinessHours hours={profile.hours} />
            </SidebarCard>}
            {mapUrl && <SidebarCard id="address" title="Address" icon={MapPin} greenHeading>
              <div className={styles.addressPanel}>
                <div className={styles.addressRow}>
                  {(legalName || address) && <address className={styles.address}>
                    {legalName && <span className={styles.addressCompany}>{legalName}</span>}
                    {address && <span>{address}</span>}
                  </address>}
                  <a className={styles.mapLink} href={mapUrl} target="_blank" rel="noreferrer">
                    View map <ArrowRight size={16} aria-hidden="true" />
                  </a>
                </div>
                {mapPreview && <iframe className={styles.mapPreview} title={`Map for ${profile.name}`} src={mapPreview} loading="lazy" referrerPolicy="no-referrer" />}
              </div>
            </SidebarCard>}
            {profile.socialLinks.length > 0 && <SidebarCard id="social" title="Follow us" icon={Share2} greenHeading>
              <ul className={styles.socialLinks} role="list">
                {profile.socialLinks.map(({ platform, url }, index) => {
                  const Icon = socialPlatformIcons[platform] ?? Globe;
                  const isCustom = platform === "Other";
                  const label = isCustom ? new URL(url).hostname.replace(/^www\./i, "") : platform;

                  return (
                    <li key={`${platform}-${index}`} className={isCustom ? styles.customSocialLink : undefined}>
                      <a className={styles.socialLink} href={url} rel="noreferrer" target="_blank">
                        <span className={styles.socialLinkIcon}><Icon size={15} aria-hidden="true" /></span>
                        <span>{label}</span>
                        <ArrowUpRight className={styles.socialLinkArrow} size={14} aria-hidden="true" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </SidebarCard>}
            {brochure && <SidebarCard id="catalogue" title="Download catalogue" icon={Download} greenHeading>
              <div className={styles.catalogueFile}>
                <span className={styles.iconTile}><FileText size={17} aria-hidden="true" /></span>
                <div>
                  <p className={styles.catalogueTitle}>{brochure.title}</p>
                  <p className={styles.catalogueFormat}>PDF document</p>
                </div>
              </div>
              <FileLink href={brochure.url} label="Download PDF" download="Download catalogue.pdf"
                className={`${styles.button} ${styles.tint} ${styles.catalogueDownload}`} />
            </SidebarCard>}
          </aside>
        </div>

        <div className={styles.cta}>
          <span className={styles.ctaIcon}><FileText size={24} aria-hidden="true" /></span>
          <div><h2>Have a project in mind?</h2><p>Tell {profile.name} what you need and get a quote for your project.</p></div>
          <a href="#quote" className={styles.button}>Request a quote now</a>
        </div>
      </main>
    </div>
    <Footer />
  </>;
}
