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

const ldType = (el) => {
  try {
    return JSON.parse(el.textContent || '{}')['@type'];
  } catch {
    return null;
  }
};

// Per-route document head: title, description, canonical, OG tags and
// optional page-specific JSON-LD. Runs client-side and is baked into the
// static snapshots by the prerender step, so crawlers see unique head tags
// per URL.
//
// `jsonLd` (object or array) is added as extra structured data for this route.
// If it contains a FAQPage, the sitewide FAQPage from index.html is swapped out
// for this route, since Google flags two FAQPage blocks on one page.
export const Seo = ({ title, description, path, image, jsonLd }) => {
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
  }, [title, description, path, image]);

  useEffect(() => {
    if (!jsonLd) return undefined;
    const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd];

    // Swap out the sitewide FAQPage when this route brings its own
    const removed = [];
    if (items.some((i) => i['@type'] === 'FAQPage')) {
      document.head
        .querySelectorAll('script[type="application/ld+json"]:not([data-seo-route])')
        .forEach((el) => {
          if (ldType(el) === 'FAQPage') {
            removed.push({ el, next: el.nextSibling });
            el.remove();
          }
        });
    }

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
      removed.forEach(({ el, next }) => document.head.insertBefore(el, next && next.parentNode ? next : null));
    };
  }, [jsonLd]);

  return null;
};
