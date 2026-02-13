# Babi Time

Interactive and aesthetic couples web app built with React + Vite.

## Features

- Login page for male/female role
- Dashboard showing years/months/weeks/days together
- Auto-generated monthsary and anniversary upcoming dates
- Custom calendar that highlights love milestones
- Private chat with text and image messages
- Date invitation builder with templates, GIFs, stickers, and animated invitation popup
- Cloudflare R2-ready uploads for chat images and invitation GIF uploads

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Cloudflare R2 Setup (Object Storage)

### 1) Create R2 bucket

In Cloudflare Dashboard:
- Go to `Storage & databases` → `R2 object storage`
- Click `Create bucket`
- Use bucket name: `babi-time-uploads` (or your own)

### 2) Set public file URL base

Enable one of these:
- `r2.dev` public URL, or
- Custom domain mapped to the bucket

Copy that base URL (example: `https://pub-xxxx.r2.dev`).

### 3) Deploy upload API Worker

From project root:

```bash
npx wrangler r2 bucket create babi-time-uploads
npx wrangler deploy --config worker/wrangler.toml
```

Then set worker vars:

```bash
npx wrangler secret put UPLOAD_TOKEN --config worker/wrangler.toml
npx wrangler secret put PUBLIC_R2_BASE_URL --config worker/wrangler.toml
```

Also update `worker/wrangler.toml`:
- `ALLOWED_ORIGIN` = your frontend URL (dev: `http://localhost:5173`)
- `bucket_name` = your exact bucket name

### 4) Connect frontend to Worker

Copy `.env.example` to `.env` and set:

```env
VITE_R2_UPLOAD_API_URL=https://your-worker.your-subdomain.workers.dev
VITE_R2_UPLOAD_API_TOKEN=your_same_upload_token
```

Restart dev server:

```bash
npm run dev
```

### 5) Verify upload flow

- Send image in chat
- Upload custom GIF in invitation builder
- Confirm uploaded files resolve from your R2 public URL

## Files Added for R2

- `worker/wrangler.toml`
- `worker/src/index.ts`
- `src/lib/upload.ts`
- `.env.example`
