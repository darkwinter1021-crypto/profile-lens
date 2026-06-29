# Profile Lens

Profile Lens is a Vercel-ready LinkedIn profile analyzer built with Next.js, React, and TypeScript.

## Features

- Overall LinkedIn profile score with role-based weighting.
- Category scores for headline, About story, experience, projects, skills, proof, readability, and completeness.
- Target role presets for student builders, developers, founders, designers, marketers, and general profiles.
- Detected profile sections, strengths, weak spots, priority fixes, and rewrite ideas.
- Copy and download actions for a complete profile report.
- Portfolio-ready LinkedIn project description generated from the app itself.
- Browser-side image analyzer for profile photos or screenshots using canvas pixel checks.
- Server API route at `/api/analyze-profile` for deployable dynamic behavior.

## Run Locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Deploy

Connect the GitHub repository to Vercel. Vercel will run `npm run build` and deploy every push.
