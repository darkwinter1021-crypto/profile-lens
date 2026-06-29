import { NextResponse } from "next/server";

type SectionKey =
  | "headline"
  | "about"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "metrics";

type Section = {
  key: SectionKey;
  label: string;
  found: boolean;
};

type CategoryKey =
  | "headline"
  | "about"
  | "experience"
  | "projects"
  | "skills"
  | "proof"
  | "readability"
  | "clarity";

type CategoryScore = {
  key: CategoryKey;
  label: string;
  score: number;
  detail: string;
  fix: string;
};

type Insight = {
  title: string;
  body: string;
  impact: "High impact" | "Quick fix" | "Nice to have";
};

const roleLabels = {
  "student-builder": "Student Builder",
  developer: "Developer",
  founder: "Founder",
  designer: "Designer",
  marketer: "Marketer",
  general: "General",
} as const;

type TargetRole = keyof typeof roleLabels;

const sectionPatterns: Array<{
  key: SectionKey;
  label: string;
  pattern: RegExp;
}> = [
  {
    key: "headline",
    label: "Headline",
    pattern:
      /headline|student|founder|developer|engineer|designer|manager|analyst|creator|intern|builder|operator/i,
  },
  { key: "about", label: "About", pattern: /\babout\b|summary|bio|overview/i },
  {
    key: "experience",
    label: "Experience",
    pattern: /experience|internship|worked|company|role|position|employment|volunteer|freelance/i,
  },
  {
    key: "education",
    label: "Education",
    pattern: /education|school|university|college|degree|class of|grade|gpa/i,
  },
  {
    key: "skills",
    label: "Skills",
    pattern:
      /skills|technologies|tools|programming|python|javascript|typescript|react|next\.?js|excel|figma|canva|sql/i,
  },
  {
    key: "projects",
    label: "Projects",
    pattern: /project|portfolio|built|created|launched|developed|shipped|prototype|case study/i,
  },
  {
    key: "certifications",
    label: "Certifications",
    pattern: /certification|certificate|course|license|credential|bootcamp/i,
  },
  {
    key: "metrics",
    label: "Metrics",
    pattern:
      /\b\d+%|\b\d+\+|\b\d+x\b|increased|reduced|grew|saved|users|revenue|views|downloads|followers|hours/i,
  },
];

const baseWeights: Record<CategoryKey, number> = {
  headline: 0.16,
  about: 0.14,
  experience: 0.16,
  projects: 0.14,
  skills: 0.12,
  proof: 0.12,
  readability: 0.08,
  clarity: 0.08,
};

const roleWeights: Record<TargetRole, Partial<Record<CategoryKey, number>>> = {
  "student-builder": {
    about: 0.16,
    experience: 0.12,
    projects: 0.2,
    skills: 0.14,
    proof: 0.1,
  },
  developer: {
    experience: 0.15,
    projects: 0.2,
    skills: 0.17,
    proof: 0.13,
    clarity: 0.07,
  },
  founder: {
    headline: 0.18,
    about: 0.17,
    experience: 0.13,
    proof: 0.16,
    clarity: 0.1,
  },
  designer: {
    headline: 0.15,
    about: 0.14,
    projects: 0.19,
    skills: 0.14,
    proof: 0.13,
  },
  marketer: {
    headline: 0.16,
    about: 0.14,
    experience: 0.14,
    proof: 0.18,
    clarity: 0.1,
  },
  general: {},
};

function isTargetRole(value: unknown): value is TargetRole {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(roleLabels, value);
}

function clamp(value: number, min = 0, max = 100) {
  return Math.round(Math.min(max, Math.max(min, value)));
}

function cleanLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function detectName(lines: string[]) {
  const ignored =
    /linkedin|followers|connections|contact info|message|connect|follow|activity|posts|comments|reactions|profile/i;
  return lines.find((line) => line.length <= 56 && !ignored.test(line)) || "Profile owner";
}

function detectHeadline(lines: string[], name: string) {
  const index = lines.findIndex((line) => line === name);
  const candidates = index >= 0 ? lines.slice(index + 1, index + 6) : lines.slice(1, 6);
  const ignored = /about|experience|education|skills|projects|certifications|activity|posts/i;

  return (
    candidates.find((line) => line.length > 8 && line.length < 170 && !ignored.test(line)) ||
    "Headline not detected"
  );
}

function detectSections(text: string): Section[] {
  return sectionPatterns.map((section) => ({
    key: section.key,
    label: section.label,
    found: section.pattern.test(text),
  }));
}

function extractFacts(text: string, lines: string[]) {
  const words = text.split(/\s+/).filter(Boolean);
  const uniqueSkills = new Set(
    (text.match(
      /javascript|typescript|python|react|next\.?js|node|html|css|sql|excel|figma|canva|analytics|seo|copywriting|ai|machine learning|product design|research|communication/gi,
    ) || []).map((item) => item.toLowerCase()),
  );

  return {
    wordCount: words.length,
    bulletCount: (text.match(/(?:^|\n)\s*(?:[-*] )/g) || []).length,
    projectMentions: (text.match(/project|portfolio|built|created|launched|developed|shipped|prototype|case study/gi) || [])
      .length,
    metricMentions:
      (text.match(/\b\d+%|\b\d+\+|\b\d+x\b|users|views|downloads|revenue|saved|increased|reduced|grew|hours|followers/gi) ||
        []).length,
    actionWords:
      (text.match(/built|created|launched|led|designed|improved|analyzed|developed|managed|automated|shipped|tested|grew/gi) ||
        []).length,
    skillCount: uniqueSkills.size,
    linkCount: (text.match(/https?:\/\/|www\./gi) || []).length,
    lineCount: lines.length,
  };
}

function sectionSet(sections: Section[]) {
  return new Set(sections.filter((section) => section.found).map((section) => section.key));
}

function scoreLabel(score: number) {
  if (score >= 90) return "Portfolio-ready";
  if (score >= 80) return "Strong";
  if (score >= 70) return "Promising";
  if (score >= 60) return "Needs focus";
  return "Needs rebuild";
}

function scoreTone(score: number): "elite" | "strong" | "warning" | "danger" {
  if (score >= 88) return "elite";
  if (score >= 75) return "strong";
  if (score >= 60) return "warning";
  return "danger";
}

function buildCategoryScores(
  sections: Section[],
  facts: ReturnType<typeof extractFacts>,
  headline: string,
  role: TargetRole,
): CategoryScore[] {
  const found = sectionSet(sections);
  const headlineHasRole = /student|founder|developer|engineer|designer|marketer|analyst|builder|manager|creator|intern/i.test(
    headline,
  );
  const headlineHasFocus = /ai|web|product|data|design|marketing|growth|automation|software|startup|education/i.test(
    headline,
  );
  const headlineHasStructure = /[|/-]/.test(headline);
  const completeSections = sections.filter((section) => section.found).length;

  const headlineScore = clamp(
    (headline === "Headline not detected" ? 18 : 38) +
      (headline.length >= 28 ? 18 : 0) +
      (headline.length >= 52 ? 10 : 0) +
      (headlineHasRole ? 16 : 0) +
      (headlineHasFocus ? 12 : 0) +
      (headlineHasStructure ? 6 : 0),
  );

  const aboutScore = clamp(
    (found.has("about") ? 44 : 16) +
      (facts.wordCount >= 120 ? 18 : 0) +
      (facts.actionWords >= 3 ? 12 : 0) +
      (facts.projectMentions >= 1 ? 12 : 0) +
      (facts.metricMentions >= 1 ? 10 : 0),
  );

  const experienceScore = clamp(
    (found.has("experience") ? 42 : 18) +
      Math.min(22, facts.actionWords * 4) +
      (facts.metricMentions >= 1 ? 14 : 0) +
      (facts.bulletCount >= 3 ? 10 : 0) +
      (facts.wordCount >= 180 ? 8 : 0),
  );

  const projectScore = clamp(
    (found.has("projects") ? 48 : 14) +
      Math.min(22, facts.projectMentions * 5) +
      (facts.linkCount >= 1 ? 10 : 0) +
      (facts.metricMentions >= 1 ? 10 : 0) +
      (role === "developer" || role === "student-builder" || role === "designer" ? 6 : 0),
  );

  const skillScore = clamp(
    (found.has("skills") ? 42 : 18) +
      Math.min(28, facts.skillCount * 6) +
      (facts.wordCount >= 120 ? 10 : 0) +
      (role === "developer" && facts.skillCount >= 4 ? 8 : 0),
  );

  const proofScore = clamp(
    22 +
      Math.min(36, facts.metricMentions * 12) +
      Math.min(18, facts.actionWords * 3) +
      (found.has("certifications") ? 8 : 0) +
      (facts.linkCount >= 1 ? 8 : 0),
  );

  const readabilityScore = clamp(
    42 +
      (facts.lineCount >= 8 ? 14 : 0) +
      (facts.bulletCount >= 3 ? 14 : 0) +
      (facts.wordCount >= 120 && facts.wordCount <= 550 ? 18 : 0) +
      (facts.wordCount > 700 ? -12 : 0),
  );

  const clarityScore = clamp(
    18 +
      completeSections * 8 +
      (found.has("headline") ? 8 : 0) +
      (found.has("about") && found.has("projects") ? 12 : 0) +
      (facts.metricMentions >= 1 ? 6 : 0),
  );

  return [
    {
      key: "headline",
      label: "Headline",
      score: headlineScore,
      detail: headline === "Headline not detected" ? "No clear headline was detected." : `Detected: ${headline}`,
      fix: "Use role + niche + proof. Example: Student Builder | AI Web Apps | Shipping Practical Tools.",
    },
    {
      key: "about",
      label: "About Story",
      score: aboutScore,
      detail: found.has("about") ? "The profile appears to include an About section." : "The About section was not detected.",
      fix: "Write 4-6 lines covering what you build, what tools you use, and one project that proves it.",
    },
    {
      key: "experience",
      label: "Experience",
      score: experienceScore,
      detail:
        facts.actionWords >= 3
          ? `Uses ${facts.actionWords} action-oriented signals.`
          : "Needs more action verbs tied to actual work.",
      fix: "Rewrite experience bullets as action + method + result.",
    },
    {
      key: "projects",
      label: "Projects",
      score: projectScore,
      detail:
        facts.projectMentions > 0
          ? `Found ${facts.projectMentions} project-related signals.`
          : "No strong project signal was detected.",
      fix: "Add 2-3 projects with problem, features, tech stack, result, and link.",
    },
    {
      key: "skills",
      label: "Skills Match",
      score: skillScore,
      detail:
        facts.skillCount > 0
          ? `Detected ${facts.skillCount} distinct skill or tool signals.`
          : "Few specific skills were detected.",
      fix: "Group skills by tools, domain, and communication so the profile is easy to scan.",
    },
    {
      key: "proof",
      label: "Proof",
      score: proofScore,
      detail:
        facts.metricMentions > 0
          ? `Found ${facts.metricMentions} measurable proof signals.`
          : "The profile needs numbers or visible outcomes.",
      fix: "Add numbers such as users, views, hours saved, features shipped, or profiles analyzed.",
    },
    {
      key: "readability",
      label: "Readability",
      score: readabilityScore,
      detail:
        facts.bulletCount >= 3
          ? "The text has scannable bullet-style structure."
          : "The profile would scan better with short bullets.",
      fix: "Use short sections, compact bullets, and one idea per line.",
    },
    {
      key: "clarity",
      label: "Completeness",
      score: clarityScore,
      detail: `${completeSections} of ${sections.length} key profile signals were detected.`,
      fix: "Make sure headline, about, projects, skills, education, and proof are all visible.",
    },
  ];
}

function weightedOverall(categoryScores: CategoryScore[], role: TargetRole) {
  const weights = { ...baseWeights, ...roleWeights[role] };
  const total = categoryScores.reduce((sum, item) => sum + (weights[item.key] || 0), 0);
  const weighted = categoryScores.reduce((sum, item) => sum + item.score * (weights[item.key] || 0), 0);

  return clamp(total > 0 ? weighted / total : 0);
}

function buildStrengths(categoryScores: CategoryScore[], sections: Section[], facts: ReturnType<typeof extractFacts>) {
  const strengths: Insight[] = [];
  const found = sectionSet(sections);
  const topScores = categoryScores.filter((item) => item.score >= 72).sort((a, b) => b.score - a.score);

  for (const item of topScores.slice(0, 3)) {
    strengths.push({
      title: `${item.label} is working`,
      body: item.detail,
      impact: item.score >= 84 ? "High impact" : "Quick fix",
    });
  }

  if (found.has("projects")) {
    strengths.push({
      title: "Project signal is visible",
      body: "Project work helps the profile prove ability beyond titles, grades, or claims.",
      impact: "High impact",
    });
  }

  if (facts.metricMentions > 0) {
    strengths.push({
      title: "Uses measurable proof",
      body: "Numbers make the profile more credible and easier to compare.",
      impact: "High impact",
    });
  }

  return strengths.length
    ? strengths.slice(0, 4)
    : [
        {
          title: "Enough context to improve",
          body: "The pasted text gives enough signal to start shaping a clearer professional story.",
          impact: "Quick fix",
        },
      ];
}

function buildWeaknesses(categoryScores: CategoryScore[]) {
  return categoryScores
    .filter((item) => item.score < 68)
    .sort((a, b) => a.score - b.score)
    .slice(0, 4)
    .map<Insight>((item) => ({
      title: `${item.label} needs work`,
      body: item.detail,
      impact: item.score < 50 ? "High impact" : "Quick fix",
    }));
}

function buildPriorityFixes(categoryScores: CategoryScore[], role: TargetRole) {
  const weights = { ...baseWeights, ...roleWeights[role] };
  const priority = categoryScores
    .slice()
    .sort((a, b) => (weights[b.key] || 0) * (100 - b.score) - (weights[a.key] || 0) * (100 - a.score))
    .slice(0, 5);

  return priority.map<Insight>((item) => ({
    title: `Improve ${item.label}`,
    body: item.fix,
    impact: item.score < 65 ? "High impact" : "Quick fix",
  }));
}

function buildRewriteIdeas(name: string, headline: string, sections: Section[], role: TargetRole) {
  const found = sectionSet(sections);
  const roleLabel = roleLabels[role];
  const subject = name === "Profile owner" ? "I am" : `${name} is`;

  return [
    headline === "Headline not detected"
      ? `${roleLabel} | AI and Web Projects | Building Practical Tools`
      : `${headline} | Projects, Proof, and Clear Results`,
    `${subject} building practical projects that turn rough ideas into usable tools, with a focus on learning fast and shipping polished work.`,
    found.has("projects")
      ? "Project bullet: Built a LinkedIn profile analyzer that detects key sections, scores profile strength, reviews photo readiness, and recommends concrete improvements."
      : "Project to add: Build a LinkedIn profile analyzer, then describe the problem, features, tech stack, and what you learned.",
  ];
}

function buildSnapshot(
  name: string,
  headline: string,
  sections: Section[],
  facts: ReturnType<typeof extractFacts>,
  role: TargetRole,
  overallScore: number,
) {
  const detected = sections.filter((section) => section.found).length;

  return {
    name,
    headline,
    targetRole: roleLabels[role],
    scoreSummary: `${scoreLabel(overallScore)} profile for ${roleLabels[role].toLowerCase()} positioning.`,
    stats: [
      { label: "Detected", value: `${detected}/${sections.length}` },
      { label: "Words", value: String(facts.wordCount) },
      { label: "Proof signals", value: String(facts.metricMentions) },
      { label: "Project signals", value: String(facts.projectMentions) },
    ],
  };
}

function buildLinkedInProjectDescription() {
  return [
    "Profile Lens - LinkedIn Profile Analyzer",
    "Built a modern Next.js and TypeScript app that analyzes pasted LinkedIn profile text, detects key sections, scores the profile by target role, and returns prioritized improvements.",
    "Added a browser-based image analyzer using canvas pixel checks for brightness, contrast, and sharpness so users can improve their profile photo presentation.",
    "Tech stack: Next.js App Router, React, TypeScript, CSS, server route handlers, browser Canvas API.",
  ].join("\n");
}

export async function POST(request: Request) {
  let body: { profileText?: string; profileUrl?: string; targetRole?: unknown };

  try {
    body = (await request.json()) as { profileText?: string; profileUrl?: string; targetRole?: unknown };
  } catch {
    return NextResponse.json({ error: "Valid JSON is required." }, { status: 400 });
  }

  const text = body.profileText?.trim();

  if (!text) {
    return NextResponse.json({ error: "Profile text is required." }, { status: 400 });
  }

  const targetRole: TargetRole = isTargetRole(body.targetRole) ? body.targetRole : "student-builder";
  const lines = cleanLines(text);
  const name = detectName(lines);
  const headline = detectHeadline(lines, name);
  const sections = detectSections(text);
  const facts = extractFacts(text, lines);
  const categoryScores = buildCategoryScores(sections, facts, headline, targetRole);
  const overallScore = weightedOverall(categoryScores, targetRole);
  const weaknesses = buildWeaknesses(categoryScores);
  const priorityFixes = buildPriorityFixes(categoryScores, targetRole);

  return NextResponse.json({
    name,
    headline,
    sections,
    overallScore,
    scoreLabel: scoreLabel(overallScore),
    scoreTone: scoreTone(overallScore),
    categoryScores,
    profileSnapshot: buildSnapshot(name, headline, sections, facts, targetRole, overallScore),
    strengths: buildStrengths(categoryScores, sections, facts),
    weaknesses,
    priorityFixes,
    gaps: weaknesses.map((item) => item.body),
    actions: priorityFixes.map((item) => item.body),
    rewriteIdeas: buildRewriteIdeas(name, headline, sections, targetRole),
    linkedinProjectDescription: buildLinkedInProjectDescription(),
    source: body.profileUrl?.trim()
      ? `LinkedIn URL saved for reference: ${body.profileUrl.trim()}`
      : "Profile text analyzed on the server.",
  });
}
