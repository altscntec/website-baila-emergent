import { useEffect, useRef, useState } from "react";
import "@/App.css";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";

// Context
import { CookieConsentProvider } from "./context/CookieConsentContext";

// Utils & Constants
import { EVENTS } from "./utils/constants";
import { getEventBySlug } from "./utils/helpers";
import { trackPageView, trackViewContent } from "./utils/tracking";

// Common Components
import { Navigation } from "./components/common/Navigation";
import { FloatingCTA } from "./components/common/FloatingCTA";
import { Seo } from "./components/common/Seo";

// Pages
import { HomePage } from "./components/pages/HomePage";
import { PressPage } from "./components/pages/PressPage";
import { AboutUsPage } from "./components/pages/AboutUsPage";
import { EventsPage } from "./components/pages/EventsPage";
import { SingleEventPage } from "./components/pages/SingleEventPage";
import { LatinEventAmsterdamPage, LatinEventRotterdamPage } from "./components/pages/SEOPages";
import { KingsdayWeekenderPage } from "./components/pages/KingsdayWeekenderPage";
import { PadelXReggaetonPage } from "./components/pages/PadelXReggaetonPage";
import { LiveShowExperiencePage, CasitaExperiencePage } from "./components/pages/ExperiencePages";
import { HalloweenPage } from "./components/pages/HalloweenPage";
import { TermsPage } from "./components/pages/TermsPage";

// ---------------------------------------------------------------------------
// Path-based routing (real URLs, crawlable + prerenderable).
// Legacy hash links (#/halloween, #events) redirect to their path equivalents.
// ---------------------------------------------------------------------------

const normalizePath = (p) => {
  let path = p || "/";
  if (!path.startsWith("/")) path = "/" + path;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path;
};

// Translate a legacy hash ("#/halloween", "#events", "#/?scrollTo=x") to a path+search
const legacyHashToUrl = (hash) => {
  const raw = hash.replace(/^#/, "");
  if (!raw || raw === "/") return null;
  // In-page anchors used by section scrolling (e.g. "#agenda") map to ids on
  // the current page — only treat known legacy ROUTE hashes as redirects.
  const routeHashes = ["events", "about", "press"];
  const [pathPart, query] = raw.split("?");
  if (raw.startsWith("/")) {
    return normalizePath(pathPart) + (query ? `?${query}` : "");
  }
  if (routeHashes.includes(pathPart)) return `/${pathPart}`;
  return null;
};

// Per-route head tags — unique title (<60 chars), description and canonical.
const routeSeo = (path, event) => {
  const seo = {
    "/": {
      title: "Latin Event Amsterdam | Reggaeton & Dembow – Baila Dembow",
      description:
        "Baila Dembow is the leading Latin event in Amsterdam and the Netherlands. Reggaeton, dembow, salsa and bachata parties — see upcoming dates and get tickets.",
    },
    "/events": {
      title: "Upcoming Latin Events & Parties | Baila Dembow",
      description:
        "All upcoming Baila Dembow events in the Netherlands: reggaeton and dembow nights in Amsterdam, Groningen and beyond. Dates, venues and tickets.",
    },
    "/halloween": {
      title: "Latin Halloween Festival Amsterdam | Baila Dembow",
      description:
        "The Latin Halloween Festival by Baila Dembow — Sat 31 October 2026 at IJLAND Amsterdam. Haunted club, two areas, costume cash prize, reggaeton and dembow till 05:00.",
    },
    "/about": {
      title: "About Baila Dembow | Latin Events Netherlands",
      description:
        "The story of Baila Dembow — the team bringing reggaeton, dembow and Latin culture to dancefloors across the Netherlands since 2023.",
    },
    "/press": {
      title: "Press & Media | Baila Dembow",
      description: "Press information, media assets and contact for Baila Dembow, the leading Latin event brand in the Netherlands.",
    },
    "/terms": {
      title: "Terms & Conditions | Baila Dembow",
      description: "Door policy, ticket terms, house rules and photo/video consent for Baila Dembow events.",
    },
    "/latin-event-amsterdam": {
      title: "Latin Event in Amsterdam | Baila Dembow",
      description:
        "Looking for a Latin event in Amsterdam? Baila Dembow hosts the city's biggest reggaeton and dembow parties. See upcoming Amsterdam dates and tickets.",
    },
    "/latin-event-rotterdam": {
      title: "Latin Event in Rotterdam | Baila Dembow",
      description:
        "Looking for a Latin event in Rotterdam? Baila Dembow brings reggaeton, dembow and Latin heat to Rotterdam. See upcoming dates and tickets.",
    },
    "/experiences/live-tribute": {
      title: "Live Tribute Shows | Baila Dembow",
      description:
        "Baila Dembow Live Tribute Shows — world-class musicians honouring Latin legends live on stage, followed by reggaeton and dembow until sunrise.",
    },
    "/experiences/casita": {
      title: "Casa de Baila Dembow — La Casita | Baila Dembow",
      description:
        "La Casita: the full-scale house that turns any venue into a Latin American street party, with archways, straw hats and the iconic Baila Dembow neon.",
    },
  };
  if (seo[path]) return { ...seo[path], path };
  if (event) {
    return {
      title: `${event.title} | Baila Dembow`.slice(0, 70),
      description: `${event.city} · ${event.venue} · ${event.date} · ${event.time}. ${event.tagline || "Reggaeton, dembow and Latin hits."} Tickets on sale now.`,
      path,
      image: event.image_url,
    };
  }
  return { ...seo["/"], path: "/" };
};

// Main App Component
function App() {
  const events = EVENTS;

  const getPath = () => normalizePath(window.location.pathname);
  const [currentPath, setCurrentPath] = useState(getPath);

  // Legacy hash redirect — run before first paint effects
  useEffect(() => {
    const target = legacyHashToUrl(window.location.hash);
    if (target) {
      window.history.replaceState(null, "", target);
      setCurrentPath(normalizePath(target.split("?")[0]));
    }
  }, []);

  // scrollTo support: /?scrollTo=agenda scrolls to the section after load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scrollToId = params.get("scrollTo");
    if (scrollToId) {
      setTimeout(() => {
        document.getElementById(scrollToId)?.scrollIntoView({ behavior: "smooth" });
        window.history.replaceState(null, "", window.location.pathname);
      }, 400);
    }
  }, [currentPath]);

  // SPA navigation: intercept same-origin link clicks + handle back/forward
  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest && e.target.closest("a");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      if (href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (!href.startsWith("/")) return;
      // Static files (e.g. /play.html) should load normally
      if (/\.[a-z0-9]+$/i.test(href.split("?")[0])) return;
      e.preventDefault();
      const [pathOnly, query] = href.split("?");
      window.history.pushState(null, "", href);
      setCurrentPath(normalizePath(pathOnly));
      if (!query || !query.includes("scrollTo=")) window.scrollTo(0, 0);
    };
    const onPop = () => setCurrentPath(getPath());
    document.addEventListener("click", onClick);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  const effectivePath = currentPath;

  const isEventPage = effectivePath.startsWith("/events/");
  const eventSlug = isEventPage ? effectivePath.replace(/^\/events\//, "") : null;
  const isKingsdayPage = eventSlug === "kingsday-weekender-2026";
  // Padel × Reggaeton — accept both CamelCase and kebab-case slug forms
  const isPadelPage = eventSlug === "PadelXReggaeton" || eventSlug === "padel-x-reggaeton";
  // Standalone branded landing pages hide the global Nav + FloatingCTA chrome
  const isStandalonePage = isKingsdayPage || isPadelPage;

  const currentEvent = isEventPage && !isStandalonePage && eventSlug ? getEventBySlug(eventSlug, events) : null;
  const seoMeta = routeSeo(effectivePath, currentEvent);

  // Point the floating "GET TICKETS" CTA at this event's real checkout link
  // when we're on a page dedicated to one event, instead of the generic Linktree.
  const floatingCtaEvent =
    currentEvent ||
    (effectivePath === "/halloween" || effectivePath === "/experiences/halloween"
      ? events.find((e) => e.landing_page === "/halloween")
      : null);

  // Record every page a visitor actually hits (not just the first one on a
  // hard load) so the Meta/TikTok pixels can build a retargeting audience out
  // of it — e.g. "people who viewed the Halloween page". loadMetaPixel /
  // loadTikTokPixel already send the first PageView for whichever page a
  // visitor lands on directly, so only re-fire that on later route changes;
  // ViewContent (ideal for retargeting a specific event page) is new, so it
  // fires on the first render too.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (!isFirstRender.current) trackPageView();
    isFirstRender.current = false;
    if (floatingCtaEvent) trackViewContent(floatingCtaEvent);
  }, [effectivePath]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <CookieConsentProvider>
      {/* Standalone legacy landing pages manage their own head tags */}
      {!isStandalonePage && <Seo {...seoMeta} />}
      <div className="grain-overlay" />
      {!isStandalonePage && <Navigation currentPath={effectivePath} />}
      <main>
        {effectivePath === "/press" ? (
          <PressPage />
        ) : effectivePath === "/terms" ? (
          <TermsPage />
        ) : effectivePath === "/latin-event-amsterdam" ? (
          <LatinEventAmsterdamPage events={events} />
        ) : effectivePath === "/latin-event-rotterdam" ? (
          <LatinEventRotterdamPage events={events} />
        ) : effectivePath === "/halloween" || effectivePath === "/experiences/halloween" ? (
          <HalloweenPage />
        ) : effectivePath === "/experiences/live-tribute" ? (
          <LiveShowExperiencePage />
        ) : effectivePath === "/experiences/casita" ? (
          <CasitaExperiencePage />
        ) : isKingsdayPage ? (
          <KingsdayWeekenderPage />
        ) : isPadelPage ? (
          <PadelXReggaetonPage />
        ) : isEventPage && eventSlug ? (
          <SingleEventPage eventSlug={eventSlug} events={events} />
        ) : effectivePath === "/events" ? (
          <EventsPage events={events} />
        ) : effectivePath === "/about" ? (
          <AboutUsPage />
        ) : (
          <HomePage events={events} />
        )}
      </main>
      {!isStandalonePage && (
        <FloatingCTA
          ticketUrl={floatingCtaEvent?.ticket_url}
          eventName={floatingCtaEvent?.title}
        />
      )}
      <Toaster position="top-center" richColors />
      <Analytics />
    </CookieConsentProvider>
  );
}

export default App;
