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

const sectionPatterns: Array<{
  key: SectionKey;
  label: string;
  pattern: RegExp;
}> = [
  { key: "headline", label: "Headline", pattern: /headline|student|founder|developer|engineer|designer|manager|analyst|creator|intern/i },
  { key: "about", label: "About", pattern: /\babout\b|summary|bio/i },
  { key: "experience", label: "Experience", pattern: /experience|internship|worked|company|role|position|employment/i },
  { key: "education", label: "Education", pattern: /education|school|university|college|degree|class of|grade/i },
  { key: "skills", label: "Skills", pattern: /skills|technologies|tools|programming|python|javascript|react|excel|figma/i },
  { key: "projects", label: "Projects", pattern: /project|portfolio|built|created|launched|developed/i },
  { key: "certifications", label: "Certifications", pattern: /certification|certificate|course|license/i },
  { key: "metrics", label: "Metrics", pattern: /\b\d+%|\b\d+\+|increased|reduced|grew|saved|users|revenue|views|downloads/i },
];

function cleanLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function detectName(lines: string[]) {
  const ignored = /linkedin|followers|connections|contact info|message|connect|follow/i;
  return lines.find((line) => line.length <= 56 && !ignored.test(line)) || "Profile owner";
}

function detectHeadline(lines: string[], name: string) {
  const index = lines.findIndex((line) => line === name);
  const candidates = index >= 0 ? lines.slice(index + 1, index + 5) : lines.slice(1, 5);
  return candidates.find((line) => line.length > 8 && line.length < 150) || "Headline not detected";
}

function detectSections(text: string): Section[] {
  return sectionPatterns.map((section) => ({
    key: section.key,
    label: section.label,
    found: section.pattern.test(text),
  }));
}

function extractFacts(text: string, lines: string[]) {
  return {
    wordCount: text.split(/\s+/).filter(Boolean).length,
    bulletCount: (text.match(/(?:^|\n)\s*(?:[-*] )/g) || []).length,
    projectMentions: (text.match(/project|built|created|launched|developed/gi) || []).length,
    metricMentions: (text.match(/\b\d+%|\b\d+\+|users|views|downloads|revenue|saved|increased|reduced/gi) || []).length,
    actionWords: (text.match(/built|created|launched|led|designed|improved|analyzed|developed|managed|automated/gi) || []).length,
    lineCount: lines.length,
  };
}

function buildStrengths(sections: Section[], facts: ReturnType<typeof extractFacts>, headline: string) {
  const found = new Set(sections.filter((section) => section.found).map((section) => section.key));
  const strengths: string[] = [];

  if (headline !== "Headline not detected") {
    strengths.push("The profile has a visible headline, which gives visitors an immediate first impression.");
  }
  if (found.has("about")) {
    strengths.push("An About section appears to be present, so the profile has space for a personal narrative.");
  }
  if (found.has("projects")) {
    strengths.push("Project work is mentioned, which is useful for proving ability beyond job titles.");
  }
  if (found.has("skills")) {
    strengths.push("Skills or tools are listed, helping recruiters and collaborators understand the profile quickly.");
  }
  if (facts.actionWords >= 4) {
    strengths.push("The writing uses action verbs, which makes the profile feel more active and achievement-focused.");
  }
  if (facts.metricMentions > 0) {
    strengths.push("There are measurable details, which make claims more credible.");
  }

  return strengths.length ? strengths : ["The profile has enough text to begin shaping a clearer professional story."];
}

function buildGaps(sections: Section[], facts: ReturnType<typeof extractFacts>, headline: string) {
  const found = new Set(sections.filter((section) => section.found).map((section) => section.key));
  const gaps: string[] = [];

  if (headline === "Headline not detected" || headline.length < 24) {
    gaps.push("The headline looks weak or missing; it should state role, direction, and one proof point.");
  }
  if (!found.has("about")) {
    gaps.push("The About section was not detected; this is the best place to explain goals, strengths, and current work.");
  }
  if (!found.has("projects")) {
    gaps.push("Projects were not detected; adding 2-3 concrete projects would make the profile stronger.");
  }
  if (!found.has("skills")) {
    gaps.push("Skills were not detected; add technical tools and soft skills that match the target role.");
  }
  if (facts.metricMentions === 0) {
    gaps.push("The profile does not show measurable outcomes; add numbers such as users, time saved, accuracy, views, or growth.");
  }
  if (facts.wordCount < 90) {
    gaps.push("The profile text is short; it may not give enough context for a visitor to understand the person.");
  }

  return gaps.length ? gaps : ["No major missing sections were detected. The next step is polishing wording and evidence."];
}

function buildActions(sections: Section[], facts: ReturnType<typeof extractFacts>) {
  const found = new Set(sections.filter((section) => section.found).map((section) => section.key));
  const actions = [
    "Rewrite the headline as: role or target + niche + proof. Example: Student Builder | AI Web Apps | Shipping Practical Tools.",
  ];

  if (!found.has("about") || facts.wordCount < 150) {
    actions.push("Write an About section with three short parts: what you build, what skills you use, and what project proves it.");
  }
  if (!found.has("projects")) {
    actions.push("Add this app as a project with problem, features, tech stack, and what you learned.");
  } else {
    actions.push("For each project, add the tech stack, your role, and a result or clear user benefit.");
  }
  if (facts.metricMentions === 0) {
    actions.push("Add at least one measurable result, even if it is simple: pages built, features shipped, profiles analyzed, or load time improved.");
  }
  if (!found.has("certifications")) {
    actions.push("Add one relevant course or certificate only if it supports the direction of the profile.");
  }

  return actions;
}

function buildRewriteIdeas(name: string, headline: string, sections: Section[]) {
  const hasProjects = sections.some((section) => section.key === "projects" && section.found);
  const baseName = name === "Profile owner" ? "I" : name;
  const introSubject = name === "Profile owner" ? "I am" : `${baseName} is`;

  return [
    headline === "Headline not detected" ? "Student Builder | AI Tools | Web App Projects" : headline,
    `${introSubject} building practical AI and web projects that turn rough ideas into usable tools.`,
    hasProjects
      ? "Project description: Built a LinkedIn profile analyzer that extracts visible profile sections, identifies strengths and gaps, and recommends concrete improvements."
      : "Project to add: Build a LinkedIn profile analyzer and describe the problem, features, tech stack, and future improvements.",
  ];
}

export async function POST(request: Request) {
  const body = (await request.json()) as { profileText?: string; profileUrl?: string };
  const text = body.profileText?.trim();

  if (!text) {
    return NextResponse.json({ error: "Profile text is required." }, { status: 400 });
  }

  const lines = cleanLines(text);
  const name = detectName(lines);
  const headline = detectHeadline(lines, name);
  const sections = detectSections(text);
  const facts = extractFacts(text, lines);

  return NextResponse.json({
    name,
    headline,
    sections,
    strengths: buildStrengths(sections, facts, headline),
    gaps: buildGaps(sections, facts, headline),
    actions: buildActions(sections, facts),
    rewriteIdeas: buildRewriteIdeas(name, headline, sections),
    source: body.profileUrl?.trim()
      ? `LinkedIn URL saved for reference: ${body.profileUrl.trim()}`
      : "Profile text analyzed on the server.",
  });
}
