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

// Per-route document head: title, description, canonical and OG tags.
// Runs client-side and is baked into the static snapshots by the
// prerender step, so crawlers see unique head tags per URL.
export const Seo = ({ title, description, path, image }) => {
  useEffect(() => {
    if (title) document.title = title;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', ORIGIN + (path || '/'));
    if (image) setMeta('property', 'og:image', image.startsWith('http') ? image : ORIGIN + image);
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

  return null;
};
