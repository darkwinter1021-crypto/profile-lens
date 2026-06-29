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

## Environment

Create `.env.local` for local development:

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5.4
```

On Vercel, add the same variables in Project Settings > Environment Variables.

## Run Locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Deploy

Connect the GitHub repository to Vercel. Vercel will run `npm run build` and deploy every push.
