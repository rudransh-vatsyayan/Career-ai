"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RoadmapPage() {
  const router = useRouter();
  const [collegeData, setCollegeData] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedSteps, setCompletedSteps] = useState({});
  const [userProfile, setUserProfile] = useState(null);

  // 1. Load selection from localStorage and fetch roadmap
  useEffect(() => {
    const selectionText = localStorage.getItem("roadmapSelection");
    if (!selectionText) {
      setTimeout(() => {
        setError("No college selected. Please return to the Dashboard first.");
        setLoading(false);
      }, 0);
      return;
    }

    try {
      const data = JSON.parse(selectionText);
      
      const categoryBenchmarksText = localStorage.getItem("categoryBenchmarks");
      const categoryBenchmarks = categoryBenchmarksText ? JSON.parse(categoryBenchmarksText) : null;

      const profileText = localStorage.getItem("userProfile");
      const userProfileParsed = profileText ? JSON.parse(profileText) : null;
      setUserProfile(userProfileParsed);

      const skillsText = localStorage.getItem("userSkills");
      const userSkills = skillsText ? JSON.parse(skillsText) : [];

      const collegeRankingsText = localStorage.getItem("collegeRankings");
      const collegeRankings = collegeRankingsText ? JSON.parse(collegeRankingsText) : null;

      const skillAnalysisText = localStorage.getItem("skillAnalysis");
      const skillAnalysis = skillAnalysisText ? JSON.parse(skillAnalysisText) : null;

      // Load saved completed steps for this specific college
      const savedProgress = localStorage.getItem(`progress_${data.name}`);

      setTimeout(() => {
        setCollegeData(data);
        if (savedProgress) {
          setCompletedSteps(JSON.parse(savedProgress));
        }
      }, 0);

      // Call API with placement data
      fetch("/api/roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          collegeName: data.name,
          grades: data.grades,
          categoryBenchmarks: categoryBenchmarks,
          userProfile: userProfileParsed,
          userSkills: userSkills,
          collegeRankings: collegeRankings,
          skillAnalysis: skillAnalysis
        })
      })
        .then(res => {
          if (!res.ok) {
            return res.json().then(errData => {
              throw new Error(errData.error || "Server responded with error generating roadmap");
            });
          }
          return res.json();
        })
        .then(json => {
          console.log("Roadmap received:", json);
          setRoadmap(json);
          setLoading(false);
        })
        .catch(err => {
          console.error("API error:", err);
          setError(`Failed to generate roadmap: ${err.message}`);
          setLoading(false);
        });
    } catch (e) {
      console.error(e);
      setTimeout(() => {
        setError("Invalid college selection data.");
        setLoading(false);
      }, 0);
    }
  }, []);

  const handleToggleStep = (stepId) => {
    if (!collegeData) return;
    const newProgress = {
      ...completedSteps,
      [stepId]: !completedSteps[stepId]
    };
    setCompletedSteps(newProgress);
    localStorage.setItem(`progress_${collegeData.name}`, JSON.stringify(newProgress));
  };

  const getCompletionPercentage = () => {
    if (!roadmap || !roadmap.steps || roadmap.steps.length === 0) return 0;
    const completedCount = Object.values(completedSteps).filter(Boolean).length;
    return Math.round((completedCount / roadmap.steps.length) * 100);
  };

  if (loading) {
    return (
      <div className="glass-panel" style={{ textAlign: "center", padding: "5rem" }}>
        <div className="spinner"></div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginTop: "1.5rem" }}>
          🧠 AI Engine Generating Upskilling Track...
        </h2>
        <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
          Analyzing institutional deficits, placement data, and mapping personalized skills roadmap.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ textAlign: "center", padding: "4rem" }}>
        <span style={{ fontSize: "3rem" }}>⚠️</span>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginTop: "1rem", color: "var(--accent-rose)" }}>
          Generation Failed
        </h2>
        <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem", marginBottom: "2rem" }}>
          {error}
        </p>
        <Link href="/" className="btn-upload" style={{ textDecoration: "none" }}>
          ⬅️ Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!roadmap || !roadmap.steps) {
    return (
      <div className="glass-panel" style={{ textAlign: "center", padding: "4rem" }}>
        <span style={{ fontSize: "3rem" }}>❌</span>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginTop: "1rem" }}>
          No Roadmap Data
        </h2>
        <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem", marginBottom: "2rem" }}>
          The AI response was invalid or empty. Please try again.
        </p>
        <Link href="/" className="btn-upload" style={{ textDecoration: "none" }}>
          ⬅️ Back to Dashboard
        </Link>
      </div>
    );
  }

  const completionRate = getCompletionPercentage();

  return (
    <div className="dashboard-container animate-in">
      <header className="page-hero">
        <div style={{ marginBottom: "1.5rem" }}>
          <Link href="/" className="status-badge" style={{ textDecoration: "none" }}>
            ← Return to Benchmarking
          </Link>
        </div>
        <h1 className="hero-title">Career Execution Plan</h1>
        <p className="hero-subtitle">
          Strategic upskilling roadmap for <strong>{collegeData?.name}</strong> targeting <strong>{userProfile?.interestedRole}</strong>.
        </p>
      </header>

      <div className="roadmap-content" style={{ maxWidth: "900px" }}>
        {/* Strategy Executive Summary */}
        <section className="glass-panel" style={{ borderLeft: "6px solid var(--brand-primary)", marginBottom: "3.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 className="panel-title" style={{ margin: 0 }}>
              <span>💡</span> Strategic Assessment
            </h2>
            <div className="status-badge">{roadmap?.strategyType}</div>
          </div>
          <p style={{ fontSize: "1.15rem", color: "var(--text-primary)", lineHeight: "1.8", opacity: 0.9 }}>
            {roadmap?.deficitSummary}
          </p>
          {roadmap?.placementStrategy && (
            <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(76, 175, 80, 0.08)", borderRadius: "8px", borderLeft: "3px solid var(--accent-success)" }}>
              <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", margin: 0 }}>
                <strong>📊 Placement Strategy:</strong> {roadmap.placementStrategy}
              </p>
            </div>
          )}
        </section>

        {/* Tactical Execution Progress */}
        <section className="glass-panel" style={{ padding: "2rem", marginBottom: "3.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", alignItems: "flex-end" }}>
            <div>
              <p style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Milestone Progress</p>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Execution Phase Completion</h3>
            </div>
            <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--brand-primary)" }}>{completionRate}%</span>
          </div>
          <div className="progress-track" style={{ height: "14px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)" }}>
            <div className="progress-fill" style={{ width: `${completionRate}%`, background: "linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))" }}></div>
          </div>
        </section>

        {/* Sequential Timeline */}
        <div className="professional-timeline" style={{ position: "relative", paddingLeft: "3.5rem" }}>
          <div style={{ position: "absolute", left: "15px", top: 0, bottom: 0, width: "2px", background: "linear-gradient(to bottom, var(--brand-primary), var(--bg-main))", opacity: 0.3 }}></div>
          
          {roadmap.steps.map((step) => {
            const isDone = !!completedSteps[step.id];
            return (
              <div key={step.id} className="timeline-segment" style={{ position: "relative", marginBottom: "4rem" }}>
                {/* Visual Node */}
                <div style={{ 
                  position: "absolute", 
                  left: "calc(-3.5rem + 7px)", 
                  top: "0.5rem", 
                  width: "18px", 
                  height: "18px", 
                  borderRadius: "50%", 
                  background: isDone ? "var(--accent-success)" : "var(--brand-primary)",
                  boxShadow: isDone ? "0 0 20px var(--accent-success)" : "0 0 20px var(--brand-primary)",
                  zIndex: 10,
                  border: "4px solid var(--bg-main)"
                }}></div>

                <div className="glass-panel" style={{ padding: "2rem", opacity: isDone ? 0.6 : 1, borderColor: isDone ? "var(--accent-success)" : "var(--border-subtle)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                      <input 
                        type="checkbox" 
                        style={{ width: "24px", height: "24px", accentColor: "var(--brand-primary)", cursor: "pointer" }}
                        checked={isDone}
                        onChange={() => handleToggleStep(step.id)}
                      />
                      <h3 style={{ fontSize: "1.4rem", fontWeight: 700, textDecoration: isDone ? "line-through" : "none" }}>{step.title}</h3>
                    </div>
                    <span className="status-badge" style={{ background: "rgba(255,255,255,0.03)", color: "var(--text-muted)" }}>{step.timeline}</span>
                  </div>
                  
                  <div style={{ marginBottom: "1.25rem" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--brand-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {step.category}
                    </span>
                  </div>
                  
                  <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", lineHeight: "1.7", marginBottom: "2rem" }}>{step.description}</p>

                  {step.placementRelevance && (
                    <div style={{ marginBottom: "1.5rem", padding: "0.75rem", background: "rgba(76, 175, 80, 0.08)", borderRadius: "6px", borderLeft: "2px solid var(--accent-success)" }}>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
                        <strong>📈 Placement Relevance:</strong> {step.placementRelevance}
                      </p>
                    </div>
                  )}
                  
                  {step.skills && (
                    <div className="skill-matrix-mini" style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                      {step.skills.map(skill => (
                        <span key={skill} style={{ padding: "0.5rem 1rem", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)", fontSize: "0.85rem" }}>
                          #{skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: "center", padding: "5rem 0" }}>
          <button onClick={() => window.print()} className="btn-primary" style={{ width: "auto", padding: "1.25rem 4rem" }}>
            📂 Generate Professional PDF Report
          </button>
        </div>
      </div>
    </div>
  );
}
