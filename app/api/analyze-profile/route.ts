import { NextResponse } from "next/server";

type TargetRole = "student-builder" | "developer" | "founder" | "designer" | "marketer" | "general";
type ReviewMode = "board" | "recruiter" | "builder" | "content" | "ats";
type Tone = "elite" | "strong" | "warning" | "danger";

type CategoryScore = {
  key: string;
  label: string;
  score: number;
  detail: string;
  fix: string;
};

type Reviewer = {
  id: "recruiter" | "builder" | "content" | "ats";
  name: string;
  score: number;
  verdict: string;
  strengths: string[];
  fixes: string[];
  rewrite: string;
};

type AiReview = {
  summary: string;
  headlineRewrite: string;
  aboutRewrite: string;
  projectRewrite: string;
  positioningStatement: string;
  quickWins: string[];
  reviewers: Reviewer[];
  websiteIdeas: string[];
};

const roleLabels: Record<TargetRole, string> = {
  "student-builder": "Student Builder",
  developer: "Developer",
  founder: "Founder",
  designer: "Designer",
  marketer: "Marketer",
  general: "General",
};

const reviewModes: Record<ReviewMode, string> = {
  board: "Full AI review board",
  recruiter: "Recruiter AI",
  builder: "Portfolio AI",
  content: "Content AI",
  ats: "ATS AI",
};

const actionWords = /built|created|launched|led|designed|improved|analyzed|developed|managed|automated|shipped|tested|grew/gi;
const metricWords = /\b\d+%|\b\d+\+|\b\d+x\b|users|views|downloads|revenue|saved|increased|reduced|grew|hours|followers/gi;
const projectWords = /project|portfolio|built|created|launched|developed|shipped|prototype|case study/gi;
const skillWords = /javascript|typescript|python|react|next\.?js|node|html|css|sql|excel|figma|canva|analytics|seo|copywriting|ai|machine learning|product design|research|communication/gi;

function clamp(value: number, min = 0, max = 100) {
  return Math.round(Math.min(max, Math.max(min, value)));
}

function cleanLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function countMatches(text: string, pattern: RegExp) {
  return (text.match(pattern) || []).length;
}

function detectName(lines: string[]) {
  const ignored = /linkedin|followers|connections|contact info|message|connect|follow|activity|posts|comments|reactions|profile/i;
  return lines.find((line) => line.length <= 56 && !ignored.test(line)) || "Profile owner";
}

function detectHeadline(lines: string[], name: string) {
  const index = lines.findIndex((line) => line === name);
  const candidates = index >= 0 ? lines.slice(index + 1, index + 6) : lines.slice(1, 6);
  const ignored = /about|experience|education|skills|projects|certifications|activity|posts/i;

  return candidates.find((line) => line.length > 8 && line.length < 170 && !ignored.test(line)) || "Headline not detected";
}

function extractFacts(text: string, lines: string[]) {
  const skills = new Set((text.match(skillWords) || []).map((item) => item.toLowerCase()));
  return {
    wordCount: text.split(/\s+/).filter(Boolean).length,
    lineCount: lines.length,
    bulletCount: (text.match(/(?:^|\n)\s*(?:[-*] )/g) || []).length,
    actionCount: countMatches(text, actionWords),
    metricCount: countMatches(text, metricWords),
    projectCount: countMatches(text, projectWords),
    skillCount: skills.size,
    hasAbout: /\babout\b|summary|bio|overview/i.test(text),
    hasExperience: /experience|internship|worked|company|role|position|employment|volunteer|freelance/i.test(text),
    hasEducation: /education|school|university|college|degree|class of|grade|gpa/i.test(text),
    hasProjects: /project|portfolio|built|created|launched|developed|shipped|prototype|case study/i.test(text),
    hasSkills: /skills|technologies|tools|programming|python|javascript|typescript|react|next\.?js|excel|figma|canva|sql/i.test(text),
  };
}

function scoreLabel(score: number) {
  if (score >= 90) return "Portfolio-ready";
  if (score >= 80) return "Strong";
  if (score >= 70) return "Promising";
  if (score >= 60) return "Needs focus";
  return "Needs rebuild";
}

function scoreTone(score: number): Tone {
  if (score >= 88) return "elite";
  if (score >= 75) return "strong";
  if (score >= 60) return "warning";
  return "danger";
}

function buildCategoryScores(text: string, headline: string, role: TargetRole): CategoryScore[] {
  const lines = cleanLines(text);
  const facts = extractFacts(text, lines);
  const headlineHasRole = /student|founder|developer|engineer|designer|marketer|analyst|builder|manager|creator|intern/i.test(headline);
  const headlineHasFocus = /ai|web|product|data|design|marketing|growth|automation|software|startup|education/i.test(headline);
  const roleBoost = role === "developer" || role === "student-builder" ? 6 : role === "founder" ? 4 : 0;

  return [
    {
      key: "headline",
      label: "Headline clarity",
      score: clamp((headline === "Headline not detected" ? 20 : 44) + (headlineHasRole ? 20 : 0) + (headlineHasFocus ? 18 : 0) + (headline.length > 48 ? 10 : 0)),
      detail: headline === "Headline not detected" ? "No clear headline was detected." : `Detected: ${headline}`,
      fix: "Make the headline role + niche + proof, not a generic title.",
    },
    {
      key: "story",
      label: "Professional story",
      score: clamp((facts.hasAbout ? 38 : 12) + (facts.wordCount >= 120 ? 20 : 0) + Math.min(22, facts.actionCount * 4) + (facts.hasProjects ? 12 : 0)),
      detail: facts.hasAbout ? "The profile has narrative space." : "The profile needs a stronger About section.",
      fix: "Use 4-6 lines: what you build, what skills you use, what proof backs it up.",
    },
    {
      key: "proof",
      label: "Proof and metrics",
      score: clamp(22 + Math.min(40, facts.metricCount * 14) + Math.min(20, facts.actionCount * 3) + (facts.bulletCount >= 3 ? 12 : 0)),
      detail: facts.metricCount > 0 ? `Found ${facts.metricCount} measurable proof signals.` : "The profile needs more numbers and outcomes.",
      fix: "Add numbers: users, hours saved, views, features shipped, growth, or accuracy.",
    },
    {
      key: "projects",
      label: "Project signal",
      score: clamp((facts.hasProjects ? 48 : 14) + Math.min(26, facts.projectCount * 5) + roleBoost),
      detail: facts.projectCount > 0 ? `Found ${facts.projectCount} project signals.` : "Project work is not visible enough.",
      fix: "Add 2-3 projects with problem, features, tech stack, result, and link.",
    },
    {
      key: "skills",
      label: "Skill match",
      score: clamp((facts.hasSkills ? 40 : 16) + Math.min(34, facts.skillCount * 6) + (role === "developer" ? 6 : 0)),
      detail: facts.skillCount > 0 ? `Detected ${facts.skillCount} skill signals.` : "Few concrete tools or skills were detected.",
      fix: "Group skills by tools, domain, and communication.",
    },
    {
      key: "scan",
      label: "Scanability",
      score: clamp(38 + (facts.lineCount >= 8 ? 16 : 0) + (facts.bulletCount >= 3 ? 18 : 0) + (facts.wordCount >= 120 && facts.wordCount <= 600 ? 16 : 0)),
      detail: facts.bulletCount >= 3 ? "The profile has scannable bullet structure." : "The profile would scan better with short bullets.",
      fix: "Use short sections, compact bullets, and one idea per line.",
    },
  ];
}

function overallScore(categories: CategoryScore[]) {
  return clamp(categories.reduce((sum, item) => sum + item.score, 0) / categories.length);
}

function reviewerScore(baseScore: number, offset: number) {
  return clamp(baseScore + offset);
}

function buildFallbackReview(text: string, role: TargetRole, mode: ReviewMode): AiReview {
  const lines = cleanLines(text);
  const name = detectName(lines);
  const headline = detectHeadline(lines, name);
  const categories = buildCategoryScores(text, headline, role);
  const score = overallScore(categories);
  const weakest = categories.slice().sort((a, b) => a.score - b.score).slice(0, 3);
  const strongest = categories.slice().sort((a, b) => b.score - a.score).slice(0, 3);
  const roleLabel = roleLabels[role];

  const reviewers: Reviewer[] = [
    {
      id: "recruiter",
      name: "Recruiter AI",
      score: reviewerScore(score, -2),
      verdict: `${name} has a usable profile foundation, but recruiters need faster proof of role fit.`,
      strengths: strongest.map((item) => item.detail),
      fixes: weakest.map((item) => item.fix),
      rewrite: `${roleLabel} | Practical Projects | ${strongest[0]?.label || "Clear Proof"}`,
    },
    {
      id: "builder",
      name: "Portfolio AI",
      score: reviewerScore(score, 3),
      verdict: "The best portfolio move is to make shipped projects the center of the story.",
      strengths: ["Project work can become the main proof point.", "The profile can be positioned as a builder portfolio, not just a resume."],
      fixes: ["Add project links and measurable outcomes.", "Turn this analyzer into a featured LinkedIn project."],
      rewrite: "Featured project: Built Profile Lens, an AI-assisted LinkedIn reviewer that scores profile strength and generates role-specific improvements.",
    },
    {
      id: "content",
      name: "Content AI",
      score: reviewerScore(score, -1),
      verdict: "The wording should sound more specific, less generic, and more outcome-focused.",
      strengths: ["The profile has enough raw material for a stronger narrative."],
      fixes: ["Replace vague phrases with specific skills, shipped work, and results.", "Use a tighter About section with 3 short paragraphs."],
      rewrite: `I am a ${roleLabel.toLowerCase()} building practical AI and web tools. I learn by shipping projects, testing ideas quickly, and turning rough concepts into usable demos.`,
    },
    {
      id: "ats",
      name: "ATS AI",
      score: reviewerScore(score, -4),
      verdict: "The profile should include more searchable role keywords and tool names.",
      strengths: ["Core skills are visible enough to start matching searches."],
      fixes: ["Add exact target-role keywords.", "List tools and technologies in a clean skills section."],
      rewrite: "Skills: React, Next.js, TypeScript, AI tools, product design, research, communication, project delivery.",
    },
  ];

  return {
    summary: `This is a ${scoreLabel(score).toLowerCase()} ${roleLabel.toLowerCase()} profile. The next upgrades should focus on ${weakest.map((item) => item.label.toLowerCase()).join(", ")}.`,
    headlineRewrite: headline === "Headline not detected" ? `${roleLabel} | AI Web Projects | Shipping Practical Tools` : `${headline} | Projects, Proof, Results`,
    aboutRewrite: `I am a ${roleLabel.toLowerCase()} building practical projects that turn ideas into useful tools. My work focuses on clear interfaces, fast iteration, and visible proof through shipped demos.`,
    projectRewrite: "Built Profile Lens, an AI-assisted LinkedIn profile reviewer that scores profile strength, compares specialist reviewer perspectives, and generates priority fixes.",
    positioningStatement: `${name} should be positioned as a ${roleLabel.toLowerCase()} with visible project proof and clearer outcomes.`,
    quickWins: weakest.map((item) => item.fix),
    reviewers: mode === "board" ? reviewers : reviewers.filter((reviewer) => reviewer.id === mode),
    websiteIdeas: [
      "AI profile rewrite generator for headline, About, and project bullets.",
      "Job-description matcher that scores how well a profile fits a target role.",
      "Before and after report view with shareable public links.",
      "Multi-profile comparison dashboard for recruiters or students.",
      "Resume import that turns a resume into LinkedIn-ready sections.",
      "Saved analysis history with progress tracking over time.",
      "Portfolio project generator that writes LinkedIn project entries from app details.",
      "Chrome extension that analyzes a profile while viewing LinkedIn.",
    ],
  };
}

function stripCodeFence(text: string) {
  return text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
}

function extractOutputText(payload: unknown): string {
  const data = payload as { output_text?: unknown; output?: Array<{ content?: Array<Record<string, unknown>> }> };
  if (typeof data.output_text === "string") return data.output_text;

  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") return content.text;
      if (typeof content.output_text === "string") return content.output_text;
    }
  }

  return "";
}

function asStringArray(value: unknown, fallback: string[]) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 8) : fallback;
}

function normalizeReviewer(value: unknown, fallback: Reviewer): Reviewer {
  const item = (value || {}) as Partial<Reviewer>;
  return {
    id: fallback.id,
    name: typeof item.name === "string" ? item.name : fallback.name,
    score: typeof item.score === "number" ? clamp(item.score) : fallback.score,
    verdict: typeof item.verdict === "string" ? item.verdict : fallback.verdict,
    strengths: asStringArray(item.strengths, fallback.strengths),
    fixes: asStringArray(item.fixes, fallback.fixes),
    rewrite: typeof item.rewrite === "string" ? item.rewrite : fallback.rewrite,
  };
}

function normalizeAiReview(value: unknown, fallback: AiReview, mode: ReviewMode): AiReview {
  const data = (value || {}) as Partial<AiReview>;
  const fallbackById = new Map(fallback.reviewers.map((reviewer) => [reviewer.id, reviewer]));
  const incomingReviewers = Array.isArray(data.reviewers) ? data.reviewers : [];
  const normalizedReviewers = fallback.reviewers.map((fallbackReviewer) => {
    const incoming = incomingReviewers.find((reviewer) => (reviewer as Partial<Reviewer>)?.id === fallbackReviewer.id);
    return normalizeReviewer(incoming, fallbackReviewer);
  });

  return {
    summary: typeof data.summary === "string" ? data.summary : fallback.summary,
    headlineRewrite: typeof data.headlineRewrite === "string" ? data.headlineRewrite : fallback.headlineRewrite,
    aboutRewrite: typeof data.aboutRewrite === "string" ? data.aboutRewrite : fallback.aboutRewrite,
    projectRewrite: typeof data.projectRewrite === "string" ? data.projectRewrite : fallback.projectRewrite,
    positioningStatement: typeof data.positioningStatement === "string" ? data.positioningStatement : fallback.positioningStatement,
    quickWins: asStringArray(data.quickWins, fallback.quickWins),
    websiteIdeas: asStringArray(data.websiteIdeas, fallback.websiteIdeas),
    reviewers: mode === "board" ? normalizedReviewers : normalizedReviewers.filter((reviewer) => fallbackById.has(reviewer.id) && reviewer.id === mode),
  };
}

async function callOpenAI(profileText: string, role: TargetRole, mode: ReviewMode, fallback: AiReview) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL || "gpt-5.4";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "developer",
          content:
            "You are Profile Lens, a concise LinkedIn profile review board. Return valid JSON only. Be specific, practical, and portfolio-focused. Do not include markdown fences.",
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "Review this LinkedIn profile from multiple specialist perspectives.",
            targetRole: roleLabels[role],
            reviewMode: reviewModes[mode],
            requiredJsonShape: {
              summary: "string",
              headlineRewrite: "string",
              aboutRewrite: "string",
              projectRewrite: "string",
              positioningStatement: "string",
              quickWins: ["string"],
              websiteIdeas: ["string"],
              reviewers: [
                {
                  id: "recruiter | builder | content | ats",
                  name: "string",
                  score: "number 0-100",
                  verdict: "string",
                  strengths: ["string"],
                  fixes: ["string"],
                  rewrite: "string",
                },
              ],
            },
            profileText,
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const text = extractOutputText(payload);
  if (!text) throw new Error("OpenAI response did not include text output.");

  return {
    model,
    review: normalizeAiReview(JSON.parse(stripCodeFence(text)), fallback, mode),
  };
}

export async function POST(request: Request) {
  let body: { profileText?: string; targetRole?: unknown; reviewMode?: unknown };

  try {
    body = (await request.json()) as { profileText?: string; targetRole?: unknown; reviewMode?: unknown };
  } catch {
    return NextResponse.json({ error: "Valid JSON is required." }, { status: 400 });
  }

  const profileText = body.profileText?.trim();
  if (!profileText) {
    return NextResponse.json({ error: "Profile text is required." }, { status: 400 });
  }

  const targetRole: TargetRole = typeof body.targetRole === "string" && body.targetRole in roleLabels ? (body.targetRole as TargetRole) : "student-builder";
  const reviewMode: ReviewMode = typeof body.reviewMode === "string" && body.reviewMode in reviewModes ? (body.reviewMode as ReviewMode) : "board";
  const lines = cleanLines(profileText);
  const name = detectName(lines);
  const headline = detectHeadline(lines, name);
  const categoryScores = buildCategoryScores(profileText, headline, targetRole);
  const score = overallScore(categoryScores);
  const fallback = buildFallbackReview(profileText, targetRole, reviewMode);

  let aiResult: Awaited<ReturnType<typeof callOpenAI>> = null;
  let setupMessage: string | undefined;

  try {
    aiResult = await callOpenAI(profileText, targetRole, reviewMode, fallback);
    if (!aiResult) {
      setupMessage = "Add OPENAI_API_KEY in local or Vercel environment variables to enable live OpenAI feedback.";
    }
  } catch (error) {
    setupMessage = error instanceof Error ? error.message : "OpenAI review failed. Using local fallback feedback.";
  }

  const review = aiResult?.review || fallback;

  return NextResponse.json({
    aiPowered: Boolean(aiResult),
    model: aiResult?.model || "local-review-fallback",
    setupMessage,
    name,
    headline,
    targetRole,
    targetRoleLabel: roleLabels[targetRole],
    reviewMode,
    reviewModeLabel: reviewModes[reviewMode],
    overallScore: score,
    scoreLabel: scoreLabel(score),
    scoreTone: scoreTone(score),
    categoryScores,
    summary: review.summary,
    headlineRewrite: review.headlineRewrite,
    aboutRewrite: review.aboutRewrite,
    projectRewrite: review.projectRewrite,
    positioningStatement: review.positioningStatement,
    quickWins: review.quickWins,
    reviewers: review.reviewers,
    websiteIdeas: review.websiteIdeas,
  });
}
