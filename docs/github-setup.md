# Baila Dembow — GitHub Repository Setup

## Create Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `bailadembow` (or your preferred name)
3. Set to **Private** (recommended)
4. Do NOT initialize with README (we have our own)
5. Click "Create repository"

## Download Code from Emergent

Use the **"Save to GitHub"** button in the Emergent chat to push the code directly. Or download the code and push manually:

## Push to GitHub (Manual)

```bash
# Navigate to the frontend directory (this IS your project)
cd frontend

# Initialize git
git init

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/bailadembow.git

# Create backup branch first
git checkout -b backup/emergent-export
git add .
git commit -m "Backup: Full export from Emergent AI"
git push -u origin backup/emergent-export

# Switch to main
git checkout -b main
git push -u origin main
```

## .gitignore

Make sure your `.gitignore` includes:
```
node_modules/
build/
.env
.env.local
.DS_Store
```

## Important: Large Files

The `public/videos/` folder contains ~342MB of video files. Git and GitHub have file size limits:
- GitHub max file size: 100MB per file
- GitHub max repo size: recommended under 1GB

### Options for video files:
1. **Git LFS** (Large File Storage):
   ```bash
   git lfs install
   git lfs track "*.mp4"
   git add .gitattributes
   ```
2. **External hosting**: Upload videos to YouTube/Vimeo and embed them, or use a CDN like Cloudflare R2, AWS S3, or Bunny CDN
3. **Compress videos**: Use FFmpeg to reduce file sizes:
   ```bash
   ffmpeg -i hero-background.mp4 -vcodec libx264 -crf 28 hero-background-compressed.mp4
   ```

## Connect to Deployment Platform

After pushing to GitHub:
1. Go to Vercel/Netlify/Cloudflare Pages
2. Import the GitHub repository
3. Follow the deployment guide in `/docs/deployment-guide.md`

## Recommended Workflow

```
main branch → auto-deploys to production (bailadembow.com)
develop branch → preview deployments for testing
```

Enable auto-deploy on Vercel/Netlify so every push to `main` triggers a new deployment.
