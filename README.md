# Campus Club Frontend

React + Vite frontend wired to the Campus Club monolithic backend.

## Environment

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Key variable:

- `VITE_API_BASE_URL` (development default `http://localhost:4000/api/v1`, production-safe default `/api/v1`)

## Local Run

```bash
npm ci
npm run dev
```

Default URL:

- `http://localhost:5173`

Run checks:

```bash
npm run lint
npm test
```

## Docker Build + Run

```bash
docker build -t campus-club-frontend --build-arg VITE_API_BASE_URL=http://localhost:4000/api/v1 .
docker run --rm -p 5173:80 campus-club-frontend
```

The container serves the built SPA through nginx with route fallback (`index.html`) enabled.

## Docker Compose (Frontend Repo Only)

Development default (HMR + file watching):

```bash
docker compose up --build
```

This mode runs Vite dev server in Docker with bind mounts and polling enabled for reliable live reload on Windows/macOS filesystems.

Production (nginx static build):

```bash
docker compose -f docker-compose.prod.yml up --build
```

This frontend repository is standalone. It expects backend to be running separately at `VITE_API_BASE_URL`.
