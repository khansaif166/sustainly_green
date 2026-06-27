# Sustainly Firebase Data Schema

> Legacy reference: the app has been migrated to Supabase-backed APIs. Keep this document only for understanding the old Firebase shape, legacy field names, and reconciliation/import work.

This document defines the recommended canonical Firebase schema for the current app. It is based on the existing Firestore and Storage usage in the codebase, but tightens naming, types, indexes, and ownership rules so the data is fast to query and clean to migrate later.

## Architecture Position

Current app architecture:

```text
Next.js client components -> Firebase Auth -> Firestore -> Firebase Storage
Firebase Function: rfqs/{rfqId} create trigger -> email
```

Recommended Firebase shape until Supabase migration:

```text
Firebase Auth owns credentials.
users/{uid} owns app role and lightweight routing flags.
buyers/{uid} and vendors/{uid} own role-specific profiles.
Products, RFQs, content, and master data stay top-level collections.
Storage stores files; Firestore stores only durable URLs and metadata.
```

Use top-level collections instead of deep subcollections for marketplace objects. The app already queries across all vendors/products/RFQs, and top-level collections keep indexes simple and reads fast.

## Global Conventions

- Document IDs:
  - Auth-bound profile documents use the Firebase Auth UID as the document ID.
  - Business objects use Firestore auto IDs unless a stable slug is required.
- Timestamp fields:
  - `createdAt`: `Timestamp`, set once.
  - `updatedAt`: `Timestamp`, updated on each mutation.
  - Event timestamps use specific names like `respondedAt`, `approvedAt`, `lastViewedAt`.
- Boolean fields must be booleans, not strings.
  - Existing rule drift around `products.approved == "true"` should be corrected to `true`.
- Store money and quantities as numbers where math/filtering is needed.
  - Keep human-entered text like `estimatedQuantity` as string only when units vary.
- Denormalized read fields are allowed for speed, but source-of-truth ownership must be clear.

## Canonical Collections

```text
users/{uid}
buyers/{uid}
vendors/{uid}
products/{productId}
categories/{categoryId}
subcategories/{subcategoryId}
tags/{tagId}
rfqs/{rfqId}
blogs/{blogId}
careers/{careerId}
jobApplications/{applicationId}
settings/homepageBanner
certifications/{certificationId}
certifyingBodies/{bodyId}
certificationRequests/{requestId}
```

## Deprecated / Duplicate Collections

These names appear in the current code and should be migrated into canonical collections:

| Existing collection | Canonical collection | Reason |
| --- | --- | --- |
| `certifications_master` | `certifications` | Snake/camel duplicate with same business purpose |
| `certificationsMaster` | `certifications` | Duplicate master certification store |
| `certification_requests` | `certificationRequests` | Duplicate request store |

During migration, read both old names only through a compatibility layer, then write only to the canonical names.

## users/{uid}

Purpose: lightweight account, role, and navigation state. Firebase Auth is the source of truth for email/password identity.

Document ID: Firebase Auth UID.

```ts
type UserDoc = {
  uid: string;
  name: string;
  email: string;
  role: "ADMIN" | "BUYER" | "VENDOR";
  emailVerified: boolean;

  companyName?: string;

  buyerProfileComplete?: boolean;
  buyerApproved?: boolean;

  vendorProfileComplete?: boolean;
  vendorApproved?: boolean;

  disabled?: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
};
```

Access:

- User can read/update own non-role fields.
- Admin can read/update all.
- Role changes should be admin-only.

Fast access patterns:

- Login redirect: `users/{uid}` direct read.
- Admin users page: collection scan or `role` filter.

Indexes:

- `role ASC`
- `createdAt DESC`

## vendors/{uid}

Purpose: vendor company profile, approval state, sustainability data, and marketplace metadata.

Document ID: Firebase Auth UID.

```ts
type VendorDoc = {
  uid: string;

  companyName: string;
  logoUrl?: string;
  registrationType: string;
  cinRegistration: string;
  gstNumber: string;
  yearOfIncorporation: string;
  registeredAddress: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;

  primaryContactName: string;
  designation: string;
  businessEmail: string;
  whatsapp: string;
  alternatePhone?: string;

  businessType: string;
  primaryCategory: string;
  subCategories: string[];
  shortDescription: string;
  keyProducts: string[];
  targetIndustries?: string;
  preferredBuyerGeography?: string;
  supplyCapacity?: string;
  moq?: string;
  exportCapability: boolean;
  exportMarkets?: string;

  primarySustainabilityCert: string;
  issuingBody: string;
  certificateFileUrl?: string;
  additionalCerts?: Array<{
    name: string;
    id: string;
    expiry: string;
  }>;
  sustainabilityPractice: string;
  recycledContent?: string;
  carbonFootprint?: string;
  eprRegistration?: string;
  socialCompliance?: string;
  netZeroCommitment?: string;

  listingTier: string;
  caseStudies?: string;
  awards?: string;
  awardsImageUrl?: string;
  lookingForBuyersIn?: string;
  willingnessToOfferSamples: boolean;
  paymentTerms?: string;
  language?: string;

  lifecycleStage?: string;
  packaging?: string;
  energySource?: string;
  waterRecycling?: string;
  wasteReduction?: string;
  sdgAlignment?: string[];
  auditFrequency?: string;
  certifyingBody?: string;
  ghgScope1?: string;
  ghgScope2?: string;
  ghgScope3?: string;

  declarationAgreed: boolean;
  declarationName: string;
  declarationDate: string;

  approved: boolean;
  status?: "draft" | "submitted" | "approved" | "rejected";
  approvedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

Access:

- Public can read approved vendors for directory pages.
- Vendor can read/update own document.
- Admin can read/update/delete all.

Fast access patterns:

- Homepage: approved vendors limit 4.
- Header/search: approved vendors.
- Vendor profile/dashboard: direct read by UID.
- Admin approval queue: `approved == false`.

Indexes:

- `approved ASC`
- `approved ASC, companyName ASC`
- `primaryCategory ASC, approved ASC`
- `createdAt DESC`

## buyers/{uid}

Purpose: buyer organization profile, procurement needs, and approval state.

Document ID: Firebase Auth UID.

```ts
type BuyerDoc = {
  uid: string;

  companyInfo: {
    companyName: string;
    brandName?: string;
    organisationType: string;
    stockListed: string;
    cinRegistration: string;
    gstNumber: string;
    registeredAddress: string;
    city: string;
    state: string;
    pinCode: string;
    country: string;
    contactPerson: string;
    designation: string;
    department?: string;
    email: string;
    mobile: string;
    alternatePhone?: string;
    linkedin?: string;
    website?: string;
  };

  businessOverview: {
    buyerSegment: string;
    industry: string;
    secondaryIndustry?: string;
    noOfEmployees: string;
    annualRevenue: string;
    noOfLocations?: string;
    procurementBudget?: string;
    geographyOfOperation: string;
    keyMarkets: string[];
  };

  sustainability: {
    sustainabilityPolicy: string;
    esgReport: string;
    sustainabilityDescription?: string;
    certifications: string[];
  };

  procurement: {
    categoriesNeeded: string[];
    secondaryCategories: string[];
    procurementVolume?: string;
    vendorLocationPreference?: string;
    preferredVendorSize?: string;
    minCertificationRequired: string;
    pricingModel?: string;
    orderFrequency?: string;
    typicalOrderValue?: string;
    paymentTerms?: string;
    communicationMode?: string;
    siteAuditRequired?: string;
    ndaRequired?: string;
    multiLocationDelivery?: string;
  };

  segmentDetails: Record<string, string | string[] | undefined>;

  declaration: {
    name: string;
    designation?: string;
    date: string;
  };

  status: "draft" | "submitted" | "approved" | "rejected";
  approved: boolean;
  approvedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

Access:

- Buyer can read/update own document.
- Admin can read/update/delete all.
- Do not make buyer profiles public.

Fast access patterns:

- Buyer dashboard/profile: direct read by UID.
- Admin approval queue: `approved == false`.

Indexes:

- `approved ASC`
- `status ASC, updatedAt DESC`
- `createdAt DESC`

## products/{productId}

Purpose: marketplace listings for products and services.

Document ID: Firestore auto ID.

```ts
type ProductDoc = {
  vendorId: string;
  vendorName: string; // denormalized for card/list speed

  title: string;
  description: string;

  listingType: string;
  availableFor: string[];

  categoryId: string;
  subCategoryId?: string;

  images: string[];

  priceType: string;
  price: number | null;
  currency: string;
  moq: number | null;
  discount?: string;

  shipRegions: string[];
  inStock: boolean;

  featured: boolean;
  isAd: boolean;
  adPosition?: "hero" | "featured" | "sponsored";
  adStartedAt?: Timestamp;
  adEndsAt?: Timestamp;

  sustainabilityTagIds: string[];
  sustainabilityTagNames: string[]; // denormalized for fast display
  sustainabilityClaim?: string;

  approved: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED";

  views: number;
  lastViewedAt: Timestamp | null;

  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

Access:

- Public can read only `approved == true`.
- Vendor can create/read/update own products.
- Admin can read/write/delete all products.

Fast access patterns:

- Homepage/category/browse: approved products.
- Product detail: direct read by ID, increment views.
- Vendor dashboard: `vendorId == uid`.
- Admin review: status and created date.
- Ads: `isAd == true`, `featured == true`.

Indexes:

- `approved ASC, createdAt DESC`
- `approved ASC, categoryId ASC, title ASC`
- `vendorId ASC, createdAt DESC`
- `vendorId ASC, status ASC, createdAt DESC`
- `status ASC, createdAt DESC`
- `featured ASC, approved ASC, createdAt DESC`
- `isAd ASC, approved ASC`
- `listingType ARRAY_CONTAINS, approved ASC, categoryId ASC, title ASC`

Important cleanup:

- Current code writes `approved` as boolean. Firestore rules must also check boolean `true`, not string `"true"`.

## categories/{categoryId}

Purpose: primary marketplace category.

Document ID: Firestore auto ID.

```ts
type CategoryDoc = {
  name: string;
  slug: string;
  imageUrl: string;
  active: boolean;
  sortOrder?: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
};
```

Access:

- Public read active categories.
- Admin write.

Indexes:

- `active ASC`
- `active ASC, sortOrder ASC`
- `slug ASC`

## subcategories/{subcategoryId}

Purpose: child category.

Document ID: Firestore auto ID.

```ts
type SubcategoryDoc = {
  name: string;
  categoryId: string;
  active: boolean;
  sortOrder?: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
};
```

Access:

- Public read active subcategories.
- Admin write.

Indexes:

- `categoryId ASC, active ASC`
- `active ASC`

## tags/{tagId}

Purpose: sustainability tags used by products.

Document ID: Firestore auto ID.

```ts
type TagDoc = {
  name: string;
  active: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
};
```

Access:

- Public read active tags.
- Admin write.

Indexes:

- `active ASC`
- `name ASC`

## rfqs/{rfqId}

Purpose: buyer/vendor quote requests and lifecycle tracking.

Document ID: Firestore auto ID.

Canonical shape:

```ts
type RFQDoc = {
  buyerId: string;
  vendorId?: string | null;
  productId?: string | null;

  requirementTitle: string;
  requirementType: "PRODUCT" | "SERVICE" | string;
  category?: string;
  estimatedQuantity: string;
  deliveryCountry: string;
  requiredTimeline: string;
  additionalDetails?: string;

  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string | null;

  status:
    | "RFQ_REQUESTED"
    | "VENDOR_RESPONDED"
    | "QUOTED"
    | "ACCEPTED"
    | "CONTACT_SHARED"
    | "CLOSED"
    | "CANCELLED";

  contactShared: boolean;

  vendorResponse?: {
    message: string;
    price?: string;
    timeline?: string;
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
    respondedAt: Timestamp | null;
    contactShared: boolean;
  };
  vendorContact?: {
    phone?: string;
    email?: string;
    businessEmail?: string;
  };

  respondedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

Access:

- Buyer can create/read/update own RFQs.
- Vendor can read/update RFQs assigned to them.
- Admin can read/update all.
- Public RFQ creation should be moved behind a server/API path if unauthenticated leads are required.

Fast access patterns:

- Buyer dashboard: `buyerId == uid`, ordered by `createdAt`.
- Vendor dashboard: `vendorId == uid`, ordered by `createdAt`.
- Admin leads/reports: all RFQs ordered by `createdAt`.
- Email function: trigger on create.

Indexes:

- `buyerId ASC, createdAt DESC`
- `buyerId ASC, createdAt ASC`
- `vendorId ASC, createdAt DESC`
- `vendorId ASC, status ASC, createdAt DESC`
- `buyerEmail ASC, createdAt DESC`
- `status ASC, createdAt DESC`

## blogs/{blogId}

Purpose: blog/content articles.

Document ID: Firestore auto ID.

```ts
type BlogDoc = {
  title: string;
  content: string; // HTML from editor
  image?: string;
  slug?: string;
  excerpt?: string;
  published?: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
};
```

Access:

- Public read published blogs.
- Admin write.

Indexes:

- `published ASC, createdAt DESC`
- `createdAt DESC`
- `slug ASC`

## careers/{careerId}

Purpose: job postings.

Document ID: Firestore auto ID.

```ts
type CareerDoc = {
  title: string;
  department?: string;
  location?: string;
  type?: string;
  description: string;
  active: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
};
```

Access:

- Public read active careers.
- Admin write.

Indexes:

- `active ASC, createdAt DESC`

## jobApplications/{applicationId}

Purpose: career applications.

Document ID: Firestore auto ID.

```ts
type JobApplicationDoc = {
  jobId: string;
  jobTitle: string;
  name: string;
  email: string;
  phone?: string;
  resumeURL: string;
  status?: "NEW" | "REVIEWED" | "SHORTLISTED" | "REJECTED";
  createdAt: Timestamp;
};
```

Access:

- Public can create with validation.
- Admin can read/update/delete.

Indexes:

- `createdAt DESC`
- `jobId ASC, createdAt DESC`
- `status ASC, createdAt DESC`

## settings/homepageBanner

Purpose: singleton homepage hero/banner setting.

Document ID: fixed string `homepageBanner`.

```ts
type HomepageBannerDoc = {
  imageUrl: string;
  linkUrl: string;
  active: boolean;
  updatedAt: Timestamp;
};
```

Access:

- Public read active setting.
- Admin write/delete.

## certifications/{certificationId}

Purpose: certification master data.

Document ID: Firestore auto ID.

```ts
type CertificationDoc = {
  name: string;
  description?: string;
  country?: string;
  status: "Active" | "Inactive";
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
};
```

Access:

- Public/vendor read active certifications.
- Admin write.

Indexes:

- `status ASC, name ASC`
- `name ASC`

## certifyingBodies/{bodyId}

Purpose: certification issuing body master data.

Document ID: Firestore auto ID.

```ts
type CertifyingBodyDoc = {
  name: string;
  description?: string;
  country?: string;
  status: "Active" | "Inactive";
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
};
```

Access:

- Public/vendor read active bodies.
- Admin write.

Indexes:

- `status ASC, name ASC`
- `name ASC`

## certificationRequests/{requestId}

Purpose: vendor requests for certification support.

Document ID: Firestore auto ID.

```ts
type CertificationRequestDoc = {
  vendorId: string;
  companyName?: string;
  email?: string;
  phone?: string;

  certificationId: string;
  certificationName?: string;
  message?: string;

  status: "NEW" | "REQUESTED" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "COMPLETED";
  createdAt: Timestamp;
  updatedAt?: Timestamp;
};
```

Access:

- Vendor can create/read own requests.
- Admin can read/update all.

Indexes:

- `vendorId ASC, createdAt DESC`
- `status ASC, createdAt DESC`
- `createdAt DESC`

## Storage Schema

Use predictable object paths and store download URLs plus optional path metadata in Firestore.

```text
vendors/{uid}/logos/{timestamp}_{filename}
vendors/{uid}/certs/{timestamp}_{filename}
vendors/{uid}/awards/{timestamp}_{filename}
products/{productIdOrDraftId}/{timestamp}_{filename}
categories/{timestamp}_{filename}
blogs/{uuid}
banners/home-hero-{timestamp}
resumes/{careerId}/{timestamp}_{filename}
```

Recommended Storage rules:

- Public read only for marketplace images, blogs, banners, and category images.
- Vendor write only under `vendors/{uid}/...`.
- Product image writes should require authenticated vendor/admin and ownership validation through a server-side path where possible.
- Resume reads should be admin-only. Do not leave resumes public.

## Firestore Index Plan

Keep `firestore.indexes.json` aligned with these high-traffic queries:

```json
[
  { "collection": "products", "fields": ["approved ASC", "createdAt DESC"] },
  { "collection": "products", "fields": ["approved ASC", "categoryId ASC", "title ASC"] },
  { "collection": "products", "fields": ["vendorId ASC", "createdAt DESC"] },
  { "collection": "products", "fields": ["vendorId ASC", "status ASC", "createdAt DESC"] },
  { "collection": "products", "fields": ["listingType ARRAY_CONTAINS", "approved ASC", "categoryId ASC", "title ASC"] },
  { "collection": "rfqs", "fields": ["buyerId ASC", "createdAt DESC"] },
  { "collection": "rfqs", "fields": ["vendorId ASC", "createdAt DESC"] },
  { "collection": "rfqs", "fields": ["vendorId ASC", "status ASC", "createdAt DESC"] },
  { "collection": "blogs", "fields": ["published ASC", "createdAt DESC"] },
  { "collection": "careers", "fields": ["active ASC", "createdAt DESC"] },
  { "collection": "jobApplications", "fields": ["jobId ASC", "createdAt DESC"] },
  { "collection": "vendors", "fields": ["approved ASC", "companyName ASC"] },
  { "collection": "buyers", "fields": ["approved ASC"] }
]
```

## Performance Rules

- Avoid loading full collections in headers and dashboards. Use `limit`, filters, and projected API responses when possible.
- Do not query all `products`, `vendors`, or `rfqs` for count cards once data grows. Keep aggregate counters under `analytics/dashboard` or compute server-side.
- Keep card/list documents small. Product cards should not require fetching tag documents one by one.
- Store tag names on products for display, but keep tag IDs for filtering and migration.
- Store vendor name/logo snapshot on products if cards need it often.
- Use compatibility reads for deprecated certification collections only temporarily.

## Known Schema Corrections Needed

1. Change Firestore rule `resource.data.approved == "true"` to boolean `resource.data.approved == true`.
2. Normalize certification collections into `certifications`, `certifyingBodies`, and `certificationRequests`.
3. Add `updatedAt` consistently to admin updates for categories, tags, careers, products, vendors, buyers, blogs, and RFQs.
4. Add `published` and `slug` to blogs before SEO/content growth.
5. Make resume files private or admin-only.
6. Move sensitive mutations like approvals and RFQ emails into server-side APIs or Cloud Functions.

## Supabase Migration Mapping

This Firebase schema maps cleanly into these future Supabase tables:

```text
auth.users -> profiles
users -> profiles
buyers -> buyers
vendors -> vendors
products -> products + product_images
categories -> categories
subcategories -> subcategories
tags -> sustainability_tags
rfqs -> rfqs + rfq_messages/vendor_responses
blogs -> blogs
careers -> careers
jobApplications -> job_applications
settings/homepageBanner -> site_settings
certifications -> certifications
certifyingBodies -> certifying_bodies
certificationRequests -> certification_requests
```

Keep `legacyFirebaseId` columns during migration for every migrated table so old URLs, references, and audit checks can be reconciled.
