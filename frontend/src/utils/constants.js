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
// History:
//   2026-06-08 — Rotterdam (06 Jun) + PADELDAM (07 Jun) removed (past)
//   2026-06-18 — Den Haag (13 Jun) + Coffee Day Rave (14 Jun) removed (past)
//   2026-06-18 — July 2026 agenda added: Rotterdam, Leiden, Amsterdam, Groningen
//   2026-07-17 — Past July events removed (Rotterdam 04, IJland 05, Leiden 11); Rotterdam Reverse Summer Special (01 Aug) added
//   2026-07-18 — Amsterdam Oliva (18 Jul) removed; Supper Club (07 Aug) + Summer of Love XL (29 Aug) added
//   2026-07-27 — Groningen (25 Jul) removed (past). Live: Rotterdam 01 Aug, Supper Club 07 Aug, Summer of Love 29 Aug
//
// The /events/PadelXReggaeton standalone route still exists in App.js for
// any inbound bookmarks but is no longer linked from the grid.
export const EVENTS = [
  {
    id: "rotterdam-reverse-aug1-2026",
    city: "Rotterdam",
    venue: "Club Reverse, Rotterdam",
    date: "2026-08-01",
    time: "23:00 – 05:00",
    title: "BAILA DEMBOW // ROTTERDAM — SUMMER SPECIAL",
    description: "KLK ROTTERDAM, ¡el verano llegó! Reverse is about to turn into a full Caribbean block party. Saturday, August 1st, Baila Dembow brings the Summer Special to Reverse — dembow, reggaeton and Latin heat all night long, no breaks, no holding back. Early birds pay less, so lock your ticket in now before prices climb. Get yours now. 📍 Location: Club Reverse, Rotterdam · 🗓️ Date: Saturday, August 1, 2026 · ⏰ Time: 23:00 till 05:00 · 🔞 18+, ID required.",
    ticket_url: "https://weeztix.shop/4s84rxxa",
    status: "upcoming",
    price_from: "",
    price_door: "",
    image_url: "/images/events/rotterdam-reverse-aug1-2026.png"
  },
  {
    id: "amsterdam-supperclub-aug7-2026",
    city: "Amsterdam",
    venue: "Supper Club, Singel 460, Amsterdam",
    date: "2026-08-07",
    time: "23:30 – 05:00",
    title: "BAILA DEMBOW × SUPPER CLUB // AMSTERDAM",
    description: "DIME AMSTERDAM !!! Friday, August 7th, Baila Dembow is hosting a Latin Night together with Supper Club for the very first time. Reggaeton, dembow, salsa and bachata from 23:30 until 05:00, plus a guest behind the decks that we are not naming yet. Early bird is live and it is the cheapest ticket you will find all week. La última vez se agotó, so do not wait on this one. 📍 Location: Supper Club, Singel 460, 1017 AW Amsterdam · 🗓️ Date: Friday, August 7, 2026 · ⏰ Time: 23:30 – 05:00 · 🔞 18+ event, ID required. First time in this venue, and we only get one of those. Nos vemos en la pista 🐇",
    ticket_url: "https://weeztix.shop/rw9qseqg",
    status: "upcoming",
    price_from: "",
    price_door: "",
    image_url: "/images/events/amsterdam-supperclub-aug7-2026.png"
  },
  {
    id: "ijland-summer-of-love-aug29-2026",
    city: "Amsterdam",
    venue: "IJland, Amsterdam",
    date: "2026-08-29",
    time: "23:00 – 05:00",
    title: "BAILA DEMBOW XL // SUMMER OF LOVE",
    featured: true,
    dress_code: "Pastel & summery",
    tagline: "Our biggest room yet, dressed in every shade of summer.",
    description: "¡Ámsterdam, se siente el amor! The summer of 2026 has been something special, all long days and warm nights, and on Saturday, August 29th we throw the party it deserves. Baila Dembow goes XL at IJland, right on the water, with a Summer of Love theme built for exactly this season. Picture pastel everywhere, soft golden light and one full night of reggaeton, dembow and Latin club heat. You already know how the last one ended, with the floor packed and nobody willing to sit down. This time the room is bigger, the sound hits harder, and the perreo has real space to breathe. Bad Bunny, Karol G, El Alfa, Rauw Alejandro, Daddy Yankee and the whole Caribbean playlist, running all night with no breaks. Dress code is pastel and summery, so bring your softest colors and your best summer fit. Here is the part your wallet cares about. Tickets start low and they climb as the date gets closer, so the crew that moves early always pays the least. The last editions burned through their cheap tiers fast, and plenty of people ended up at door price or standing outside. Do not let that be you this time. Grab your ticket now, lock the low rate, and bring the whole group before the next tier kicks in. 📍 Location: IJland, Amsterdam · 🗓️ Date: Saturday, August 29, 2026 · ⏰ Time: 23:00 – 05:00 · 👗 Dress code: pastel and summery · 🔞 18+ event, ID required. This is our biggest room yet, dressed in every shade of summer. Come in your pastels, bring your people, and help us send this season off loud.",
    ticket_url: "https://weeztix.shop/v9f38e5c",
    status: "upcoming",
    price_from: "",
    price_door: "",
    image_url: "/images/events/ijland-summer-of-love-aug29-2026.png"
  }
];

// Backward compat alias
export const FALLBACK_EVENTS = EVENTS;
