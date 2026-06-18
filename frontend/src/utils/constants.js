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
//
// The /events/PadelXReggaeton standalone route still exists in App.js for
// any inbound bookmarks but is no longer linked from the grid.
export const EVENTS = [
  {
    id: "rotterdam-reverse-july4-2026",
    city: "Rotterdam",
    venue: "Club Reverse, Rotterdam",
    date: "2026-07-04",
    time: "23:00 – 05:00",
    title: "BAILA DEMBOW // ROTTERDAM",
    description: "¡ROTTERDAM, VOLVEMOS! Saturday the 4th of July we take over Club Reverse again for a full night of reggaeton, dembow and Latin Caribbean heat. If you caught us here before you already know how this room moves, the floor packed wall to wall and the perreo running nonstop from the first track to the last. Bad Bunny, Karol G, El Alfa, Daddy Yankee and the whole sound that keeps our dancefloors alive. Tickets are already moving and the early bird is always the smart play, because the closer we get to the door the more you end up paying. Grab yours now and save yourself the full price at the entrance. 📍 Location: Club Reverse, Rotterdam · 🗓️ Date: Saturday, July 4, 2026 · ⏰ Time: 23:00 till 05:00 · 🔞 ID required. This one fills up fast, so do not sleep on it. 🐇",
    ticket_url: "https://weeztix.shop/erxqk52c",
    status: "upcoming",
    price_from: "",
    price_door: "",
    image_url: "/images/events/rotterdam-reverse-july4-2026.png"
  },
  {
    id: "leiden-wibar-july11-2026",
    city: "Leiden",
    venue: "Wibar, Leiden",
    date: "2026-07-11",
    time: "23:00 – 05:00",
    title: "BAILA DEMBOW // LEIDEN",
    description: "KLK LEIDEN !!! Saturday the 11th of July we are back at Wibar for another night of reggaeton, dembow and straight Latin Caribbean energy. If you were there last time you already know what this room does once the floor fills up, the bass hitting hard and the perreo running nonstop from the first track to the last. Bad Bunny, Karol G, El Alfa, Daddy Yankee and the whole sound that keeps our dancefloors moving until sunrise. Tickets are already going and the early bird is always the smart play, because the closer we get to the door the more you end up paying. Grab yours now and skip the full price at the entrance. 📍 Location: Wibar, Leiden · 🗓️ Date: Saturday, July 11, 2026 · ⏰ Time: 23:00 till 05:00 · 🔞 ID required. Leiden always shows up, so do not wait on this one. 🐇",
    ticket_url: "https://weeztix.shop/qa84k5a6",
    status: "upcoming",
    price_from: "",
    price_door: "",
    image_url: "/images/events/leiden-wibar-july11-2026.png"
  },
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
  }
];

// Backward compat alias
export const FALLBACK_EVENTS = EVENTS;
