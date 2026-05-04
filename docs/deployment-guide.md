# Baila Dembow — Deployment Guide

## Tech Stack
- **Framework**: React (Create React App + CRACO)
- **Styling**: TailwindCSS + custom CSS
- **Animations**: Framer Motion
- **Routing**: Hash-based routing (`/#/page`)
- **No backend** — fully static site

---

## Build

```bash
# Install dependencies
yarn install

# Build for production
yarn build
```

**Output directory**: `build/`
**Build command**: `craco build` (via `yarn build`)

---

## Option 1: Deploy to Vercel

### Steps
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Create React App
   - **Build Command**: `yarn build`
   - **Output Directory**: `build`
   - **Install Command**: `yarn install`
5. Click Deploy

### Environment Variables (Vercel Dashboard)
No environment variables needed — the site is fully static.

### Custom Domain
1. In Vercel → Project Settings → Domains
2. Add `bailadembow.com`
3. Vercel will provide DNS records (see DNS section below)

---

## Option 2: Deploy to Netlify

### Steps
1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com) → New Site from Git
3. Connect your GitHub repository
4. Configure:
   - **Build Command**: `yarn build`
   - **Publish Directory**: `build`
5. Deploy

### Redirects for SPA
Create `public/_redirects` file:
```
/*    /index.html   200
```
(This handles hash routing — already works, but adding it ensures no 404s on direct URL access)

### Custom Domain
1. Site Settings → Domain Management → Add custom domain
2. Add `bailadembow.com`
3. Follow DNS instructions below

---

## Option 3: Deploy to Cloudflare Pages

### Steps
1. Push code to GitHub
2. Go to [pages.cloudflare.com](https://pages.cloudflare.com) → Create a project
3. Connect your GitHub repository
4. Configure:
   - **Build Command**: `yarn build`
   - **Build Output Directory**: `build`
   - **Framework preset**: Create React App
5. Deploy

### Custom Domain
1. In Cloudflare Pages → Custom Domains
2. Add `bailadembow.com`
3. If domain is already on Cloudflare DNS, it auto-configures

---

## DNS Instructions (HostGator → Vercel/Netlify/Cloudflare)

### If using Vercel:
Update DNS at HostGator:
- **A Record**: `@` → `76.76.21.21`
- **CNAME**: `www` → `cname.vercel-dns.com`

### If using Netlify:
Update DNS at HostGator:
- **A Record**: `@` → check Netlify dashboard for IP
- **CNAME**: `www` → `<your-site>.netlify.app`

### If using Cloudflare Pages:
Transfer DNS to Cloudflare (recommended) or:
- **CNAME**: `@` → `<your-project>.pages.dev`
- **CNAME**: `www` → `<your-project>.pages.dev`

### How to Update DNS at HostGator:
1. Log in to HostGator cPanel
2. Go to **Zone Editor** or **Advanced DNS Zone Editor**
3. Delete existing A records for `@` and `www`
4. Add the new records from above
5. **Propagation**: Takes 15 minutes to 48 hours (usually under 1 hour)

### SSL/HTTPS
- **Vercel**: Automatic SSL via Let's Encrypt
- **Netlify**: Automatic SSL via Let's Encrypt
- **Cloudflare**: Automatic SSL

---

## Post-Deployment Checklist

- [ ] Site loads at `https://bailadembow.com`
- [ ] All pages accessible via hash routes (`/#/events`, `/#/about`, etc.)
- [ ] Hero video plays on homepage
- [ ] Event posters load correctly
- [ ] Casita section videos and photos load
- [ ] Ticket buttons link to correct external URLs
- [ ] WhatsApp community CTA works
- [ ] Social media links work (Instagram, Facebook, TikTok, YouTube)
- [ ] Meta Pixel fires (check with Facebook Pixel Helper extension)
- [ ] TikTok Pixel fires
- [ ] robots.txt accessible at `/robots.txt`
- [ ] sitemap.xml accessible at `/sitemap.xml`
- [ ] OG image loads when sharing on social media
- [ ] Cookie consent banner appears
- [ ] Mobile navigation works
- [ ] Kingsday Weekender page loads at `/#/events/kingsday-weekender-2026`
- [ ] SEO pages load (`/#/latin-event-amsterdam`, `/#/latin-event-rotterdam`)

---

## File Structure
```
frontend/
├── public/
│   ├── images/
│   │   ├── branding/      # Logo, bunny, OG image
│   │   ├── events/        # 9 event poster images
│   │   └── casita/        # 8 casita event photos
│   ├── videos/            # 3 video files (~342MB)
│   ├── gallery/           # Gallery section images
│   ├── index.html         # Main HTML with SEO meta tags
│   ├── robots.txt         # Search engine crawl rules
│   └── sitemap.xml        # Sitemap for search engines
├── src/
│   ├── components/
│   │   ├── common/        # Navigation, FloatingCTA, EventModal
│   │   ├── pages/         # All page components
│   │   ├── sections/      # Homepage section components
│   │   └── ui/            # Shadcn UI components
│   ├── context/           # Cookie consent context
│   ├── utils/             # Constants, tracking, helpers
│   ├── App.js             # Main router
│   ├── App.css            # Custom styles
│   └── index.css          # Tailwind + base styles
├── package.json
├── craco.config.js        # Build config with @ alias
└── tailwind.config.js     # Tailwind configuration
```

## Important Notes
- Videos are large (~342MB total). Consider hosting them on a CDN or compressing them for faster load times.
- The `craco.config.js` has dev-only plugins (visual-edits, health-check) that only activate during `yarn start`. They don't affect production builds.
- The `@` import alias in craco.config.js maps to `src/`. If migrating to a different build tool (e.g., Vite), you'll need to configure this alias.
