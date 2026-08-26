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
//   2026-08-11 — Supper Club (07 Aug) removed (past). customSlug added so /events/<slug> URLs match the sitemap.
//   2026-08-26 — Groningen All White Edition (22 Aug) removed (past)
//
// The /events/PadelXReggaeton standalone route still exists in App.js for
// any inbound bookmarks but is no longer linked from the grid.
export const EVENTS = [
  {
    id: "ijland-summer-of-love-aug29-2026",
    customSlug: "summer-of-love-29-august-2026",
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
  },
  {
    id: "ijland-halloween-oct31-2026",
    customSlug: "halloween-31-october-2026",
    city: "Amsterdam",
    venue: "IJLAND, TT Vasumweg 171, Amsterdam",
    date: "2026-10-31",
    time: "23:00 – 05:00",
    title: "THE LATIN HALLOWEEN FESTIVAL",
    featured: true,
    dress_code: "Scary, Sexy or Scary-Sexy",
    tagline: "The nightmare wakes up all over again.",
    landing_page: "/halloween",
    teaser_video: "/videos/halloween-teaser.mp4",
    description: "MOST AWAITED EVENT !! The nightmare wakes up all over again. On Saturday, October 31st, the gates of IJLAND swing open one more time and the whole venue turns into a haunted inferno. Last edition we packed the room wall to wall, and this year the creatures crawl back thirstier for blood than ever. Vampires, ghouls, zombies and restless spirits take over every dark corner while our Baila Dembow DJs run reggaeton, dembow, Latin and Caribbean heat with zero breaks until the sun comes up. Bad Bunny, Karol G, El Alfa, Rauw Alejandro, Daddy Yankee and more shake the walls straight through the night. The capital of the Netherlands will not feel the same after this one. Here is the part you really should not sleep on. Every tier climbs in price as the night sells through, so the earlier you grab your ticket the cheaper it stays locked. Early Death is the lowest price of the whole event and it moves fast once the word spreads. Waiting until the door means paying the most and staring down a sold out sign. Secure your spot now while it is still cheap and drag the whole crew in with you. What to expect: cash prize for the best costume of the night · full haunted club transformation · free trick and treat sweets · spooky photobooth for the crew · costumes everywhere you look · Latin and Caribbean energy on full blast · 2 areas · food trucks on site · y mucho más. 📍 Location: IJLAND, TT Vasumweg 171, Amsterdam · 🗓️ Date: Saturday, October 31, 2026 · ⏰ Time: 23:00 to 05:00 · 🔞 18+ event, ID required · 👗 Dress code: Scary, Sexy or Scary-Sexy. Music: Reggaeton, Dembow, Dancehall, Salsa, Bachata, Merengue. Come in costume, come correct, and do not be the one hearing about it on Sunday.",
    ticket_url: "https://weeztix.shop/nxaqrkdz",
    status: "upcoming",
    price_from: "",
    price_door: "",
    image_url: "/images/events/halloween-ijland-oct31-2026.png"
  },
  {
    id: "rotterdam-reverse-sep5-2026",
    customSlug: "rotterdam-5-september-2026",
    city: "Rotterdam",
    venue: "Club Reverse, Rotterdam",
    date: "2026-09-05",
    time: "23:00 – 05:00",
    title: "BAILA DEMBOW // ROTTERDAM",
    description: "¡ROTTERDAM, SE PRENDE OTRA VEZ! Saturday, September 5th, Baila Dembow takes over Club Reverse for six straight hours of reggaeton, dembow and Latin Caribbean heat. You know how this room goes once it fills up. The bass sits in your chest, the perreo never really stops, and nobody is checking their phone by 3am. Bad Bunny, Karol G, El Alfa, Rauw Alejandro, Daddy Yankee and everything in between, all night, no breaks. Nonstop Latin + Caribbean hits, full takeover of Reverse. We have a habit of filling rooms and closing the door early, and Rotterdam always moves quicker than people expect. Early tickets are the cheapest they will ever be, and the price only climbs from here. Get yours now instead of paying more later for the exact same night. 📍 Location: Club Reverse, Rotterdam · 🗓️ Date: Saturday, September 5, 2026 · ⏰ Time: 23:00 – 05:00 · 🔞 18+ event, ID required.",
    ticket_url: "https://weeztix.shop/4s84rxxa",
    status: "upcoming",
    price_from: "",
    price_door: "",
    image_url: "/images/events/rotterdam-reverse-sep5-2026.png"
  },
  {
    id: "denhaag-westwood-sep12-2026",
    customSlug: "den-haag-12-september-2026",
    city: "Den Haag",
    venue: "Westwood, Den Haag",
    date: "2026-09-12",
    time: "23:00 – 04:00",
    title: "BAILA DEMBOW // DEN HAAG",
    description: "¡DEN HAAG, ESTO SE PONE CALIENTE! Saturday, September 12th, Baila Dembow walks into Westwood and turns it into pure Latin club territory. Five hours of reggaeton, dembow, salsa, bachata and every Caribbean hit worth screaming back at the DJ. The floor fills early here, and once it does the room stops being a club and starts being a block party. Nonstop Latin + Caribbean hits, full takeover of Westwood. Every city we hit this year filled up before the night arrived, and Den Haag is not going to be the exception. The early tickets are always the cheapest ones, and they disappear first. Secure yours now so you are inside when the room goes off, not outside reading about it. 📍 Location: Westwood, Den Haag · 🗓️ Date: Saturday, September 12, 2026 · ⏰ Time: 23:00 – 04:00 · 🔞 18+ event, ID required.",
    ticket_url: "https://weeztix.shop/z9xgcjv6",
    status: "upcoming",
    price_from: "",
    price_door: "",
    image_url: "/images/events/denhaag-westwood-sep12-2026.png"
  },
  {
    id: "amsterdam-oliva-sep26-2026",
    customSlug: "amsterdam-26-september-2026",
    city: "Amsterdam",
    venue: "Oliva, Rembrandtplein 17, Amsterdam",
    date: "2026-09-26",
    time: "23:00 – 05:00",
    title: "BAILA DEMBOW // AMSTERDAM",
    description: "¡AMSTERDAM, VOLVEMOS A OLIVA! Saturday, September 26th, Baila Dembow takes the whole of Oliva again. If you were in that room the last time, you already know what happens once Rembrandtplein empties into it. The bass hits differently, the floor never settles, and the perreo runs from the first track to the last. Bad Bunny, Karol G, El Alfa, Rauw Alejandro, Daddy Yankee and more, six hours deep. Nonstop Latin + Caribbean hits, full takeover of Oliva. Oliva has closed its doors on us before because the room was simply full, and that is not a story we want you hearing secondhand again. Early tickets cost the least, and every week that passes makes them more expensive. Take the cheap one now and thank yourself later. 📍 Location: Oliva, Rembrandtplein 17, Amsterdam · 🗓️ Date: Saturday, September 26, 2026 · ⏰ Time: 23:00 – 05:00 · 🔞 21+ event, ID required.",
    ticket_url: "https://ticketapp.shop/jvgfntnewx",
    status: "upcoming",
    price_from: "",
    price_door: "",
    image_url: "/images/events/amsterdam-oliva-sep26-2026.png"
  },
  {
    id: "eindhoven-declub-oct2-2026",
    customSlug: "eindhoven-2-october-2026",
    city: "Eindhoven",
    venue: "De Club, Eindhoven",
    date: "2026-10-02",
    time: "23:00 – 05:00",
    title: "BAILA DEMBOW // EINDHOVEN — FIRST EDITION",
    tagline: "Our very first night in Eindhoven.",
    description: "¡EINDHOVEN, POR FIN TE TOCA! Friday, October 2nd, Baila Dembow lands in Eindhoven for the very first time, and De Club is where it happens. Six hours of reggaeton, dembow, salsa, bachata and Latin Caribbean hits, run the way we run every room we walk into. Amsterdam filled up. Rotterdam filled up. Now it is your turn to find out what the noise is about. Nonstop Latin + Caribbean hits, full takeover of De Club. First editions always go quickest, because everybody wants to say they were at the one that started it. Early tickets are the cheapest of the whole run and the price climbs as the date gets closer. Get yours now and be in the room for night one. 📍 Location: De Club, Eindhoven · 🗓️ Date: Friday, October 2, 2026 · ⏰ Time: 23:00 – 05:00 · 🔞 18+ event, ID required.",
    ticket_url: "https://weeztix.shop/q24mrcf7",
    status: "upcoming",
    price_from: "",
    price_door: "",
    image_url: "/images/events/eindhoven-declub-oct2-2026.png"
  }
];

// Backward compat alias
export const FALLBACK_EVENTS = EVENTS;

// FAQ — single source of truth for the visible homepage FAQ section.
// Keep the FAQPage JSON-LD in public/index.html in sync with these answers.
export const FAQS = [
  {
    q: "What is the best Latin event in Amsterdam?",
    a: "Baila Dembow is the leading Latin event in Amsterdam and the Netherlands, running sold-out reggaeton and dembow parties since 2023. Over 25,000 fans have joined our events, from club takeovers to the XL editions at IJland and the annual Latin Halloween Festival.",
  },
  {
    q: "Where can I find Latin party events in the Netherlands?",
    a: "Baila Dembow hosts Latin parties across the Netherlands — Amsterdam, Rotterdam, Den Haag, Groningen, Eindhoven and beyond. The upcoming agenda includes Baila Dembow XL Summer of Love (29 August, IJland Amsterdam), Rotterdam (5 September, Club Reverse), Den Haag (12 September, Westwood), Amsterdam (26 September, Oliva), the Latin Halloween Festival (31 October, IJLAND Amsterdam) and our first-ever Eindhoven edition (2 October, De Club).",
  },
  {
    q: "What is dembow music?",
    a: "Dembow is a high-energy music genre from the Dominican Republic, built on a fast, repetitive riddim that keeps the dancefloor moving. Artists like El Alfa and Rochy RD made it a global sound, and it sits at the heart of every Baila Dembow party alongside reggaeton.",
  },
  {
    q: "Are there reggaeton parties in Amsterdam?",
    a: "Yes — Baila Dembow is Amsterdam's reggaeton party brand, playing Bad Bunny, Karol G, Rauw Alejandro, Daddy Yankee and the full Latin playlist. The next Amsterdam editions are the XL Summer of Love at IJland on 29 August and the Latin Halloween Festival on 31 October 2026.",
  },
  {
    q: "How much do Baila Dembow tickets cost?",
    a: "Tickets start from around €10 online for early birds and climb in tiers as the event date approaches. Booking early always gets the lowest price — recent editions sold out before the door. Tickets are sold via Weeztix.",
  },
  {
    q: "What is the Latin Halloween Festival by Baila Dembow?",
    a: "The Latin Halloween Festival is Amsterdam's biggest Latin Halloween party — four years running, 1500+ capacity, sold out every time. The whole venue becomes a haunted club with two areas, a cash prize for the best costume and reggaeton, dembow, salsa and bachata until 05:00. The 2026 edition is Saturday 31 October at IJLAND.",
  },
  {
    q: "What are the Live Tribute Shows at Baila Dembow?",
    a: "Live Tribute Shows are special Baila Dembow nights where world-class musicians perform live tributes to Latin legends like Juan Luis Guerra and the salsa and merengue greats. After the live set, our resident DJs take over with reggaeton and dembow until sunrise.",
  },
];
