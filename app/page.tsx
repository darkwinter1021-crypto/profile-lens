"use client";

import type { CSSProperties, FormEvent } from "react";
import { useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDownToLine,
  BadgeCheck,
  BarChart3,
  Camera,
  CheckCircle2,
  Clipboard,
  Code2,
  Copy,
  Download,
  FileText,
  Gauge,
  GraduationCap,
  ImageIcon,
  Lightbulb,
  Link as LinkIcon,
  Megaphone,
  PenTool,
  RefreshCw,
  Rocket,
  ScanSearch,
  Sparkles,
  Target,
  Upload,
  UserRound,
  XCircle,
  Zap,
} from "lucide-react";

type TargetRole = "student-builder" | "developer" | "founder" | "designer" | "marketer" | "general";

type Section = {
  key: string;
  label: string;
  found: boolean;
};

type CategoryScore = {
  key: string;
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

type ProfileReport = {
  name: string;
  headline: string;
  sections: Section[];
  overallScore: number;
  scoreLabel: string;
  scoreTone: "elite" | "strong" | "warning" | "danger";
  categoryScores: CategoryScore[];
  profileSnapshot: {
    name: string;
    headline: string;
    targetRole: string;
    scoreSummary: string;
    stats: Array<{ label: string; value: string }>;
  };
  strengths: Insight[];
  weaknesses: Insight[];
  priorityFixes: Insight[];
  rewriteIdeas: string[];
  linkedinProjectDescription: string;
  source: string;
};

type ImageAdvice = {
  brightness: string;
  contrast: string;
  sharpness: string;
  readiness: number;
  label: string;
  advice: string[];
};

const roles: Array<{ key: TargetRole; label: string; icon: LucideIcon }> = [
  { key: "student-builder", label: "Student", icon: GraduationCap },
  { key: "developer", label: "Developer", icon: Code2 },
  { key: "founder", label: "Founder", icon: Rocket },
  { key: "designer", label: "Designer", icon: PenTool },
  { key: "marketer", label: "Marketer", icon: Megaphone },
  { key: "general", label: "General", icon: UserRound },
];

const emptySections: Section[] = [
  "Headline",
  "About",
  "Experience",
  "Education",
  "Skills",
  "Projects",
  "Certifications",
  "Metrics",
].map((label) => ({ key: label.toLowerCase(), label, found: false }));

const emptyCategories: CategoryScore[] = [
  "Headline",
  "About Story",
  "Experience",
  "Projects",
  "Skills Match",
  "Proof",
  "Readability",
  "Completeness",
].map((label) => ({
  key: label.toLowerCase().replace(/\s+/g, "-"),
  label,
  score: 0,
  detail: "Waiting for profile text.",
  fix: "Run an analysis to generate a focused fix.",
}));

const emptyReport: ProfileReport = {
  name: "No profile analyzed",
  headline: "Paste profile text and run an analysis.",
  sections: emptySections,
  overallScore: 0,
  scoreLabel: "Waiting",
  scoreTone: "danger",
  categoryScores: emptyCategories,
  profileSnapshot: {
    name: "No profile analyzed",
    headline: "Paste profile text and run an analysis.",
    targetRole: "Student Builder",
    scoreSummary: "No score yet.",
    stats: [
      { label: "Detected", value: "0/8" },
      { label: "Words", value: "0" },
      { label: "Proof signals", value: "0" },
      { label: "Project signals", value: "0" },
    ],
  },
  strengths: [
    {
      title: "Ready for input",
      body: "The report will show the strongest visible signals once profile text is analyzed.",
      impact: "Quick fix",
    },
  ],
  weaknesses: [],
  priorityFixes: [
    {
      title: "Start with profile text",
      body: "Paste the visible LinkedIn profile text so the scoring model can detect sections and proof.",
      impact: "High impact",
    },
  ],
  rewriteIdeas: ["Run an analysis to generate headline, about, and project rewrite ideas."],
  linkedinProjectDescription: "Run an analysis to generate a portfolio project description.",
  source: "Waiting for profile text.",
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

function getInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
  if (!parts.length || name === "No profile analyzed") return "PL";
  return parts.map((part) => part[0]).join("").toUpperCase();
}

function formatReport(report: ProfileReport) {
  return [
    "Profile Lens Report",
    `Name: ${report.name}`,
    `Headline: ${report.headline}`,
    `Overall score: ${report.overallScore}/100 (${report.scoreLabel})`,
    `Target role: ${report.profileSnapshot.targetRole}`,
    "",
    "Category scores:",
    ...report.categoryScores.map((item) => `- ${item.label}: ${item.score}/100 - ${item.detail}`),
    "",
    "Detected sections:",
    report.sections.filter((section) => section.found).map((section) => section.label).join(", ") || "None",
    "",
    "Strengths:",
    ...report.strengths.map((item) => `- ${item.title}: ${item.body}`),
    "",
    "Priority fixes:",
    ...report.priorityFixes.map((item) => `- ${item.title}: ${item.body}`),
    "",
    "Weak spots:",
    ...(report.weaknesses.length ? report.weaknesses : [{ title: "No major weak spot", body: "No major weak spot detected." }]).map(
      (item) => `- ${item.title}: ${item.body}`,
    ),
    "",
    "Rewrite ideas:",
    ...report.rewriteIdeas.map((item) => `- ${item}`),
    "",
    "LinkedIn project description:",
    report.linkedinProjectDescription,
  ].join("\n");
}

function rangeLabel(value: number, low: number, high: number, lowText: string, goodText: string, highText: string) {
  if (value < low) return lowText;
  if (value > high) return highText;
  return goodText;
}

function analyzePixels(imageData: ImageData, width: number, height: number) {
  const { data } = imageData;
  let totalLuma = 0;
  let totalSquared = 0;
  const gray = new Float32Array(width * height);

  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const luma = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
    gray[p] = luma;
    totalLuma += luma;
    totalSquared += luma * luma;
  }

  const count = width * height;
  const brightness = totalLuma / count;
  const variance = totalSquared / count - brightness * brightness;
  const contrast = Math.sqrt(Math.max(0, variance));

  let edgeTotal = 0;
  let edgeCount = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      const laplacian = Math.abs(gray[i] * 4 - gray[i - 1] - gray[i + 1] - gray[i - width] - gray[i + width]);
      edgeTotal += laplacian;
      edgeCount += 1;
    }
  }

  return {
    brightness,
    contrast,
    sharpness: edgeCount ? edgeTotal / edgeCount : 0,
  };
}

function buildReadinessLabel(readiness: number) {
  if (readiness >= 86) return "Profile ready";
  if (readiness >= 70) return "Usable";
  if (readiness >= 52) return "Needs polish";
  return "Retake suggested";
}

function InsightList({ items, empty, icon: Icon }: { items: Insight[]; empty: string; icon: LucideIcon }) {
  const normalized = items.length
    ? items
    : [
        {
          title: "Nothing flagged",
          body: empty,
          impact: "Nice to have" as const,
        },
      ];

  return (
    <div className="insight-list">
      {normalized.map((item) => (
        <article className="insight-item" key={`${item.title}-${item.body}`}>
          <div className="insight-icon">
            <Icon size={16} aria-hidden="true" />
          </div>
          <div>
            <div className="insight-title-row">
              <h3>{item.title}</h3>
              <span>{item.impact}</span>
            </div>
            <p>{item.body}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function Home() {
  const [profileUrl, setProfileUrl] = useState("");
  const [profileText, setProfileText] = useState("");
  const [targetRole, setTargetRole] = useState<TargetRole>("student-builder");
  const [report, setReport] = useState<ProfileReport>(emptyReport);
  const [status, setStatus] = useState("Ready");
  const [imageAdvice, setImageAdvice] = useState<ImageAdvice>({
    brightness: "-",
    contrast: "-",
    sharpness: "-",
    readiness: 0,
    label: "Waiting",
    advice: ["Upload a clear profile photo or screenshot to analyze it."],
  });
  const [hasImage, setHasImage] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function analyzeProfile(
    event?: FormEvent<HTMLFormElement>,
    override?: { text: string; url: string; role: TargetRole },
  ) {
    event?.preventDefault();

    const textToAnalyze = override?.text ?? profileText;
    const urlToAnalyze = override?.url ?? profileUrl;
    const roleToAnalyze = override?.role ?? targetRole;

    if (!textToAnalyze.trim()) {
      setStatus("Needs text");
      return;
    }

    setStatus("Analyzing");

    try {
      const response = await fetch("/api/analyze-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileText: textToAnalyze, profileUrl: urlToAnalyze, targetRole: roleToAnalyze }),
      });

      if (!response.ok) {
        setStatus("Failed");
        return;
      }

      const nextReport = (await response.json()) as ProfileReport;
      setReport(nextReport);
      setStatus("Analyzed");
    } catch {
      setStatus("Failed");
    }
  }

  function clearProfile() {
    setProfileUrl("");
    setProfileText("");
    setReport(emptyReport);
    setStatus("Ready");
  }

  function loadSample() {
    const sampleUrl = "https://www.linkedin.com/in/sample-profile";
    setProfileUrl(sampleUrl);
    setProfileText(sampleProfile);
    void analyzeProfile(undefined, { text: sampleProfile, url: sampleUrl, role: targetRole });
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
    link.download = `profile-lens-${report.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "report"}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("Downloaded");
  }

  function handleImageUpload(file: File | undefined) {
    if (!file || !canvasRef.current) return;

    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      const canvasRatio = canvas.width / canvas.height;
      const imageRatio = image.naturalWidth / image.naturalHeight;
      let sourceWidth = image.naturalWidth;
      let sourceHeight = image.naturalHeight;
      let sourceX = 0;
      let sourceY = 0;

      if (imageRatio > canvasRatio) {
        sourceWidth = image.naturalHeight * canvasRatio;
        sourceX = (image.naturalWidth - sourceWidth) / 2;
      } else {
        sourceHeight = image.naturalWidth / canvasRatio;
        sourceY = (image.naturalHeight - sourceHeight) / 2;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
      const metrics = analyzePixels(ctx.getImageData(0, 0, canvas.width, canvas.height), canvas.width, canvas.height);

      const advice: string[] = [];
      let readiness = 100;

      if (image.naturalWidth < 600 || image.naturalHeight < 600) {
        readiness -= 18;
        advice.push("Use a larger source image, ideally at least 600 by 600 pixels.");
      }
      if (metrics.brightness < 0.35) {
        readiness -= 22;
        advice.push("The image is dark. Use brighter front-facing light.");
      } else if (metrics.brightness > 0.78) {
        readiness -= 16;
        advice.push("The image is bright. Reduce exposure so facial details stay visible.");
      } else {
        advice.push("Brightness is balanced for a professional profile image.");
      }
      if (metrics.contrast < 0.13) {
        readiness -= 18;
        advice.push("Contrast is low. Use a cleaner background and stronger subject separation.");
      }
      if (metrics.sharpness < 0.022) {
        readiness -= 22;
        advice.push("The image looks soft. Use a sharper original or avoid heavy cropping.");
      }
      advice.push("Best LinkedIn photo pattern: clear face, simple background, eye-level framing, and shoulders visible.");

      const nextReadiness = Math.max(0, Math.min(100, Math.round(readiness)));
      setHasImage(true);
      setImageAdvice({
        brightness: rangeLabel(metrics.brightness, 0.35, 0.78, "Dim", "Balanced", "Bright"),
        contrast: rangeLabel(metrics.contrast, 0.13, 0.34, "Low", "Balanced", "High"),
        sharpness: metrics.sharpness < 0.022 ? "Soft" : metrics.sharpness > 0.075 ? "Crisp" : "Clean",
        readiness: nextReadiness,
        label: buildReadinessLabel(nextReadiness),
        advice,
      });

      URL.revokeObjectURL(objectUrl);
    };

    image.src = objectUrl;
  }

  const scoreStyle = { "--score": report.overallScore } as CSSProperties;
  const imageScoreStyle = { "--score": imageAdvice.readiness } as CSSProperties;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">
            <ScanSearch size={22} aria-hidden="true" />
          </div>
          <div>
            <p className="eyebrow">LinkedIn portfolio tool</p>
            <h1>Profile Lens</h1>
          </div>
        </div>
        <div className="top-actions">
          <span className={`status-pill ${status.toLowerCase().replace(/\s+/g, "-")}`}>{status}</span>
          <button className="icon-button" type="button" onClick={() => void copyText(formatReport(report), "Copied")}> 
            <Clipboard size={17} aria-hidden="true" />
            <span>Copy</span>
          </button>
        </div>
      </header>

      <section className="workspace-grid">
        <form className="panel input-panel" onSubmit={analyzeProfile}>
          <div className="panel-heading">
            <div>
              <p className="section-label">Analyzer</p>
              <h2>Profile input</h2>
            </div>
            <button className="secondary-button compact-button" type="button" onClick={loadSample}>
              <Sparkles size={16} aria-hidden="true" />
              <span>Sample</span>
            </button>
          </div>

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

          <label className="field-label" htmlFor="profileUrl">
            <LinkIcon size={15} aria-hidden="true" />
            LinkedIn URL
          </label>
          <input
            id="profileUrl"
            type="url"
            value={profileUrl}
            onChange={(event) => setProfileUrl(event.target.value)}
            placeholder="https://www.linkedin.com/in/your-profile"
            autoComplete="off"
          />

          <label className="field-label" htmlFor="profileText">
            <FileText size={15} aria-hidden="true" />
            Profile text
          </label>
          <textarea
            id="profileText"
            rows={14}
            value={profileText}
            onChange={(event) => setProfileText(event.target.value)}
            placeholder="Paste name, headline, about, experience, education, skills, projects, and visible proof."
          />

          <div className="button-row">
            <button className="primary-button" type="submit" disabled={status === "Analyzing"}>
              <Sparkles size={17} aria-hidden="true" />
              <span>Analyze</span>
            </button>
            <button className="secondary-button" type="button" onClick={clearProfile}>
              <RefreshCw size={16} aria-hidden="true" />
              <span>Clear</span>
            </button>
          </div>
        </form>

        <aside className="side-stack">
          <section className={`panel score-panel ${report.scoreTone}`}>
            <div className="panel-heading">
              <div>
                <p className="section-label">Score</p>
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
                <h3>{report.profileSnapshot.scoreSummary}</h3>
                <p>{report.source}</p>
              </div>
            </div>

            <div className="stat-grid">
              {report.profileSnapshot.stats.map((stat) => (
                <div className="stat-tile" key={stat.label}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>

            <div className="section-chips">
              {report.sections.map((section) => (
                <span className={`chip ${section.found ? "found" : "missing"}`} key={section.key}>
                  {section.found ? <CheckCircle2 size={14} aria-hidden="true" /> : <XCircle size={14} aria-hidden="true" />}
                  {section.label}
                </span>
              ))}
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

          <section className="panel image-panel">
            <div className="panel-heading">
              <div>
                <p className="section-label">Image</p>
                <h2>Photo readiness</h2>
              </div>
              <Camera size={21} aria-hidden="true" />
            </div>

            <label className="upload-zone" htmlFor="imageUpload">
              <input
                id="imageUpload"
                type="file"
                accept="image/*"
                onChange={(event) => handleImageUpload(event.target.files?.[0])}
              />
              <Upload size={20} aria-hidden="true" />
              <span>Upload image</span>
            </label>

            <div className="image-preview-wrap">
              <canvas ref={canvasRef} width={480} height={320} />
              {!hasImage && (
                <div className="empty-preview">
                  <ImageIcon size={22} aria-hidden="true" />
                  <span>No image selected</span>
                </div>
              )}
            </div>

            <div className="image-score-line">
              <div className="mini-score" style={imageScoreStyle}>
                <strong>{imageAdvice.readiness}</strong>
              </div>
              <div>
                <h3>{imageAdvice.label}</h3>
                <p>Brightness {imageAdvice.brightness} | Contrast {imageAdvice.contrast} | Sharpness {imageAdvice.sharpness}</p>
              </div>
            </div>
          </section>
        </aside>
      </section>

      <section className="results-layout">
        <section className="panel category-panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">Breakdown</p>
              <h2>Category scores</h2>
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

        <section className="insight-columns">
          <section className="panel insight-panel">
            <div className="panel-heading compact-heading">
              <h2>Strengths</h2>
              <BadgeCheck size={20} aria-hidden="true" />
            </div>
            <InsightList items={report.strengths} empty="No strong signals detected yet." icon={CheckCircle2} />
          </section>

          <section className="panel insight-panel priority-panel">
            <div className="panel-heading compact-heading">
              <h2>Priority fixes</h2>
              <Zap size={20} aria-hidden="true" />
            </div>
            <InsightList items={report.priorityFixes} empty="No priority fixes detected." icon={Target} />
          </section>

          <section className="panel insight-panel">
            <div className="panel-heading compact-heading">
              <h2>Weak spots</h2>
              <XCircle size={20} aria-hidden="true" />
            </div>
            <InsightList items={report.weaknesses} empty="No major weak spots detected." icon={XCircle} />
          </section>
        </section>

        <section className="panel rewrite-panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">Output</p>
              <h2>Rewrite ideas and project copy</h2>
            </div>
            <div className="output-actions">
              <button
                className="icon-button"
                type="button"
                onClick={() => void copyText(report.linkedinProjectDescription, "Project copied")}
              >
                <Copy size={16} aria-hidden="true" />
                <span>Project</span>
              </button>
              <button className="icon-button" type="button" onClick={downloadReport}>
                <ArrowDownToLine size={16} aria-hidden="true" />
                <span>Report</span>
              </button>
            </div>
          </div>

          <div className="rewrite-grid">
            <div className="rewrite-list">
              {report.rewriteIdeas.map((item) => (
                <article className="rewrite-item" key={item}>
                  <Lightbulb size={17} aria-hidden="true" />
                  <p>{item}</p>
                </article>
              ))}
            </div>
            <div className="project-copy-box">
              <h3>LinkedIn project description</h3>
              <pre>{report.linkedinProjectDescription}</pre>
            </div>
          </div>
        </section>

        <section className="panel image-advice-panel">
          <div className="panel-heading compact-heading">
            <h2>Image advice</h2>
            <ImageIcon size={20} aria-hidden="true" />
          </div>
          <div className="image-advice-list">
            {imageAdvice.advice.map((item) => (
              <div className="advice-line" key={item}>
                <CheckCircle2 size={15} aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
