// Logo URLs - local paths
export const BAILA_LOGO = "/images/branding/baila-logo-white.png";
export const BUNNY_LOGO = "/images/branding/bunny-logo.png";
export const BUNNY_GLASSES = "/images/branding/bunny-glasses.png";

// Pixel IDs
export const META_PIXEL_ID = '179511642577064';
export const TIKTOK_PIXEL_ID = 'C189G8RC77UBJAEBRS80';

// Cookie consent storage key
export const CONSENT_KEY = 'baila_cookie_consent';

// YouTube video
export const YOUTUBE_VIDEO_ID = "wnHQetmyGHQ";

// Gallery images for the Experience section
export const GALLERY_IMAGES = [
  { id: "gallery-1", url: "/gallery/gallery1.jpg", alt: "Baila Dembow event crowd" },
  { id: "gallery-2", url: "/gallery/gallery2.jpg", alt: "Baila Dembow party atmosphere" },
  { id: "gallery-3", url: "/gallery/gallery3.jpg", alt: "Baila Dembow dance floor" },
  { id: "gallery-4", url: "/gallery/gallery4.jpg", alt: "Baila Dembow event energy" },
  { id: "gallery-5", url: "/gallery/gallery5.jpg", alt: "Baila Dembow club night" },
  { id: "gallery-6", url: "/gallery/gallery6.jpg", alt: "Baila Dembow Latin vibes" },
  { id: "gallery-7", url: "/gallery/gallery7.jpg", alt: "Baila Dembow crowd experience" },
  { id: "gallery-8", url: "/gallery/gallery8.jpg", alt: "Baila Dembow party scene" }
];

// Events data (static)
// NOTE: Rotterdam (2026-06-06) and PADELDAM (2026-06-07) removed on 2026-06-08
// after they passed. The /events/PadelXReggaeton standalone route still exists
// in App.js for any inbound bookmarks but is no longer linked from the grid.
export const EVENTS = [
  {
    id: "den-haag-westwood-june13-2026",
    city: "Den Haag",
    venue: "Westwood, Laan van Poot 7, 2566 EV Den Haag",
    date: "2026-06-13",
    time: "23:00 – 04:00",
    title: "BAILA DEMBOW // DEN HAAG",
    description: "¡KLK DEN HAAG, LLEGAMOS! History is about to be made. Saturday, June 13th, Baila Dembow lands in Den Haag for the very first time, and we're doing it big at Westwood. After years of taking over Amsterdam, Rotterdam, Leiden and London, the bunny is finally coming to your city, and trust us when we say this one is going to hit different. Five full hours of reggaeton, dembow, salsa, bachata, and every Latin Caribbean hit that makes the floor shake. Bad Bunny, Karol G, El Alfa, Rauw Alejandro, Daddy Yankee, Anuel AA, all night, no breaks, pure perreo from the first track to the last. For the Dominicans, Colombians, Mexicans, Venezuelans, Puerto Ricans who've been waiting for your sound in your city, no more trains to Amsterdam. For the international students and expats who miss home, this is it. For the Dutch crowd ready to see what's been shaking Latin America, welcome to the party. Westwood becomes Santo Domingo, Medellín and San Juan all in one night. Tickets are already moving fast and early bird is always the smart move. The closer we get to the door, the more you pay, so don't sleep on this one. First Den Haag edition means limited capacity and once we're sold out, we're sold out. 📍 Location: Westwood, Laan van Poot 7, 2566 EV Den Haag · 🗓️ Date: Saturday, June 13, 2026 · ⏰ Time: 23:00 till 04:00 · 🔞 18+ event, ID required. Don't miss the night Den Haag finally gets put on the map. See you on the floor. 🐰🔥",
    ticket_url: "https://weeztix.shop/z9xgcjv6",
    status: "upcoming",
    price_from: "",
    price_door: "",
    image_url: "/images/events/den-haag-westwood-june13-2026.png"
  },
  {
    id: "coffee-day-rave-amsterdam-2026",
    city: "Amsterdam",
    venue: "IJland, Amsterdam",
    date: "2026-06-14",
    time: "12:00 - 17:00",
    title: "THE COFFEE DAY RAVE",
    description: "Ever been to a rave powered by espresso instead of everything else? Yeah, neither had we. Until now. Coffee Rave brings together high-energy beats, specialty coffee, and a crowd that actually remembers the night after. Dance hard, drink good coffee, and feel genuinely great the next morning. This isn't about deprivation — it's about discovering that a perfectly pulled shot of single-origin espresso hits different when the bass is shaking the floor. Craft roasters, live DJs, sauna & cold plunges (guided), HIIT, Zumba, Pilates, Booty & Core, healthy food and drinks. Music: Reggaeton, Dembow, Baile Funk, Latin & Afro House by Baila Dembow. Better sleep that night, no hangover the next day. Come wired. Leave happy. 18+ event — ID required.",
    ticket_url: "https://www.eventbrite.nl/e/tickets-the-coffee-day-rave-wellness-event-1988484526748?aff=oddtdtcreator",
    status: "upcoming",
    price_from: "",
    price_door: "",
    image_url: "/images/events/coffee-day-rave-2026.png"
  }
];

// Backward compat alias
export const FALLBACK_EVENTS = EVENTS;
