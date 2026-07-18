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
//
// The /events/PadelXReggaeton standalone route still exists in App.js for
// any inbound bookmarks but is no longer linked from the grid.
export const EVENTS = [
  {
    id: "amsterdam-oliva-july18-2026",
    city: "Amsterdam",
    venue: "Oliva, Rembrandtplein 17, Amsterdam",
    date: "2026-07-18",
    time: "23:00 – 05:00",
    title: "BAILA DEMBOW // AMSTERDAM",
    description: "KLK AMSTERDAM !!! Saturday the 18th of July we take over Oliva again for a full night of reggaeton, dembow and pure Latin Caribbean energy. You already know what this room does once it fills up, the bass hitting different, the floor never stopping, and the perreo running nonstop from the first track to the last. Bad Bunny, Karol G, El Alfa, Daddy Yankee and the whole sound that keeps our dancefloors alive until sunrise. Tickets are already moving and the early bird is always the smart play, because the closer we get to the door the more you end up paying. Grab yours now and save yourself the full price at the entrance. 📍 Location: Oliva, Rembrandtplein 17, Amsterdam · 🗓️ Date: Saturday, July 18, 2026 · ⏰ Time: 23:00 till 05:00 · 🔞 ID required. Oliva sells out every time, so do not wait on this one. 🐇",
    ticket_url: "https://ticketapp.shop/jvgfntufir",
    status: "upcoming",
    price_from: "",
    price_door: "",
    image_url: "/images/events/amsterdam-oliva-july18-2026.png"
  },
  {
    id: "groningen-huizemaas-july25-2026",
    city: "Groningen",
    venue: "Huize Maas, Groningen",
    date: "2026-07-25",
    time: "23:00 – 05:00",
    title: "BAILA DEMBOW // GRONINGEN",
    description: "KLK GRONINGEN !!! Saturday the 25th of July we bring Baila Dembow to Huize Maas for a full night of reggaeton, dembow and pure Latin Caribbean energy. The north has been waiting and we are pulling up, the floor about to run wall to wall and the perreo nonstop from the first track to the last. Bad Bunny, Karol G, El Alfa, Daddy Yankee and the whole sound that keeps our dancefloors moving until sunrise. Tickets are already going and the early bird is always the smart play, because the closer we get to the door the more you end up paying. Grab yours now and skip the full price at the entrance. 📍 Location: Huize Maas, Groningen · 🗓️ Date: Saturday, July 25, 2026 · ⏰ Time: 23:00 till 05:00 · 🔞 ID required. Groningen, this is your night, so do not wait on it. 🐇",
    ticket_url: "https://weeztix.shop/n9q3madk",
    status: "upcoming",
    price_from: "",
    price_door: "",
    image_url: "/images/events/groningen-huizemaas-july25-2026.png"
  },
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
