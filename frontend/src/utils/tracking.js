import { META_PIXEL_ID, TIKTOK_PIXEL_ID } from './constants';

// Load Meta Pixel with Advanced Matching support
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
  
  // Initialize with Advanced Matching - values will be hashed automatically by the pixel using SHA-256
  window.fbq('init', META_PIXEL_ID, {
    em: userData.email || '',      // Email - hashed automatically
    ph: userData.phone || '',      // Phone number - hashed automatically
    fn: userData.firstName || '',  // First name - hashed automatically
    ln: userData.lastName || '',   // Last name - hashed automatically
    ct: userData.city || '',       // City - hashed automatically
    country: userData.country || '' // Country - hashed automatically
  });
  window.fbq('track', 'PageView');
};

// Update user data for Advanced Matching after form submission
export const updateMetaPixelUserData = (userData) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('init', META_PIXEL_ID, {
      em: userData.email || '',
      ph: userData.phone || '',
      fn: userData.firstName || userData.name?.split(' ')[0] || '',
      ln: userData.lastName || userData.name?.split(' ').slice(1).join(' ') || '',
      ct: userData.city || '',
      country: userData.country || ''
    });
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
