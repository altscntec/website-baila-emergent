// Generate SEO-friendly event slug.
// Events can opt out of the auto-generated slug by setting `customSlug` —
// useful for standalone branded landing pages (e.g. PadelXReggaeton, the
// Kingsday weekender) that have their own dedicated route in App.js.
export const generateEventSlug = (event) => {
  if (event.customSlug) return event.customSlug;
  const date = new Date(event.date);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'long' }).toLowerCase();
  const year = date.getFullYear();
  const city = event.city.toLowerCase().replace(/\s+/g, '-');
  return `${city}-${day}-${month}-${year}`;
};

// Get event by slug
export const getEventBySlug = (slug, events) => {
  return events.find(event => generateEventSlug(event) === slug);
};
