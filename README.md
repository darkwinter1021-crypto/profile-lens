# Profile Lens AI

Profile Lens AI is a Vercel-ready LinkedIn profile reviewer built with Next.js, React, and TypeScript.

## Features

- OpenAI-powered profile feedback when `OPENAI_API_KEY` is configured.
- Local fallback reviewer so the app still works without an API key.
- Multiple specialist AI perspectives: Recruiter AI, Portfolio AI, Content AI, and ATS AI.
- Overall score plus category scores for headline clarity, story, proof, projects, skills, and scanability.
- Copy-ready rewrites for headline, About, project entry, and positioning.
- Website upgrade ideas generated as part of the report.
- Copy and download actions for the complete review.
- Server-only OpenAI calls with input limits and basic per-instance rate limiting.
- Safe API health check at `/api/analyze-profile` that reports whether OpenAI is configured without exposing secrets.
- In-app backend status check, character limits, and saved local analysis history.

## Environment

Create `.env.local` for local development:

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5.4
```

On Vercel, add the same variables in Project Settings > Environment Variables.

The OpenAI key must never use a `NEXT_PUBLIC_` prefix. The app reads it only from the server-side API route.

After adding or changing Vercel environment variables, redeploy the project. Check `/api/analyze-profile` with a browser or API client; `openAIConfigured` should be `true` when Vercel can see the server-side key.

## API Safety

- `POST /api/analyze-profile` accepts up to 12,000 profile characters.
- The API allows 8 analysis requests per minute per detected client IP on each running server instance.
- `GET /api/analyze-profile` returns safe configuration status and never returns secret values.
- Analysis history is saved in the browser only through `localStorage`; it is not uploaded or stored on the server.

## Run Locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Deploy

Connect the GitHub repository to Vercel. Vercel will run `npm run build` and deploy every push.
