// Generate SEO-friendly event slug
export const generateEventSlug = (event) => {
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
