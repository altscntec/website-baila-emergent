import { useEffect } from 'react';

const ORIGIN = 'https://bailadembow.com';

// Upsert a <meta> by name or property
const setMeta = (attr, key, content) => {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const ldData = (el) => {
  try {
    return JSON.parse(el.textContent || '{}');
  } catch {
    return {};
  }
};

// Which of the sitewide JSON-LD blocks in public/index.html belong on a page.
// Google ignores (or distrusts) structured data describing things the page
// doesn't show, so FAQs and event listings stay on the pages that render them.
//   - Organization + WebSite: every page
//   - homepage: everything
//   - /events: the event listings (MusicEvent + EventSeries)
//   - an event's own page (/halloween, /events/<slug>): only its MusicEvent,
//     matched on the event's canonical URL
//   - FAQPage: homepage only (/halloween brings its own via jsonLd)
const keepSitewide = (data, path) => {
  const type = data['@type'];
  if (type === 'Organization' || type === 'WebSite') return true;
  if (path === '/') return true;
  if (type === 'EventSeries') return path === '/events';
  if (type === 'MusicEvent') return path === '/events' || data.url === ORIGIN + path;
  if (type === 'FAQPage') return false;
  return true;
};

// Readable names for generated breadcrumbs (Home > <page>)
const CRUMB_NAMES = {
  '/events': 'Events',
  '/about': 'About',
  '/press': 'Press',
  '/terms': 'Terms & Conditions',
  '/latin-event-amsterdam': 'Latin Event Amsterdam',
  '/latin-event-rotterdam': 'Latin Event Rotterdam',
  '/experiences/live-tribute': 'Live Tribute Shows',
  '/experiences/casita': 'La Casita',
};
const breadcrumbFor = (path) =>
  CRUMB_NAMES[path] && {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: ORIGIN + '/' },
      { '@type': 'ListItem', position: 2, name: CRUMB_NAMES[path], item: ORIGIN + path },
    ],
  };

// Per-route document head: title, description, canonical, OG tags and
// optional page-specific JSON-LD. Runs client-side and is baked into the
// static snapshots by the prerender step, so crawlers see unique head tags
// per URL.
//
// `jsonLd` (object or array) is added as extra structured data for this route.
// If it contains a FAQPage, the sitewide FAQPage from index.html is swapped out
// for this route, since Google flags two FAQPage blocks on one page.
export const Seo = ({ title, description, path, image, imageWidth, imageHeight, jsonLd }) => {
  useEffect(() => {
    if (title) document.title = title;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', ORIGIN + (path || '/'));
    if (image) {
      const abs = image.startsWith('http') ? image : ORIGIN + image;
      setMeta('property', 'og:image', abs);
      setMeta('name', 'twitter:image', abs);
      // index.html declares the default card's size. A page that supplies its
      // own image (e.g. a raw portrait poster) must either state its real size
      // or drop the hint — a wrong width/height is worse than none.
      if (imageWidth && imageHeight) {
        setMeta('property', 'og:image:width', String(imageWidth));
        setMeta('property', 'og:image:height', String(imageHeight));
        setMeta('property', 'og:image:type', 'image/jpeg');
      } else {
        ['og:image:width', 'og:image:height', 'og:image:type'].forEach((k) => {
          document.head.querySelector(`meta[property="${k}"]`)?.remove();
        });
      }
    }
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', ORIGIN + (path || '/'));
  }, [title, description, path, image, imageWidth, imageHeight]);

  useEffect(() => {
    const route = path || '/';
    const own = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
    const crumb = !own.some((i) => i['@type'] === 'BreadcrumbList') && breadcrumbFor(route);
    const items = crumb ? [...own, crumb] : own;

    // Take out sitewide blocks that don't belong on this route (restored on
    // cleanup, so client-side navigation back to the homepage gets them back).
    // A route that brings its own FAQPage always replaces the sitewide one,
    // since Google flags two FAQPage blocks on one page.
    const bringsFaq = items.some((i) => i['@type'] === 'FAQPage');
    const removed = [];
    document.head
      .querySelectorAll('script[type="application/ld+json"]:not([data-seo-route])')
      .forEach((el) => {
        if (el.id) return; // page components' own blocks (e.g. #event-jsonld)
        const data = ldData(el);
        if (!keepSitewide(data, route) || (bringsFaq && data['@type'] === 'FAQPage')) {
          removed.push({ el, next: el.nextSibling });
          el.remove();
        }
      });

    const added = items.map((item) => {
      const el = document.createElement('script');
      el.type = 'application/ld+json';
      el.setAttribute('data-seo-route', 'true');
      el.textContent = JSON.stringify(item);
      document.head.appendChild(el);
      return el;
    });

    return () => {
      added.forEach((el) => el.remove());
      removed
        .reverse()
        .forEach(({ el, next }) => document.head.insertBefore(el, next && next.parentNode ? next : null));
    };
  }, [path, jsonLd]);

  return null;
};
