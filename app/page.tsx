"use client";

import { FormEvent, useRef, useState } from "react";

type Section = {
  key: string;
  label: string;
  found: boolean;
};

type ProfileReport = {
  name: string;
  headline: string;
  sections: Section[];
  strengths: string[];
  gaps: string[];
  actions: string[];
  rewriteIdeas: string[];
  source: string;
};

type ImageAdvice = {
  brightness: string;
  contrast: string;
  sharpness: string;
  advice: string[];
};

const emptyReport: ProfileReport = {
  name: "No profile analyzed",
  headline: "Paste a profile to extract the headline and sections.",
  sections: [
    "Headline",
    "About",
    "Experience",
    "Education",
    "Skills",
    "Projects",
    "Certifications",
    "Metrics",
  ].map((label) => ({ key: label.toLowerCase(), label, found: false })),
  strengths: [],
  gaps: [],
  actions: [],
  rewriteIdeas: [],
  source: "Waiting for profile text.",
};

const sampleProfile = `Ayush Sharma
Student Builder | AI Tools | Web Apps | Learning Product Design

About
I am a student interested in building useful AI products, web apps, and education tools. I enjoy turning rough ideas into working demos and learning by shipping projects.

Experience
Founder-style project work
Built small tools for productivity, profile analysis, and video content. Practiced frontend development, prompt design, and product thinking.

Projects
LinkedIn Profile Analyzer - A web app that reviews profile text, identifies missing sections, and gives personalized improvements.
AI Image Analyzer - A browser tool that checks image brightness, contrast, sharpness, and professional presentation.

Education
High school student

Skills
HTML, CSS, JavaScript, AI tools, product design, communication, research`;

function getInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
  if (!parts.length || name === "No profile analyzed") return "PL";
  return parts.map((part) => part[0]).join("").toUpperCase();
}

function qualityLabel(value: number, low: number, high: number) {
  if (value < low) return "Low";
  if (value > high) return "High";
  return "Good";
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

export default function Home() {
  const [profileUrl, setProfileUrl] = useState("");
  const [profileText, setProfileText] = useState("");
  const [report, setReport] = useState<ProfileReport>(emptyReport);
  const [status, setStatus] = useState("Ready");
  const [imageAdvice, setImageAdvice] = useState<ImageAdvice>({
    brightness: "-",
    contrast: "-",
    sharpness: "-",
    advice: ["Upload a clear profile photo or screenshot to analyze it."],
  });
  const [hasImage, setHasImage] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function analyzeProfile(event?: FormEvent, override?: { text: string; url: string }) {
    event?.preventDefault();

    const textToAnalyze = override?.text ?? profileText;
    const urlToAnalyze = override?.url ?? profileUrl;

    if (!textToAnalyze.trim()) {
      setStatus("Needs Text");
      return;
    }

    setStatus("Analyzing");
    const response = await fetch("/api/analyze-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileText: textToAnalyze, profileUrl: urlToAnalyze }),
    });

    if (!response.ok) {
      setStatus("Failed");
      return;
    }

    const nextReport = (await response.json()) as ProfileReport;
    setReport(nextReport);
    setStatus("Analyzed");
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
    void analyzeProfile(undefined, { text: sampleProfile, url: sampleUrl });
  }

  async function copyReport() {
    const text = [
      "Profile Lens Report",
      `Name: ${report.name}`,
      `Headline: ${report.headline}`,
      "",
      `Detected sections: ${report.sections.filter((section) => section.found).map((section) => section.label).join(", ") || "None"}`,
      "",
      "What stands out:",
      ...report.strengths.map((item) => `- ${item}`),
      "",
      "Weak spots:",
      ...report.gaps.map((item) => `- ${item}`),
      "",
      "Next improvements:",
      ...report.actions.map((item) => `- ${item}`),
      "",
      "Rewrite ideas:",
      ...report.rewriteIdeas.map((item) => `- ${item}`),
    ].join("\n");

    await navigator.clipboard.writeText(text);
    setStatus("Copied");
  }

  function handleImageUpload(file: File | undefined) {
    if (!file || !canvasRef.current) return;

    const image = new Image();
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
      if (image.naturalWidth < 600 || image.naturalHeight < 600) {
        advice.push("Use a larger image; profile photos look cleaner when the source is at least 600 by 600 pixels.");
      }
      if (metrics.brightness < 0.35) {
        advice.push("The image is dark; use brighter front-facing light.");
      } else if (metrics.brightness > 0.78) {
        advice.push("The image is very bright; reduce exposure so facial details stay visible.");
      } else {
        advice.push("Brightness is in a usable range for a professional profile image.");
      }
      if (metrics.contrast < 0.13) {
        advice.push("Contrast is low; use a cleaner background and stronger separation from the subject.");
      }
      if (metrics.sharpness < 0.022) {
        advice.push("The image looks soft; use a sharper original or avoid heavy cropping.");
      }
      advice.push("Best LinkedIn photo pattern: clear face, simple background, eye-level framing, and shoulders visible.");

      setHasImage(true);
      setImageAdvice({
        brightness: qualityLabel(metrics.brightness, 0.35, 0.78),
        contrast: qualityLabel(metrics.contrast, 0.13, 0.34),
        sharpness: metrics.sharpness < 0.022 ? "Soft" : metrics.sharpness > 0.075 ? "Crisp" : "Good",
        advice,
      });

      URL.revokeObjectURL(image.src);
    };
    image.src = URL.createObjectURL(file);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">LinkedIn project demo</p>
          <h1>Profile Lens</h1>
        </div>
        <div className="status-pill">{status}</div>
      </header>

      <section className="workspace-grid">
        <form className="panel input-panel" onSubmit={analyzeProfile}>
          <div className="panel-heading">
            <div>
              <h2>Profile Analyzer</h2>
              <p>Text-based LinkedIn profile review without a score.</p>
            </div>
            <button className="ghost-button" type="button" onClick={loadSample}>
              Sample
            </button>
          </div>

          <label className="field-label" htmlFor="profileUrl">
            LinkedIn profile URL
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
            Profile text
          </label>
          <textarea
            id="profileText"
            rows={14}
            value={profileText}
            onChange={(event) => setProfileText(event.target.value)}
            placeholder="Paste the visible text from a LinkedIn profile: name, headline, about, experience, education, skills, projects..."
          />

          <div className="button-row">
            <button className="primary-button" type="submit">
              Analyze Profile
            </button>
            <button className="secondary-button" type="button" onClick={clearProfile}>
              Clear
            </button>
          </div>
        </form>

        <section className="panel image-panel">
          <div className="panel-heading">
            <div>
              <h2>Image Analyzer</h2>
              <p>Profile photo and screenshot checks.</p>
            </div>
          </div>

          <label className="upload-zone" htmlFor="imageUpload">
            <input
              id="imageUpload"
              type="file"
              accept="image/*"
              onChange={(event) => handleImageUpload(event.target.files?.[0])}
            />
            <span className="upload-title">Upload Image</span>
            <span className="upload-subtitle">JPG, PNG, or WebP</span>
          </label>

          <div className="image-preview-wrap">
            <canvas ref={canvasRef} width={480} height={320} />
            {!hasImage && <div className="empty-preview">No image selected</div>}
          </div>

          <div className="image-results">
            <div className="metric-card">
              <span>Brightness</span>
              <strong>{imageAdvice.brightness}</strong>
            </div>
            <div className="metric-card">
              <span>Contrast</span>
              <strong>{imageAdvice.contrast}</strong>
            </div>
            <div className="metric-card">
              <span>Sharpness</span>
              <strong>{imageAdvice.sharpness}</strong>
            </div>
          </div>
          <ul className="compact-list">
            {imageAdvice.advice.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </section>

      <section className="results-layout">
        <section className="panel summary-panel">
          <div className="panel-heading">
            <div>
              <h2>Detected Profile</h2>
              <p>{report.source}</p>
            </div>
            <button className="ghost-button" type="button" onClick={copyReport}>
              Copy Report
            </button>
          </div>
          <div className="profile-card">
            <div className="avatar-mark">{getInitials(report.name)}</div>
            <div>
              <h3>{report.name}</h3>
              <p>{report.headline}</p>
            </div>
          </div>
          <div className="section-chips">
            {report.sections.map((section) => (
              <span className={`chip ${section.found ? "found" : "missing"}`} key={section.key}>
                {section.label}
              </span>
            ))}
          </div>
        </section>

        <section className="insight-grid">
          <article className="panel insight-card">
            <h2>What Stands Out</h2>
            <ul>
              {report.strengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="panel insight-card">
            <h2>Weak Spots</h2>
            <ul>
              {report.gaps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="panel insight-card">
            <h2>Next Improvements</h2>
            <ul>
              {report.actions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="panel insight-card">
            <h2>Rewrite Ideas</h2>
            <div className="rewrite-block">
              {report.rewriteIdeas.map((item) => (
                <div className="rewrite-item" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
