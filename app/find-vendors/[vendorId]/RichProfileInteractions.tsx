"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Building2, ChevronDown, ChevronLeft, ChevronRight, Copy, Download, FileText, Image as ImageIcon, LayoutGrid, LoaderCircle, Megaphone, Newspaper, Package, Phone, Play, Send, Share2, ShieldCheck, Video as VideoIcon, Wrench, X } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  AUTH_SESSION_CLEARED_EVENT,
  AUTH_SESSION_SAVED_EVENT,
  ensureCurrentProfile,
  getStoredSession,
  getValidSession,
} from "@/lib/supabaseAuth";
import { submitVendorClaim, type PublicProduct } from "@/lib/supabasePublic";
import { productHref } from "@/lib/slug";
import { safeWebUrl, type PublicNewsUpdate } from "@/lib/richVendorProfile";
import styles from "./richProfile.module.css";

type Video = { id: string; title: string; url: string; embedded?: boolean; thumbnailUrl?: string };
type Ad = Video & { linkUrl?: string };

const sectionIcons = { Overview: LayoutGrid, Products: Package, Services: Wrench, "Promotional videos": Megaphone, Gallery: ImageIcon, Videos: VideoIcon, Credentials: ShieldCheck, Contact: Phone };

export function CatalogueDownload({ href }: { href: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "started" | "error">("idle");
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => request.current?.abort(), []);

  async function download() {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setStatus("loading");
    try {
      const response = await fetch(href, { signal: controller.signal });
      if (!response.ok) throw new Error("Catalogue download failed");
      const blob = await response.blob();
      if (controller.signal.aborted) return;
      if (!blob.size) throw new Error("Catalogue is empty");
      const url = URL.createObjectURL(blob);
      try {
        const link = document.createElement("a");
        link.href = url;
        link.download = "Download catalogue.pdf";
        document.body.appendChild(link);
        try { link.click(); } finally { link.remove(); }
      } finally {
        window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
      }
      setStatus("started");
    } catch {
      if (!controller.signal.aborted) setStatus("error");
    } finally {
      request.current = null;
    }
  }

  return <div className={styles.catalogueDownloadAction}>
    <button type="button" className={`${styles.button} ${styles.tint} ${styles.catalogueDownload}`}
      onClick={download} disabled={status === "loading"} aria-busy={status === "loading"}>
      {status === "loading" ? <LoaderCircle size={18} className={styles.catalogueSpinner} aria-hidden="true" /> : <Download size={18} aria-hidden="true" />}
      {status === "loading" ? "Downloading…" : "Download PDF"}
    </button>
    <p className={styles.catalogueFeedback} role="status" aria-live="polite">
      {status === "loading" ? "Preparing your download…" : status === "started" ? "Download started." : status === "error" ? <>
        Unable to download. <a href={href} target="_blank" rel="noreferrer">Open PDF in a new tab</a> or try again.
      </> : null}
    </p>
  </div>;
}

export function AboutBusiness({ description, offerings, snapshot, companyDetails, sustainability }: {
  description?: string | null;
  offerings: ReactNode;
  snapshot: ReactNode;
  companyDetails: ReactNode;
  sustainability: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const [descriptionOverflows, setDescriptionOverflows] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const descriptionViewport = useRef<HTMLDivElement>(null);
  const extrasRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const animations = useRef<Animation[]>([]);
  const transitionStart = useRef<{ description: number; extras: number; margin: number } | null>(null);
  const transitionGeneration = useRef(0);
  const contentId = useId();
  const hasAdditionalContent = Boolean(offerings || snapshot || sustainability);

  useEffect(() => {
    const paragraph = descriptionRef.current;
    if (!paragraph) return;
    let active = true;
    const measure = () => {
      if (!active) return;
      const lineHeight = parseFloat(getComputedStyle(paragraph).lineHeight);
      setDescriptionOverflows(paragraph.scrollHeight > lineHeight * 3 + 1);
    };
    measure();
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    resize?.observe(paragraph);
    window.addEventListener("resize", measure);
    void document.fonts.ready.then(measure);
    return () => {
      active = false;
      resize?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [description]);

  useLayoutEffect(() => {
    const start = transitionStart.current;
    if (!start) return;
    transitionStart.current = null;
    const generation = transitionGeneration.current;
    const viewport = descriptionViewport.current;
    const paragraph = descriptionRef.current;
    const extras = extrasRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const running: Animation[] = [];

    const finish = () => {
      if (generation !== transitionGeneration.current) return;
      if (extras) extras.hidden = !expanded;
      running.forEach(animation => animation.cancel());
      animations.current = [];
      if (expanded) return;
      const toggle = toggleRef.current;
      if (!toggle) return;
      const bounds = toggle.getBoundingClientRect();
      if (bounds.top < 0 || bounds.bottom > window.innerHeight) {
        toggle.scrollIntoView({ block: "nearest", behavior: reducedMotion ? "instant" : "smooth" });
      }
    };

    // Keep closing content measurable until its animation completes. It is
    // already inert and hidden from assistive technology in the compact state.
    if (extras) extras.hidden = false;
    const timing: KeyframeAnimationOptions = { duration: 250, easing: "cubic-bezier(.4,0,.2,1)", fill: "both" };
    if (!reducedMotion && viewport?.animate && paragraph) {
      const fullHeight = paragraph.getBoundingClientRect().height;
      const compactHeight = parseFloat(getComputedStyle(paragraph).lineHeight) * 3;
      running.push(viewport.animate([
        { maxHeight: `${start.description}px` },
        { maxHeight: `${expanded ? fullHeight : Math.min(fullHeight, compactHeight)}px` },
      ], timing));
    }
    if (!reducedMotion && extras?.animate) {
      const fullHeight = extras.getBoundingClientRect().height;
      const margin = parseFloat(getComputedStyle(extras).marginTop) || 0;
      running.push(extras.animate([
        { height: `${start.extras}px`, marginTop: `${start.margin}px` },
        { height: `${expanded ? fullHeight : 0}px`, marginTop: `${expanded ? margin : 0}px` },
      ], timing));
    }
    animations.current = running;
    if (running.length) void Promise.all(running.map(animation => animation.finished)).then(finish, () => {});
    else finish();
    return () => running.forEach(animation => animation.cancel());
  }, [expanded]);

  return <section id="overview" className={`${styles.panel} ${styles.aboutPanel}`} aria-labelledby="overview-title">
    <div className={`${styles.iconHeading} ${styles.aboutHeading}`}>
      <span className={styles.iconTile}><Building2 size={17} aria-hidden="true" /></span>
      <h2 id="overview-title">About the business</h2>
    </div>
    <div id={contentId} className={styles.aboutContent}>
      {description && <div ref={descriptionViewport} className={styles.aboutDescriptionViewport} data-compact={!expanded}>
        <p ref={descriptionRef} className={`${styles.prose} ${styles.aboutDescription}`}>{description}</p>
      </div>}
      {companyDetails}
      {hasAdditionalContent && <div ref={extrasRef} className={styles.aboutExtras}
        hidden={!expanded} inert={!expanded} aria-hidden={!expanded}>
        {offerings}{snapshot}{sustainability}
      </div>}
    </div>
    {(expanded || Boolean(description && descriptionOverflows) || hasAdditionalContent) && <button ref={toggleRef} type="button"
      className={styles.aboutToggle} aria-expanded={expanded} aria-controls={contentId}
      onClick={() => {
        const extras = extrasRef.current;
        transitionStart.current = {
          description: descriptionViewport.current?.getBoundingClientRect().height ?? 0,
          extras: extras?.getBoundingClientRect().height ?? 0,
          margin: extras && !extras.hidden ? parseFloat(getComputedStyle(extras).marginTop) || 0 : 0,
        };
        transitionGeneration.current += 1;
        animations.current.forEach(animation => animation.cancel());
        setExpanded(!expanded);
      }}>
      {expanded ? "View less" : "View more"}
      <ChevronDown size={16} aria-hidden="true" />
    </button>}
  </section>;
}

export function ProfileNavigation({ sections }: { sections: { id: string; title: string }[] }) {
  const nav = useRef<HTMLElement>(null);
  const [current, setCurrent] = useState("overview");

  useEffect(() => {
    const bar = nav.current;
    const shell = bar?.closest<HTMLElement>("#rich-profile");
    if (!bar || !shell) return;
    const header = document.querySelector<HTMLElement>("nav.nav");
    const sidebar = shell.querySelector(`.${styles.sidebar}`);
    const pinnedRail = window.matchMedia("(min-width: 851px)");
    const links = [...bar.querySelectorAll<HTMLAnchorElement>("a")];
    const targetIds = [...links.map(link => link.hash.slice(1)), "quote"];
    const targets = targetIds.map(id => document.getElementById(id)).filter((item): item is HTMLElement => Boolean(item));
    const headerTransitions = new Set<string>();
    let frame = 0;
    let selectedSide: HTMLElement | null = null;

    const syncHeaderOffset = () => {
      const bounds = header?.getBoundingClientRect();
      const visibleHeight = bounds ? Math.ceil(Math.max(0, Math.min(bounds.bottom, bounds.height))) : 0;
      const offset = `${visibleHeight}px`;
      if (shell.style.getPropertyValue("--header-visible-height") !== offset) {
        shell.style.setProperty("--header-visible-height", offset);
      }
      return visibleHeight;
    };
    const update = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        syncHeaderOffset();
        if (headerTransitions.size) update();

        const edge = bar.getBoundingClientRect().bottom + 24;
        if (selectedSide && sidebar && sidebar.getBoundingClientRect().top <= edge + 20) {
          setCurrent(selectedSide.id);
          return;
        }
        // The pinned desktop rail is independent of the document reading order.
        const active = targets.filter(target => !pinnedRail.matches || !sidebar?.contains(target))
          .filter(target => target.getBoundingClientRect().top <= edge)
          .sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top);
        setCurrent(active[0]?.id || "overview");
      });
    };
    const measure = () => {
      shell.style.setProperty("--nav-height", `${bar.offsetHeight}px`);
      update();
    };
    const onHeaderTransition = (event: TransitionEvent) => {
      if (event.target !== header || !["translate", "transform"].includes(event.propertyName)) return;
      if (event.type === "transitionrun") headerTransitions.add(event.propertyName);
      else headerTransitions.delete(event.propertyName);
      update();
    };
    const follow = (hash: string) => {
      const target = targets.find(item => `#${item.id}` === hash);
      if (!target) return;
      const visibleHeight = syncHeaderOffset();
      selectedSide = sidebar?.contains(target) ? target : null;
      if (!target.hasAttribute("tabindex")) target.tabIndex = -1;
      target.focus({ preventScroll: true });
      if (selectedSide && pinnedRail.matches) {
        target.scrollIntoView({ block: "start", behavior: "instant" });
      } else {
        const margin = parseFloat(getComputedStyle(target).scrollMarginTop);
        const distance = target.getBoundingClientRect().top - margin;
        // The marketplace header will return when the document scrolls up.
        const headerOffset = distance < 0 ? (header?.offsetHeight ?? 0) : 0;
        if (distance) window.scrollBy({ top: distance + visibleHeight - headerOffset, behavior: "instant" });
      }
      setCurrent(target.id);
    };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
          !(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[href^='#']");
      if (!link || !targets.some(target => link.hash === `#${target.id}`)) return;
      event.preventDefault();
      if (location.hash !== link.hash) history.pushState(null, "", link.hash);
      follow(link.hash);
    };
    const onHash = () => follow(location.hash);
    const onScroll = () => {
      if (selectedSide && document.activeElement !== selectedSide) selectedSide = null;
      update();
    };
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    const headerClassObserver = header ? new MutationObserver(update) : null;
    if (header) headerClassObserver?.observe(header, { attributeFilter: ["class"] });
    const transitionEvents = ["transitionrun", "transitionend", "transitioncancel"] as const;
    for (const event of transitionEvents) header?.addEventListener(event, onHeaderTransition);
    resize?.observe(bar);
    if (header) resize?.observe(header);
    measure();
    onHash();
    shell.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHash);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      resize?.disconnect();
      headerClassObserver?.disconnect();
      for (const event of transitionEvents) header?.removeEventListener(event, onHeaderTransition);
      cancelAnimationFrame(frame);
      shell.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    const strip = nav.current?.querySelector(`.${styles.sectionLinks}`);
    const active = strip?.querySelector("[aria-current]");
    if (!strip || !active) return;
    const bounds = strip.getBoundingClientRect();
    const item = active.getBoundingClientRect();
    if (item.left < bounds.left) strip.scrollLeft += item.left - bounds.left;
    if (item.right > bounds.right) strip.scrollLeft += item.right - bounds.right;
  }, [current]);

  return (
    <nav ref={nav} className={styles.sectionNav} aria-label="Profile sections">
      <div className={styles.sectionLinks}>
        {sections.map(({ id, title }) => {
          const Icon = sectionIcons[title as keyof typeof sectionIcons];
          return <a key={id} href={`#${id}`} aria-current={current === id ? "location" : undefined}>{Icon && <Icon size={15} aria-hidden="true" />}{title}</a>;
        })}
      </div>
    </nav>
  );
}

export function ShareProfile({ name, href }: { name: string; href: string }) {
  const [message, setMessage] = useState("");
  const [showLink, setShowLink] = useState(false);

  async function share() {
    const url = new URL(href, window.location.origin).href;
    setShowLink(false);
    try {
      if (navigator.share) {
        await navigator.share({ title: name, url });
      } else {
        await navigator.clipboard.writeText(url);
        setMessage("Profile link copied.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShowLink(true);
      setMessage("Copy the profile link below.");
    }
  }

  return <div className={styles.share}>
    <button className={`${styles.button} ${styles.iconOnly}`} aria-label="Share vendor profile" title="Share vendor profile" type="button" onClick={() => void share()}><Share2 size={17} aria-hidden="true" /></button>
    {message && <div className={styles.shareMessage}>
      <p role="status">{message}</p>
      {showLink && <label><Copy size={16} aria-hidden="true" /> Profile link<input readOnly value={new URL(href, window.location.origin).href} onFocus={event => event.target.select()} /></label>}
    </div>}
  </div>;
}

function ListingCards({ items }: { items: PublicProduct[] }) {
  return <div className={styles.productGrid}>
    {items.map(item => {
      const image = safeWebUrl(item.images[0]);
      const price = item.priceType === "Price on Request" || item.price == null
        ? "Price on request"
        : `${item.priceType === "Starts From" ? "From " : ""}${item.currency} ${item.price.toLocaleString("en-IN")}`;
      return <Link key={item.id} className={styles.listingCard} href={productHref(item.id, item.title)}>
        {image && <img src={image} alt="" loading="lazy" />}
        <div className={styles.listingCopy}>
          <strong>{item.title}</strong>
          {item.categoryName && <span>{item.categoryName}</span>}
          {item.description && <span className={styles.listingDescription}>{item.description}</span>}
          <span className={styles.listingPrice}>{price}</span>
        </div>
      </Link>;
    })}
  </div>;
}

export function CatalogGrid({ vendorId, kind, initial }: {
  vendorId: string; kind: "Product" | "Service"; initial: { items: PublicProduct[]; total: number; page: number };
}) {
  const [data, setData] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isProduct = kind === "Product";
  const heading = isProduct ? "Featured products" : "Services";
  const sectionId = isProduct ? "products" : "services";
  const label = isProduct ? "Products" : "Services";
  const pages = Math.ceil(data.total / 12);
  const dialog = useRef<HTMLDialogElement>(null);
  const results = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  async function loadPage(page: number) {
    setBusy(true);
    setError("");
    try {
      const params = new URLSearchParams({ type: kind, page: String(page) });
      const response = await fetch(`/api/rich-vendor-catalog/${vendorId}?${params}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load this page.");
      setData(await response.json());
      results.current?.focus({ preventScroll: true });
      dialog.current?.scrollTo({ top: 0 });
    } catch {
      setError("Could not load more listings. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <section id={sectionId} className={styles.panel} aria-label={label}>
    <div className={styles.sectionHeading}>
      <h2>{heading}</h2>
      {initial.total > 4 && <button ref={trigger} className={styles.textButton} type="button" onClick={() => dialog.current?.showModal()}>
        View all {sectionId}
      </button>}
    </div>
    <ListingCards items={initial.items.slice(0, 4)} />
    <dialog ref={dialog} className={styles.dialog} aria-labelledby={`${sectionId}-dialog-title`} onClose={() => trigger.current?.focus()}>
      <div className={styles.sectionHeading}>
        <h2 id={`${sectionId}-dialog-title`}>{label}</h2>
        <button className={styles.button} type="button" onClick={() => dialog.current?.close()}>Close</button>
      </div>
      <div className={styles.catalogResults} ref={results} tabIndex={-1} aria-busy={busy}>
        <p aria-live="polite">{data.total} {data.total === 1 ? "listing" : "listings"}{pages > 1 ? ` · Page ${data.page} of ${pages}` : ""}</p>
        <ListingCards items={data.items} />
      </div>
      {pages > 1 && <nav className={styles.controls} aria-label={`${label} pagination`}>
        <button className={styles.button} type="button" disabled={busy || data.page <= 1} onClick={() => void loadPage(data.page - 1)}>Previous</button>
        <button className={styles.button} type="button" disabled={busy || data.page >= pages} onClick={() => void loadPage(data.page + 1)}>Next</button>
      </nav>}
      {error && <p role="alert">{error}</p>}
    </dialog>
  </section>;
}

export function CredentialCarousel({ count, heading, children }: { count: number; heading: ReactNode; children: ReactNode }) {
  const track = useRef<HTMLUListElement>(null);
  const previousArrow = useRef<HTMLButtonElement>(null);
  const nextArrow = useRef<HTMLButtonElement>(null);
  const destination = useRef<number | null>(null);
  const [edges, setEdges] = useState({ previous: false, next: false });
  const canScroll = edges.previous || edges.next;

  useEffect(() => {
    const row = track.current;
    if (!row) return;

    const update = () => {
      if (destination.current !== null && Math.abs(row.scrollLeft - destination.current) <= 1) {
        destination.current = null;
      }
      const previous = row.scrollLeft > 1;
      const next = row.scrollLeft + row.clientWidth < row.scrollWidth - 1;
      const focused = row.ownerDocument.activeElement;
      if (focused && ((!previous && focused === previousArrow.current) || (!next && focused === nextArrow.current))) {
        const remainingArrow = previous ? previousArrow.current : next ? nextArrow.current : null;
        (remainingArrow && !remainingArrow.disabled ? remainingArrow : row).focus({ preventScroll: true });
      }
      setEdges(current => current.previous === previous && current.next === next ? current : { previous, next });
    };
    const clearDestination = () => { destination.current = null; };
    const resize = () => { clearDestination(); update(); };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    observer?.observe(row);
    row.addEventListener("scroll", update, { passive: true });
    row.addEventListener("scrollend", clearDestination);
    window.addEventListener("resize", resize);
    resize();

    return () => {
      observer?.disconnect();
      row.removeEventListener("scroll", update);
      row.removeEventListener("scrollend", clearDestination);
      window.removeEventListener("resize", resize);
    };
  }, [count]);

  function move(direction: "previous" | "next") {
    const row = track.current;
    if (!row || !edges[direction]) return;
    const cards = Array.from(row.children);
    const origin = cards[0]?.getBoundingClientRect().left ?? 0;
    const offsets = cards.map(card => card.getBoundingClientRect().left - origin);
    const from = destination.current ?? row.scrollLeft;
    const max = row.scrollWidth - row.clientWidth;
    const left = direction === "next"
      ? Math.min(offsets.find(offset => offset > from + 1) ?? max, max)
      : offsets.reverse().find(offset => offset < from - 1) ?? 0;
    if (Math.abs(left - from) <= 1) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    destination.current = reducedMotion ? null : left;
    row.scrollTo({ left, behavior: reducedMotion ? "instant" : "smooth" });
  }

  return <div className={styles.credentialCarousel}>
    <div className={styles.credentialHeading}>
      {heading}
      {canScroll && <div className={styles.credentialControls}>
        <button ref={previousArrow} type="button" className={`${styles.credentialArrow} ${styles.credentialPrevious}`}
          disabled={!edges.previous} aria-hidden={!edges.previous}
          aria-label="Previous card" aria-controls="credential-cards" onClick={() => move("previous")}>
          <ChevronLeft size={19} aria-hidden="true" />
        </button>
        <button ref={nextArrow} type="button" className={`${styles.credentialArrow} ${styles.credentialNext}`}
          disabled={!edges.next} aria-hidden={!edges.next}
          aria-label="Next card" aria-controls="credential-cards" onClick={() => move("next")}>
          <ChevronRight size={19} aria-hidden="true" />
        </button>
      </div>}
    </div>
    <ul id="credential-cards" ref={track} className={styles.credentialTrack} role="list"
      aria-label="Certification and document cards" tabIndex={canScroll ? 0 : undefined}>
      {children}
    </ul>
  </div>;
}

export function Gallery({ images }: { images: { id: string; title: string; url: string }[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const previousArrow = useRef<HTMLButtonElement>(null);
  const nextArrow = useRef<HTMLButtonElement>(null);
  const [edges, setEdges] = useState({ previous: false, next: false });
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const row = track.current;
    if (!row) return;
    const update = () => {
      const previous = row.scrollLeft > 1;
      const next = row.scrollLeft + row.clientWidth < row.scrollWidth - 1;
      if ((!previous && document.activeElement === previousArrow.current) || (!next && document.activeElement === nextArrow.current)) {
        row.focus({ preventScroll: true });
      }
      setEdges(current => current.previous === previous && current.next === next ? current : { previous, next });
    };
    const observer = new ResizeObserver(update);
    observer.observe(row);
    row.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      observer.disconnect();
      row.removeEventListener("scroll", update);
    };
  }, [images.length]);

  function scrollGallery(direction: number) {
    const row = track.current;
    if (!row) return;
    row.scrollBy({
      left: direction * row.clientWidth * .8,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  const index = images.length ? selected % images.length : 0;
  const current = images[index];
  if (!current) return null;
  const move = (step: number) => setSelected(index => (index + step + images.length) % images.length);
  function open(index: number, button: HTMLButtonElement) {
    trigger.current = button;
    setSelected(index);
    dialog.current?.showModal();
  }
  return <section className={`${styles.panel} ${styles.galleryPanel}`} id="gallery" aria-labelledby="gallery-title">
    <div className={`${styles.sectionHeading} ${styles.galleryHeading}`}>
      <div className={styles.iconHeading}>
        <span className={styles.iconTile}><ImageIcon size={17} aria-hidden="true" /></span><h2 id="gallery-title">Gallery</h2>
      </div>
      <button className={`${styles.button} ${styles.galleryViewAll}`} type="button" aria-haspopup="dialog" onClick={event => open(0, event.currentTarget)}>
        View All<ArrowUpRight size={15} aria-hidden="true" />
      </button>
    </div>
    <div className={styles.galleryCarousel}>
      <div ref={track} id="gallery-photos" className={styles.gallery} role="group" aria-label="Gallery photos" tabIndex={0}>
        {images.map((image, index) => <button key={image.id} type="button" aria-haspopup="dialog" onClick={event => open(index, event.currentTarget)} aria-label={`Open ${image.title}`}>
          <img src={image.url} alt={image.title} loading="lazy" />
          <span className={styles.galleryCaption}>{image.title}</span>
        </button>)}
      </div>
      <button ref={previousArrow} type="button" className={`${styles.galleryBrowseArrow} ${styles.galleryPrevious}`} disabled={!edges.previous}
        aria-label="Previous photos" aria-controls="gallery-photos" onClick={() => scrollGallery(-1)}><ChevronLeft size={24} aria-hidden="true" /></button>
      <button ref={nextArrow} type="button" className={`${styles.galleryBrowseArrow} ${styles.galleryNext}`} disabled={!edges.next}
        aria-label="Next photos" aria-controls="gallery-photos" onClick={() => scrollGallery(1)}><ChevronRight size={24} aria-hidden="true" /></button>
    </div>
    <dialog ref={dialog} className={`${styles.dialog} ${styles.galleryDialog}`} aria-labelledby="rich-gallery-title" onClose={() => trigger.current?.focus({ preventScroll: true })} onKeyDown={event => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        move(event.key === "ArrowLeft" ? -1 : 1);
      }
    }}>
      <div className={styles.galleryViewerHeader}>
        <h2 id="rich-gallery-title">Gallery</h2>
        <button type="button" className={styles.galleryClose} aria-label="Close gallery" onClick={() => dialog.current?.close()}><X size={20} aria-hidden="true" /></button>
      </div>
      <div className={styles.galleryCanvas}>
        <img className={styles.galleryFull} src={current.url} alt={current.title} />
        {images.length > 1 && <>
          <button type="button" className={`${styles.galleryArrow} ${styles.galleryPrevious}`} aria-label="Previous photo" onClick={() => move(-1)}><ChevronLeft size={22} aria-hidden="true" /></button>
          <button type="button" className={`${styles.galleryArrow} ${styles.galleryNext}`} aria-label="Next photo" onClick={() => move(1)}><ChevronRight size={22} aria-hidden="true" /></button>
        </>}
      </div>
      <div className={styles.galleryViewerCaption} aria-live="polite" aria-atomic="true">
        <strong>{current.title}</strong><span>{index + 1} / {images.length}</span>
      </div>
    </dialog>
  </section>;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return reduced;
}

export function BannerAds({ ads }: { ads: Ad[] }) {
  const [selected, setSelected] = useState(0);
  const [artworkHovered, setArtworkHovered] = useState(false);
  const [keyboardFocused, setKeyboardFocused] = useState(false);
  const reduced = useReducedMotion();
  const multiple = ads.length > 1;
  const rotating = multiple && !reduced && !artworkHovered && !keyboardFocused;
  useEffect(() => {
    if (!rotating) return;
    const interval = window.setInterval(() => {
      if (!document.hidden) setSelected((selected + 1) % ads.length);
    }, 6000);
    return () => window.clearInterval(interval);
  }, [ads.length, rotating, selected]);

  if (!ads.length) return null;
  const index = selected % ads.length;

  function step(value: number) {
    setSelected(current => (current + value + ads.length) % ads.length);
  }

  return <div className={`${styles.cover} ${styles.heroBanner}`} role="region" aria-label="Banner advertisements" data-multiple={multiple}
    onPointerDownCapture={() => setKeyboardFocused(false)}
    onFocusCapture={event => setKeyboardFocused(event.target.matches(":focus-visible"))}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setKeyboardFocused(false); }}>
    <div className={styles.bannerFrame} aria-live={rotating ? "off" : "polite"}
      onMouseEnter={() => setArtworkHovered(true)} onMouseLeave={() => setArtworkHovered(false)}>
      {ads.map((ad, position) => {
        const active = index === position;
        const poster = <img src={ad.url} alt={ad.title} loading={active ? "eager" : "lazy"}
          fetchPriority={position === 0 ? "high" : "low"} />;

        return <div key={ad.id} className={styles.bannerSlide} data-active={active} inert={!active} aria-hidden={!active}>
          {ad.linkUrl ? <a href={ad.linkUrl} target="_blank" rel="sponsored noopener noreferrer">{poster}</a> : poster}
        </div>;
      })}
    </div>
    {multiple && <>
      <button className={`${styles.bannerArrow} ${styles.bannerPrevious}`} type="button" aria-label="Previous banner" onClick={() => step(-1)}>
        <ChevronLeft size={21} aria-hidden="true" />
      </button>
      <button className={`${styles.bannerArrow} ${styles.bannerNext}`} type="button" aria-label="Next banner" onClick={() => step(1)}>
        <ChevronRight size={21} aria-hidden="true" />
      </button>
      <div className={styles.bannerDots} role="group" aria-label="Choose a banner">
        {ads.map((slide, position) => (
          <button key={slide.id} className={styles.bannerDot} type="button" aria-label={`Show banner ${position + 1}`}
            aria-current={index === position ? true : undefined} onClick={() => setSelected(position)} />
        ))}
      </div>
    </>}
  </div>;
}

function VideoStill({ url }: { url: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const media = ref.current;
    if (!media) return;
    let observer: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        observer?.disconnect();
        media.src = url;
      }, { rootMargin: "160px" });
      observer.observe(media);
    } else {
      media.src = url;
    }
    return () => {
      observer?.disconnect();
      if (media.hasAttribute("src")) {
        media.removeAttribute("src");
        media.load();
      }
    };
  }, [url]);

  return <video ref={ref} muted playsInline preload="metadata" data-ready={ready} onLoadedMetadata={event => {
    const media = event.currentTarget;
    if (Number.isFinite(media.duration) && media.duration > 0) {
      media.currentTime = Math.min(1, media.duration * 0.1);
    }
  }} onLoadedData={event => {
    if (!event.currentTarget.seeking) setReady(true);
  }} onSeeked={event => {
    if (event.currentTarget.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) setReady(true);
  }} onError={() => setReady(false)} />;
}

function VideoThumbnail({ video, category }: { video?: Video; category?: string }) {
  const thumbnailUrl = video?.thumbnailUrl;
  return <span className={styles.videoThumbnail} aria-hidden="true">
    {thumbnailUrl
      ? <img key={thumbnailUrl} src={thumbnailUrl} alt="" loading="lazy" onError={event => { event.currentTarget.hidden = true; }} />
      : video && !video.embedded && <VideoStill key={video.url} url={video.url} />}
    {category && <span className={styles.videoCategory}>{category}</span>}
    <span className={styles.playIcon}><Play size={19} fill="currentColor" /></span>
  </span>;
}

function VideoPlayer({ video, auto = false, start = false, muted = false, focusOnStart = true }: {
  video: Video; auto?: boolean; start?: boolean; muted?: boolean; focusOnStart?: boolean;
}) {
  const [playing, setPlaying] = useState(start);
  const ref = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLVideoElement>(null);
  const embed = useRef<HTMLIFrameElement>(null);
  const focusAfterPlay = useRef(start && focusOnStart);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!auto || reduced || !ref.current || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio >= 0.45) {
        setPlaying(true);
        observer.disconnect();
      }
    }, { threshold: 0.45 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [auto, reduced]);

  useEffect(() => {
    if (!playing) return;
    if (player.current) void player.current.play().catch(() => {});
    if (focusAfterPlay.current) {
      (embed.current ?? player.current)?.focus({ preventScroll: true });
      focusAfterPlay.current = false;
    }
  }, [playing]);

  if (!playing) {
    return <div ref={ref} className={styles.videoFrame}>
      <button type="button" className={styles.videoPlay} aria-label={`Play ${video.title}`} onClick={() => {
        focusAfterPlay.current = true;
        setPlaying(true);
      }}>
        <VideoThumbnail />
        <strong>{video.title}</strong>
      </button>
    </div>;
  }
  if (video.embedded) {
    const url = new URL(video.url);
    url.searchParams.set("autoplay", "1");
    if (muted) url.searchParams.set(url.hostname.includes("vimeo") ? "muted" : "mute", "1");
    url.searchParams.set("playsinline", "1");
    return <div ref={ref} className={styles.videoFrame}>
      <iframe ref={embed} title={video.title} src={url.href} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
    </div>;
  }
  return <div ref={ref} className={styles.videoFrame}>
    <video ref={player} aria-label={video.title} src={video.url} controls muted={muted} playsInline preload="none" />
  </div>;
}

export function PromotionalVideos({ videos }: { videos: Ad[] }) {
  const [selected, setSelected] = useState(0);
  const [started, setStarted] = useState(false);
  const video = videos[selected];
  if (!video) return null;
  return <section className={`${styles.panel} ${styles.ads}`} id="promotional-videos" aria-labelledby="promotional-videos-title">
    <div className={`${styles.sectionHeading} ${styles.promoHeading}`}>
      <div className={styles.iconHeading}>
        <span className={styles.iconTile}><Megaphone size={17} aria-hidden="true" /></span>
        <h2 id="promotional-videos-title">Promotional videos</h2>
      </div>
      <p className={styles.adLabel}>Advertisement</p>
    </div>
    <VideoPlayer key={video.id} video={video} auto={!started} start={started} muted />
    {(video.linkUrl || videos.length > 1) && <div className={styles.promoFooter}>
      {videos.length > 1 && <div className={styles.promoSelectors} role="group" aria-label="Select a video">
        {videos.map((entry, index) => <button className={styles.promoSelector} key={entry.id} type="button" aria-pressed={selected === index}
          onClick={() => { setSelected(index); setStarted(true); }}>
          {entry.title}
        </button>)}
      </div>}
      {video.linkUrl && <a className={styles.promoAdvertiserLink} href={video.linkUrl} rel="sponsored noopener noreferrer" target="_blank">
        Open advertiser link<ArrowUpRight size={15} aria-hidden="true" />
      </a>}
    </div>}
  </section>;
}

export function ProfileVideos({ introduction, products }: { introduction: Video[]; products: Video[] }) {
  const [selected, setSelected] = useState<Video | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (selected && !dialog.current?.open) dialog.current?.showModal();
  }, [selected]);

  const groups = [
    { id: "company-introduction", title: "Company introduction", videos: introduction },
    { id: "product-videos", title: "Product videos", videos: products },
  ].filter(group => group.videos.length);
  if (!groups.length) return null;

  function open(video: Video, button: HTMLButtonElement) {
    trigger.current = button;
    setSelected(video);
  }

  return <section className={`${styles.panel} ${styles.profileVideos}`} id="videos" aria-labelledby="videos-title">
    <div className={styles.iconHeading}>
      <span className={styles.iconTile}><VideoIcon size={17} aria-hidden="true" /></span>
      <h2 id="videos-title">Videos</h2>
    </div>
    <div className={styles.profileVideoGrid}>
      {groups.flatMap(group => group.videos.map(video => <button key={video.id} className={styles.videoCard} type="button" aria-haspopup="dialog"
        aria-label={`Play ${video.title} — ${group.title}`} onClick={event => open(video, event.currentTarget)}>
        <VideoThumbnail video={video} category={group.title} />
        <span className={styles.videoCardCopy}>
          <span className={styles.videoCardTitle}>{video.title}</span>
        </span>
      </button>))}
    </div>
    <dialog ref={dialog} className={`${styles.dialog} ${styles.videoDialog}`} aria-labelledby="profile-video-title" onClose={event => {
      event.currentTarget.querySelector("video")?.pause();
      setSelected(null);
      trigger.current?.focus({ preventScroll: true });
    }}>
      <div className={styles.sectionHeading}>
        <h2 id="profile-video-title">{selected?.title ?? "Video"}</h2>
        <button type="button" className={styles.button} onClick={() => dialog.current?.close()}>Close</button>
      </div>
      {selected && <VideoPlayer key={selected.id} video={selected} start focusOnStart={false} />}
    </dialog>
  </section>;
}

const newsDateFormat = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "UTC" });

function NewsDate({ date }: { date: string }) {
  return <time className={styles.newsDate} dateTime={date}>{newsDateFormat.format(new Date(`${date}T00:00:00Z`))}</time>;
}

export function LatestNews({ updates }: { updates: PublicNewsUpdate[] }) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<PublicNewsUpdate | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const panel = dialog.current;
    if (!selected || !panel || panel.open) return;
    panel.showModal();
    panel.scrollTop = 0;
  }, [selected]);

  if (!updates.length) return null;

  return <section className={styles.panel} id="latest-news" aria-labelledby="latest-news-title">
    <div className={`${styles.sectionHeading} ${styles.newsHeading}`}>
      <div className={styles.iconHeading}>
        <span className={styles.iconTile}><Newspaper size={17} aria-hidden="true" /></span>
        <h2 id="latest-news-title">Latest news &amp; updates</h2>
      </div>
      {updates.length > 3 && <button type="button" className={`${styles.textButton} ${styles.newsToggle}`}
        aria-expanded={expanded} aria-controls="news-update-list" onClick={() => setExpanded(!expanded)}>
        {expanded ? "Show latest updates" : "View all updates"} <ArrowRight size={15} aria-hidden="true" />
      </button>}
    </div>
    <ul id="news-update-list" className={styles.newsGrid} role="list">
      {(expanded ? updates : updates.slice(0, 3)).map(update => <li key={update.id}>
        <button type="button" className={styles.newsCard} aria-haspopup="dialog" aria-label={`Read ${update.headline}`}
          onClick={event => {
            trigger.current = event.currentTarget;
            setSelected(update);
          }}>
          {update.imageUrl && <img className={styles.newsCardImage} src={update.imageUrl} alt="" loading="lazy" decoding="async"
            onError={event => { event.currentTarget.hidden = true; }} />}
          <span className={styles.newsCardCopy}>
            <NewsDate date={update.date} />
            <strong>{update.headline}</strong>
            <span className={styles.newsPreview}>{update.body}</span>
          </span>
        </button>
      </li>)}
    </ul>
    <dialog ref={dialog} className={`${styles.dialog} ${styles.newsDialog}`} aria-labelledby="news-dialog-title" onClose={() => {
      setSelected(null);
      trigger.current?.focus({ preventScroll: true });
    }}>
      <div className={styles.sectionHeading}>
        <h2 id="news-dialog-title">{selected?.headline ?? "Update"}</h2>
        <button type="button" className={styles.button} onClick={() => dialog.current?.close()}>Close</button>
      </div>
      {selected && <>
        <NewsDate date={selected.date} />
        {selected.imageUrl && <img className={styles.newsDialogImage} src={selected.imageUrl} alt="" decoding="async"
          onError={event => { event.currentTarget.hidden = true; }} />}
        <p className={styles.newsText}>{selected.body}</p>
        {selected.sourceUrl && <a className={`${styles.button} ${styles.tint} ${styles.newsSource}`}
          href={selected.sourceUrl} target="_blank" rel="noreferrer">View source <ArrowUpRight size={15} aria-hidden="true" /></a>}
      </>}
    </dialog>
  </section>;
}

const jsonHeaders = (token: string) => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` });
const cleanInput = (entries: FormData, key: string) => String(entries.get(key) || "").trim();

export function QuoteForm({ id, name, href, categories }: { id: string; name: string; href: string; categories: string[] }) {
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const syncSession = () => {
      const session = getStoredSession();
      setAccountId(session?.accessToken ? session.user?.id ?? null : null);
    };
    const clearSession = () => setAccountId(null);
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea === window.localStorage) syncSession();
    };

    window.addEventListener(AUTH_SESSION_SAVED_EVENT, syncSession);
    window.addEventListener(AUTH_SESSION_CLEARED_EVENT, clearSession);
    window.addEventListener("storage", onStorage);
    queueMicrotask(() => { if (mounted) syncSession(); });

    return () => {
      mounted = false;
      window.removeEventListener(AUTH_SESSION_SAVED_EVENT, syncSession);
      window.removeEventListener(AUTH_SESSION_CLEARED_EVENT, clearSession);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return <section id="quote" aria-labelledby="quote-title" className={`${styles.panel} ${styles.quotePanel}`}>
    <div className={styles.panelTitle}>
      <span className={styles.iconTile}><FileText size={17} aria-hidden="true" /></span>
      <h2 id="quote-title">Request a quote <span>(RFQ)</span></h2>
    </div>
    {accountId
      ? <QuoteRequestForm key={accountId} id={id} name={name} categories={categories} onSessionEnded={() => setAccountId(null)} />
      : <>
        <p className={styles.sideIntro}>Share your requirements with {name} and receive a quote tailored to your needs.</p>
        <Link href={`/login?next=${encodeURIComponent(`${href}#quote`)}`} className={`${styles.button} ${styles.primary} ${styles.quoteSignIn}`}>Sign In</Link>
      </>}
  </section>;
}

function QuoteRequestForm({ id, name, categories, onSessionEnded }: {
  id: string;
  name: string;
  categories: string[];
  onSessionEnded: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [success, setSuccess] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setStatus("");
    setSuccess(false);
    setBusy(true);
    try {
      const session = await getValidSession();
      if (!session) {
        onSessionEnded();
        return;
      }
      const response = await fetch("/api/buyer/rfqs", {
        method: "POST",
        headers: jsonHeaders(session.accessToken),
        body: JSON.stringify({
          vendorId: id,
          requirementTitle: cleanInput(values, "title"),
          requirementType: cleanInput(values, "type"),
          category: cleanInput(values, "category"),
          deliveryCountry: cleanInput(values, "location"),
          estimatedQuantity: cleanInput(values, "quantity"),
          requiredTimeline: cleanInput(values, "timeline"),
          additionalDetails: cleanInput(values, "details"),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Your quote request could not be sent.");
      form.reset();
      setSuccess(true);
      setStatus("Quote request sent. You can follow it in your buyer dashboard.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Your quote request could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  return <>
    <p className={styles.sideIntro}>Tell {name} what your project needs.</p>
    <form className={styles.form} onSubmit={submit}>
      <label>What are you looking for?<input required name="title" maxLength={150} placeholder="Describe your requirement" /></label>
      <label>Requirement type<select name="type"><option value="PRODUCT">Product</option><option value="SERVICE">Service</option></select></label>
      {categories.length > 0 && <label>Category<select name="category"><option value="">Select a category</option>{categories.map(category => <option key={category}>{category}</option>)}</select></label>}
      <div className={styles.formRow}>
        <label>Project location<input required name="location" maxLength={120} placeholder="Enter city" /></label>
        <label>Size or capacity<input required name="quantity" maxLength={120} placeholder="e.g. 500 kW" /></label>
      </div>
      <label>Timeline<select required name="timeline" defaultValue=""><option value="">Select a timeline</option>
        <option>Within a week</option><option>Within a month</option><option>Within 3 months</option><option>Flexible</option>
      </select></label>
      <label>Project details<textarea name="details" rows={3} maxLength={4000} placeholder="Tell us about your requirement" /></label>
      <button className={`${styles.button} ${styles.primary}`} disabled={busy}><Send size={16} aria-hidden="true" /> {busy ? "Sending…" : "Submit request"}</button>
      {status && <p role={success ? "status" : "alert"}>{status}</p>}
    </form>
  </>;
}

export function ClaimBusiness({ id, href, requested }: { id: string; href: string; requested: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [login, setLogin] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const returnTo = encodeURIComponent(href);
  async function open() {
    setStatus("");
    setLogin(!(await getValidSession()));
    ref.current?.showModal();
  }
  async function claim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    const form = new FormData(event.currentTarget);
    try {
      const session = await getValidSession();
      if (!session) {
        setLogin(true);
        return;
      }
      const profile = await ensureCurrentProfile(session.accessToken);
      await submitVendorClaim({
        vendorId: id, profileId: profile.id, accessToken: session.accessToken,
        requesterName: cleanInput(form, "name"), requesterEmail: cleanInput(form, "email"),
        requesterPhone: cleanInput(form, "phone"), requesterDesignation: cleanInput(form, "role"),
        companyEmail: cleanInput(form, "companyEmail"), companyWebsite: cleanInput(form, "website"),
        proofType: cleanInput(form, "proofType"), proofDetails: cleanInput(form, "proof"), message: cleanInput(form, "message"),
      });
      ref.current?.close();
      setDone(true);
    } catch (error) {
      setStatus(error instanceof Error && /23505|duplicate key/i.test(error.message)
        ? "You already have a claim under review for this business." : "Could not submit this claim. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done || requested) return <span className={styles.badge} role="status">Claim under review</span>;
  return <>
    <button type="button" className={`${styles.button} ${styles.primary}`} aria-label="Claim this business" onClick={() => void open()}>
      <Building2 size={17} aria-hidden="true" />
      <span>Claim<span className={styles.claimLabelSuffix}> this business</span></span>
    </button>
    <dialog ref={ref} className={styles.dialog} aria-labelledby="rich-claim-title">
      <div className={styles.sectionHeading}><h2 id="rich-claim-title">Claim this business</h2>
        <button type="button" className={styles.button} onClick={() => ref.current?.close()}>Close</button></div>
      {login ? <div className={styles.form}><p>Sign in to submit an ownership claim for this business.</p>
        <div className={styles.controls}><Link href={`/login?next=${returnTo}`}>Sign in</Link><Link href={`/register?role=VENDOR&next=${returnTo}`}>Create vendor account</Link></div>
      </div> : <form className={styles.form} onSubmit={claim}>
        <label>Full name<input required name="name" maxLength={120} /></label>
        <label>Your email<input required type="email" name="email" /></label>
        <label>Phone<input type="tel" name="phone" /></label>
        <label>Your role<input name="role" maxLength={120} /></label>
        <label>Company email<input type="email" name="companyEmail" /></label>
        <label>Company website<input type="url" name="website" /></label>
        <label>Proof type<select name="proofType"><option>GST</option><option>CIN</option><option>UDYAM</option><option>Website Email</option><option>Other</option></select></label>
        <label>Proof details<input required name="proof" maxLength={250} /></label>
        <label>Additional information<textarea name="message" rows={3} maxLength={1000} /></label>
        <button className={`${styles.button} ${styles.primary}`} disabled={busy}>{busy ? "Submitting…" : "Submit claim"}</button>
        {status && <p role="alert">{status}</p>}
      </form>}
    </dialog>
  </>;
}
