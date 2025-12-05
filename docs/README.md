# Arctic Aura Background Remover

Modern, token-protected background removal UI and API for Arctic Aura Designs. The app proxies uploads to your self-hosted [withoutbg](https://withoutbg.com) instance (no SaaS calls) and returns the processed image to internal users and other services (mobile app, automation, etc.).

## Tech stack
- Next.js 16 (App Router) + Tailwind CSS 4 for the UI
- Bun for package management and builds
- Node runtime (standalone output) for deployment
- withoutbg as the background removal engine (external service)

## Project structure
- `src/app/page.tsx` – UI flow (upload, status, previews)
- `src/app/api/remove-background/route.ts` – Token-guarded proxy to withoutbg
- `Dockerfile` / `.dockerignore` – Container build for Linux/tunnel host
- `.env.example` – Required configuration
- `docs/Changelog.md` – Release notes for this repo

## Prerequisites
- Bun installed locally (`bun --version` should respond)
- An accessible withoutbg endpoint (e.g., another container or VM)
- Service token to lock down `/api/remove-background`

## Configuration
Copy `.env.example` to `.env` and fill in the values:

```
SERVICE_API_TOKEN=your-shared-secret               # required for /api access
WITHOUTBG_API_URL=http://withoutbg/api/remove      # your self-hosted withoutbg endpoint (container port 80)
WITHOUTBG_API_TOKEN=                               # optional if your self-hosted service enforces auth
NEXT_PUBLIC_DEFAULT_SERVICE_TOKEN=                 # optional convenience for the UI
NEXT_PUBLIC_SITE_URL=https://bgremover.pvp2max.com # used in docs/logging if needed
```

## Local workflow (when needed)
> Production hosts run `bun run build` + `bun run start`. Only use `bun run dev` when intentionally developing.

```
bun install
bun run lint         # optional quality check
bun run build
bun run start        # serves on port 3000 by default
```

## API usage
- Endpoint: `POST /api/remove-background`
- Auth: `Authorization: Bearer <SERVICE_API_TOKEN>` (or `x-service-token`)
- Body: `multipart/form-data` with `file=<image>`
- Response: `{ imageBase64: string, contentType: string }`

Example:

```
curl -X POST http://localhost:3000/api/remove-background \
  -H "Authorization: Bearer $SERVICE_API_TOKEN" \
  -F "file=@/path/to/image.png" \
  | jq .
```

## UI flow
1) Open the app (e.g., `https://bgremover.pvp2max.com`).  
2) Drop or browse an image.  
3) Click **Remove background** to send it through withoutbg.  
4) Compare before/after previews and download the processed PNG.

## Docker deploy (recommended for the tunnel host)
```
docker build -t bgremover .
docker run -d --name bgremover -p 3000:3000 --env-file .env bgremover
```
- Container uses `next start` from the standalone build.  
- Point your tunnel/reverse proxy at `http://localhost:3000` for `bgremover.pvp2max.com`.  
- Ensure the container can reach your withoutbg service (`WITHOUTBG_API_URL`).

## Docker Compose (bgremover + withoutbg together)
1) Copy `.env.example` to `.env` and set `SERVICE_API_TOKEN` plus any optional tokens.  
2) Run `docker compose up -d`.  
3) Access the app at `http://localhost:3000` (or via your tunnel). The app will call the bundled `withoutbg` service at `http://withoutbg:5001/api/remove`.

Notes:
- The compose file uses `withoutbg/app:latest` and maps host `5001` to container `80`. If the upstream project publishes a different tag/port, adjust `docker-compose.yml` accordingly.  
- If your withoutbg build needs its own auth, set `WITHOUTBG_API_TOKEN` in both `.env` and the compose service (commented example in the file).

## Notes on withoutbg integration
- The app forwards the uploaded file to your self-hosted `WITHOUTBG_API_URL`; no calls are made to any paid API.  
- If your withoutbg instance needs its own token, set `WITHOUTBG_API_TOKEN`; it will be sent as `Authorization: Bearer <token>`.  
- Responses are converted to base64 so clients can embed or download immediately. No images are persisted on disk by this app.

## Maintenance checklist
- Keep `docs/Changelog.md` updated when you change the project.
- Rotate `SERVICE_API_TOKEN` if it leaks; update `NEXT_PUBLIC_DEFAULT_SERVICE_TOKEN` only for non-production convenience.
- Run `bun run lint` + `bun run build` before pushing to GitHub.
