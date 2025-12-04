# Changelog

## 2024-12-04
- Scaffolded Bun + Next.js app with Tailwind 4 and refreshed Space Grotesk theme.
- Implemented token-protected `/api/remove-background` proxy to the withoutbg service.
- Built modern upload UI with drag/drop, status messaging, previews, and download support.
- Added Dockerfile, `.dockerignore`, `.env.example`, and documentation under `docs/`.
- Ensured API responses are non-cacheable and UI clears previews after download to avoid storing images.
- Added self-hosted font packages (Space Grotesk + JetBrains Mono) to remove external font fetches.
- Clarified docs that withoutbg is self-hosted only (no paid API calls).
- Added `docker-compose.yml` to launch bgremover with a bundled self-hosted withoutbg service.
