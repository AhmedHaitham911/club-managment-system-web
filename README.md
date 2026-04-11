# Campus Club Frontend

React + Vite frontend wired to the Campus Club monolithic backend.

## Environment

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Key variable:

- `VITE_API_BASE_URL` (default `http://localhost:4000/api/v1`)

## Local Run

```bash
npm ci
npm run dev
```

Default URL:

- `http://localhost:5173`

## Docker Build + Run

```bash
docker build -t campus-club-frontend --build-arg VITE_API_BASE_URL=http://localhost:4000/api/v1 .
docker run --rm -p 5173:80 campus-club-frontend
```

The container serves the built SPA through nginx with route fallback (`index.html`) enabled.

## Docker Compose (Frontend Repo Only)

```bash
docker compose up --build
```

This frontend repository is standalone. It expects backend to be running separately at `VITE_API_BASE_URL`.
