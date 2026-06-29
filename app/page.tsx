"use client";

import type { CSSProperties, FormEvent } from "react";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  Briefcase,
  CheckCircle2,
  Code2,
  Copy,
  Download,
  FileText,
  Gauge,
  GraduationCap,
  Layers,
  Lightbulb,
  Megaphone,
  PenTool,
  RefreshCw,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Users,
  Zap,
} from "lucide-react";

type TargetRole = "student-builder" | "developer" | "founder" | "designer" | "marketer" | "general";
type ReviewMode = "board" | "recruiter" | "builder" | "content" | "ats";
type ScoreTone = "elite" | "strong" | "warning" | "danger";

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

type AiReport = {
  aiPowered: boolean;
  model: string;
  setupMessage?: string;
  name: string;
  headline: string;
  targetRole: TargetRole;
  targetRoleLabel: string;
  reviewMode: ReviewMode;
  reviewModeLabel: string;
  overallScore: number;
  scoreLabel: string;
  scoreTone: ScoreTone;
  categoryScores: CategoryScore[];
  summary: string;
  headlineRewrite: string;
  aboutRewrite: string;
  projectRewrite: string;
  positioningStatement: string;
  quickWins: string[];
  reviewers: Reviewer[];
  websiteIdeas: string[];
};

const roles: Array<{ key: TargetRole; label: string; icon: LucideIcon }> = [
  { key: "student-builder", label: "Student", icon: GraduationCap },
  { key: "developer", label: "Developer", icon: Code2 },
  { key: "founder", label: "Founder", icon: Rocket },
  { key: "designer", label: "Designer", icon: PenTool },
  { key: "marketer", label: "Marketer", icon: Megaphone },
  { key: "general", label: "General", icon: UserRound },
];

const reviewModes: Array<{ key: ReviewMode; label: string; icon: LucideIcon }> = [
  { key: "board", label: "All AIs", icon: Users },
  { key: "recruiter", label: "Recruiter", icon: Briefcase },
  { key: "builder", label: "Portfolio", icon: Layers },
  { key: "content", label: "Content", icon: Sparkles },
  { key: "ats", label: "ATS", icon: Search },
];

const emptyCategories: CategoryScore[] = [
  "Headline clarity",
  "Professional story",
  "Proof and metrics",
  "Project signal",
  "Skill match",
  "Scanability",
].map((label) => ({
  key: label.toLowerCase().replace(/\s+/g, "-"),
  label,
  score: 0,
  detail: "Waiting for profile text.",
  fix: "Run the AI review to get a specific fix.",
}));

const defaultWebsiteIdeas = [
  "AI profile rewrite generator for headline, About, and project bullets.",
  "Job-description matcher that scores profile fit for a target role.",
  "Before and after report view with shareable public links.",
  "Multi-profile comparison dashboard for students or recruiters.",
  "Resume import that turns a resume into LinkedIn-ready sections.",
  "Saved analysis history with progress tracking over time.",
  "Portfolio project generator that writes LinkedIn project entries.",
  "Chrome extension that analyzes a profile while viewing LinkedIn.",
];

const emptyReport: AiReport = {
  aiPowered: false,
  model: "not-run",
  setupMessage: "Add profile text and run the AI review board.",
  name: "No profile analyzed",
  headline: "No headline detected yet.",
  targetRole: "student-builder",
  targetRoleLabel: "Student Builder",
  reviewMode: "board",
  reviewModeLabel: "Full AI review board",
  overallScore: 0,
  scoreLabel: "Waiting",
  scoreTone: "danger",
  categoryScores: emptyCategories,
  summary: "Paste a profile and run the review to get specialist feedback.",
  headlineRewrite: "Run the AI review to generate a stronger headline.",
  aboutRewrite: "Run the AI review to generate a better About section.",
  projectRewrite: "Run the AI review to generate a project entry.",
  positioningStatement: "Run the AI review to get positioning advice.",
  quickWins: ["Paste the visible LinkedIn profile text and choose a target role."],
  reviewers: [],
  websiteIdeas: defaultWebsiteIdeas,
};

const sampleProfile = `Ayush Sharma
Student Builder | AI Tools | Web Apps | Learning Product Design

About
I am a student interested in building useful AI products, web apps, and education tools. I enjoy turning rough ideas into working demos and learning by shipping projects. I focus on practical apps, clear interfaces, and fast iteration.

Experience
Founder-style project work
- Built 4 small tools for productivity, profile analysis, and video content.
- Created frontend flows using React, TypeScript, and prompt design.
- Improved project clarity by turning vague ideas into working demos within 1-2 days.

Projects
LinkedIn Profile Analyzer - A web app that reviews profile text, scores profile strength, identifies missing sections, and gives personalized improvements.
AI Image Analyzer - A browser tool that checks image brightness, contrast, sharpness, and professional presentation.

Education
High school student

Skills
HTML, CSS, JavaScript, TypeScript, React, Next.js, AI tools, product design, communication, research`;

function toneClass(tone: ScoreTone) {
  return `tone-${tone}`;
}

function reviewerIcon(id: Reviewer["id"]) {
  if (id === "recruiter") return Briefcase;
  if (id === "builder") return Layers;
  if (id === "content") return Sparkles;
  return ShieldCheck;
}

function formatReport(report: AiReport) {
  return [
    "Profile Lens AI Review",
    `Name: ${report.name}`,
    `Headline: ${report.headline}`,
    `Target role: ${report.targetRoleLabel}`,
    `Mode: ${report.reviewModeLabel}`,
    `Score: ${report.overallScore}/100 (${report.scoreLabel})`,
    `AI powered: ${report.aiPowered ? "Yes" : "Fallback mode"}`,
    `Model: ${report.model}`,
    "",
    "Summary:",
    report.summary,
    "",
    "Reviewer board:",
    ...report.reviewers.flatMap((reviewer) => [
      `- ${reviewer.name}: ${reviewer.score}/100`,
      `  Verdict: ${reviewer.verdict}`,
      `  Fixes: ${reviewer.fixes.join(" | ")}`,
    ]),
    "",
    "Quick wins:",
    ...report.quickWins.map((item) => `- ${item}`),
    "",
    "Rewrite output:",
    `Headline: ${report.headlineRewrite}`,
    `About: ${report.aboutRewrite}`,
    `Project: ${report.projectRewrite}`,
    "",
    "Website ideas:",
    ...report.websiteIdeas.map((item) => `- ${item}`),
  ].join("\n");
}

export default function Home() {
  const [profileText, setProfileText] = useState("");
  const [targetRole, setTargetRole] = useState<TargetRole>("student-builder");
  const [reviewMode, setReviewMode] = useState<ReviewMode>("board");
  const [report, setReport] = useState<AiReport>(emptyReport);
  const [status, setStatus] = useState("Ready");

  async function runReview(event?: FormEvent<HTMLFormElement>, overrideText?: string) {
    event?.preventDefault();
    const textToAnalyze = overrideText ?? profileText;

    if (!textToAnalyze.trim()) {
      setStatus("Needs text");
      return;
    }

    setStatus("Reviewing");

    try {
      const response = await fetch("/api/analyze-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileText: textToAnalyze, targetRole, reviewMode }),
      });

      if (!response.ok) {
        setStatus("Failed");
        return;
      }

      const nextReport = (await response.json()) as AiReport;
      setReport(nextReport);
      setStatus(nextReport.aiPowered ? "AI complete" : "Demo complete");
    } catch {
      setStatus("Failed");
    }
  }

  function loadSample() {
    setProfileText(sampleProfile);
    void runReview(undefined, sampleProfile);
  }

  function clearAll() {
    setProfileText("");
    setReport(emptyReport);
    setStatus("Ready");
  }

  async function copyText(text: string, nextStatus: string) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(nextStatus);
    } catch {
      setStatus("Copy failed");
    }
  }

  function downloadReport() {
    const blob = new Blob([formatReport(report)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `profile-lens-ai-${report.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "report"}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("Downloaded");
  }

  const scoreStyle = { "--score": report.overallScore } as CSSProperties;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">
            <Bot size={22} aria-hidden="true" />
          </div>
          <div>
            <p className="eyebrow">OpenAI-powered profile feedback</p>
            <h1>Profile Lens AI</h1>
          </div>
        </div>
        <div className="top-actions">
          <span className={`status-pill ${status.toLowerCase().replace(/\s+/g, "-")}`}>{status}</span>
          <button className="icon-button" type="button" onClick={() => void copyText(formatReport(report), "Copied")}> 
            <Copy size={17} aria-hidden="true" />
            <span>Copy</span>
          </button>
        </div>
      </header>

      <section className="workspace-grid ai-workspace">
        <form className="panel input-panel ai-input-panel" onSubmit={runReview}>
          <div className="panel-heading">
            <div>
              <p className="section-label">AI reviewer</p>
              <h2>Paste profile text</h2>
            </div>
            <button className="secondary-button compact-button" type="button" onClick={loadSample}>
              <Sparkles size={16} aria-hidden="true" />
              <span>Sample</span>
            </button>
          </div>

          <div className="selector-block">
            <p>Target role</p>
            <div className="role-selector" aria-label="Target role">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    className={`role-button ${targetRole === role.key ? "active" : ""}`}
                    key={role.key}
                    type="button"
                    onClick={() => setTargetRole(role.key)}
                  >
                    <Icon size={15} aria-hidden="true" />
                    <span>{role.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="selector-block">
            <p>Specialist AIs</p>
            <div className="mode-selector" aria-label="Review mode">
              {reviewModes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <button
                    className={`mode-button ${reviewMode === mode.key ? "active" : ""}`}
                    key={mode.key}
                    type="button"
                    onClick={() => setReviewMode(mode.key)}
                  >
                    <Icon size={15} aria-hidden="true" />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="field-label" htmlFor="profileText">
            <FileText size={15} aria-hidden="true" />
            LinkedIn profile text
          </label>
          <textarea
            id="profileText"
            rows={15}
            value={profileText}
            onChange={(event) => setProfileText(event.target.value)}
            placeholder="Paste the visible profile text: name, headline, About, experience, projects, education, skills, proof, and achievements."
          />

          <div className="button-row">
            <button className="primary-button" type="submit" disabled={status === "Reviewing"}>
              <Bot size={17} aria-hidden="true" />
              <span>Run AI review</span>
            </button>
            <button className="secondary-button" type="button" onClick={clearAll}>
              <RefreshCw size={16} aria-hidden="true" />
              <span>Clear</span>
            </button>
          </div>
        </form>

        <aside className="side-stack ai-side-stack">
          <section className={`panel score-panel ${toneClass(report.scoreTone)}`}>
            <div className="panel-heading">
              <div>
                <p className="section-label">Overall score</p>
                <h2>{report.scoreLabel}</h2>
              </div>
              <Gauge size={22} aria-hidden="true" />
            </div>

            <div className="score-hero">
              <div className="score-ring" style={scoreStyle}>
                <div>
                  <strong>{report.overallScore}</strong>
                  <span>/100</span>
                </div>
              </div>
              <div className="score-copy">
                <h3>{report.name}</h3>
                <p>{report.summary}</p>
              </div>
            </div>

            <div className="ai-status-box">
              <Zap size={16} aria-hidden="true" />
              <span>{report.aiPowered ? `Live OpenAI review using ${report.model}` : report.setupMessage}</span>
            </div>

            <div className="button-row tight-row">
              <button className="secondary-button" type="button" onClick={() => void copyText(formatReport(report), "Copied")}> 
                <Copy size={16} aria-hidden="true" />
                <span>Copy report</span>
              </button>
              <button className="secondary-button" type="button" onClick={downloadReport}>
                <Download size={16} aria-hidden="true" />
                <span>Download</span>
              </button>
            </div>
          </section>

          <section className="panel quick-panel">
            <div className="panel-heading compact-heading">
              <h2>Quick wins</h2>
              <Target size={20} aria-hidden="true" />
            </div>
            <div className="quick-list">
              {report.quickWins.map((item) => (
                <div className="quick-item" key={item}>
                  <CheckCircle2 size={15} aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className="results-layout">
        <section className="panel reviewer-panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">Multiple AIs</p>
              <h2>Specialist review board</h2>
            </div>
            <Users size={21} aria-hidden="true" />
          </div>

          <div className="reviewer-grid">
            {(report.reviewers.length ? report.reviewers : [
              {
                id: "recruiter" as const,
                name: "Recruiter AI",
                score: 0,
                verdict: "Run the review to get recruiter feedback.",
                strengths: ["Waiting for profile text."],
                fixes: ["Paste profile text and run the AI review."],
                rewrite: "Reviewer rewrite will appear here.",
              },
            ]).map((reviewer) => {
              const Icon = reviewerIcon(reviewer.id);
              return (
                <article className="reviewer-card" key={reviewer.id}>
                  <div className="reviewer-head">
                    <div className="reviewer-icon">
                      <Icon size={18} aria-hidden="true" />
                    </div>
                    <div>
                      <h3>{reviewer.name}</h3>
                      <p>{reviewer.score}/100</p>
                    </div>
                  </div>
                  <p className="verdict">{reviewer.verdict}</p>
                  <div className="mini-columns">
                    <div>
                      <strong>Strengths</strong>
                      <ul>
                        {reviewer.strengths.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong>Fixes</strong>
                      <ul>
                        {reviewer.fixes.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="rewrite-card">
                    <Lightbulb size={16} aria-hidden="true" />
                    <span>{reviewer.rewrite}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="panel category-panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">Score logic</p>
              <h2>Profile breakdown</h2>
            </div>
            <BarChart3 size={21} aria-hidden="true" />
          </div>
          <div className="category-list">
            {report.categoryScores.map((category) => (
              <article className="category-row" key={category.key}>
                <div className="category-row-head">
                  <div>
                    <h3>{category.label}</h3>
                    <p>{category.detail}</p>
                  </div>
                  <strong>{category.score}</strong>
                </div>
                <div className="score-bar" aria-hidden="true">
                  <span style={{ width: `${category.score}%` }} />
                </div>
                <p className="fix-line">{category.fix}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel rewrite-panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">AI output</p>
              <h2>Copy-ready rewrites</h2>
            </div>
            <button className="icon-button" type="button" onClick={() => void copyText(`${report.headlineRewrite}\n\n${report.aboutRewrite}\n\n${report.projectRewrite}`, "Rewrites copied")}> 
              <Copy size={16} aria-hidden="true" />
              <span>Copy rewrites</span>
            </button>
          </div>
          <div className="rewrite-grid ai-rewrite-grid">
            <article className="rewrite-item">
              <h3>Headline</h3>
              <p>{report.headlineRewrite}</p>
            </article>
            <article className="rewrite-item">
              <h3>About</h3>
              <p>{report.aboutRewrite}</p>
            </article>
            <article className="rewrite-item">
              <h3>Project</h3>
              <p>{report.projectRewrite}</p>
            </article>
            <article className="rewrite-item accent-rewrite">
              <h3>Positioning</h3>
              <p>{report.positioningStatement}</p>
            </article>
          </div>
        </section>

        <section className="panel ideas-panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">More things to add</p>
              <h2>Website upgrade ideas</h2>
            </div>
            <Rocket size={21} aria-hidden="true" />
          </div>
          <div className="ideas-grid">
            {report.websiteIdeas.map((idea) => (
              <div className="idea-item" key={idea}>
                <Lightbulb size={16} aria-hidden="true" />
                <span>{idea}</span>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
