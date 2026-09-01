import { META_PIXEL_ID, TIKTOK_PIXEL_ID } from './constants';

// Build a Meta Advanced Matching object containing ONLY the fields we
// actually have a value for. Empty/blank fields are omitted entirely —
// sending empty strings (em: '', ph: '', ...) is what makes Meta flag the
// pixel as "advanced matching not set up". The pixel hashes these values
// with SHA-256 automatically, so we pass them lightly normalised (trimmed
// and lower-cased; phone reduced to digits) for the best match rate.
const buildAdvancedMatching = (userData = {}) => {
  const firstName = userData.firstName || userData.name?.split(' ')[0] || '';
  const lastName = userData.lastName || userData.name?.split(' ').slice(1).join(' ') || '';
  const candidates = {
    em: userData.email,
    ph: userData.phone ? String(userData.phone).replace(/[^0-9]/g, '') : '',
    fn: firstName,
    ln: lastName,
    ct: userData.city,
    country: userData.country,
  };
  const am = {};
  Object.entries(candidates).forEach(([key, value]) => {
    if (value && String(value).trim()) am[key] = String(value).trim().toLowerCase();
  });
  return am;
};

// Load Meta Pixel. Advanced matching data is only attached when we have it
// (e.g. after a form submission); a plain page-load init sends no PII.
export const loadMetaPixel = (userData = {}) => {
  if (window.fbq) return;

  !function(f,b,e,v,n,t,s) {
    if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)
  }(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');

  const am = buildAdvancedMatching(userData);
  if (Object.keys(am).length > 0) {
    window.fbq('init', META_PIXEL_ID, am);
  } else {
    window.fbq('init', META_PIXEL_ID);
  }
  window.fbq('track', 'PageView');
};

// Re-init the pixel with real Advanced Matching data after a form submission.
export const updateMetaPixelUserData = (userData) => {
  if (typeof window !== 'undefined' && window.fbq) {
    const am = buildAdvancedMatching(userData);
    if (Object.keys(am).length > 0) {
      window.fbq('init', META_PIXEL_ID, am);
    }
  }
};

// Load TikTok Pixel
export const loadTikTokPixel = () => {
  if (window.ttq && window.ttq._i && window.ttq._i[TIKTOK_PIXEL_ID]) return;
  
  !function (w, d, t) {
    w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
    ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
    ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
    for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
    ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
    ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
    ttq.load(TIKTOK_PIXEL_ID);
    ttq.page();
  }(window, document, 'ttq');
};

// Track events
export const trackEvent = (eventName, eventData = {}) => {
  // Meta Pixel tracking
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, eventData);
  }
  // TikTok Pixel tracking
  if (typeof window !== 'undefined' && window.ttq) {
    window.ttq.track(eventName, eventData);
  }
};

// Fire a PageView on client-side route changes. loadMetaPixel/loadTikTokPixel
// already send one on the initial hard page load; this covers in-app
// navigation (e.g. clicking through to /halloween from another page) so the
// pixel sees every route a visitor actually hits, not just the first one.
export const trackPageView = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'PageView');
  }
  if (typeof window !== 'undefined' && window.ttq) {
    window.ttq.page();
  }
};

// Fire when someone lands on a specific event's page. This is the standard
// Meta/TikTok signal for building a "people who viewed this event" retargeting
// audience (Meta Ads Manager: Custom Audience > Website > ViewContent, filtered
// by content_ids) — more reliable in an SPA than a URL-contains rule alone.
export const trackViewContent = (event) => {
  if (!event) return;
  trackEvent('ViewContent', {
    content_name: event.title,
    content_category: 'Event',
    content_ids: [event.id],
    content_type: 'product',
    currency: 'EUR',
    value: 10,
  });
};

export const trackTicketClick = (eventName, ticketUrl) => {
  trackEvent('InitiateCheckout', {
    content_name: eventName,
    content_category: 'Event Ticket',
    currency: 'EUR',
    value: 10
  });
};

export const trackFormSubmission = (formData) => {
  // Update Meta Pixel with user data for Advanced Matching
  updateMetaPixelUserData({
    email: formData.email,
    name: formData.name,
    city: formData.city,
    country: formData.country
  });
  
  trackEvent('Lead', {
    content_name: 'Community Signup',
    content_category: 'Newsletter',
    city: formData.city,
    country: formData.country
  });
  trackEvent('CompleteRegistration', {
    content_name: 'Baila Dembow Community',
    status: 'subscribed'
  });
};
