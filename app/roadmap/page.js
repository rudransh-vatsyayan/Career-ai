"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, ClipboardList, FileDown, Gauge, Target } from "lucide-react";

export default function RoadmapPage() {
  const [collegeData, setCollegeData] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedSteps, setCompletedSteps] = useState({});
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const selectionText = localStorage.getItem("roadmapSelection");
    if (!selectionText) {
      setTimeout(() => {
        setError("No institution was selected. Start from the benchmark setup page.");
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
<<<<<<< HEAD
      const skillsText = localStorage.getItem("userSkills");
      const userSkills = skillsText ? JSON.parse(skillsText) : [];
      const collegeRankingsText = localStorage.getItem("collegeRankings");
      const collegeRankings = collegeRankingsText ? JSON.parse(collegeRankingsText) : [];
      const skillAnalysisText = localStorage.getItem("skillAnalysis");
      const skillAnalysis = skillAnalysisText ? JSON.parse(skillAnalysisText) : null;
=======
      setUserProfile(userProfileParsed);

      const skillsText = localStorage.getItem("userSkills");
      const userSkills = skillsText ? JSON.parse(skillsText) : [];

      const collegeRankingsText = localStorage.getItem("collegeRankings");
      const collegeRankings = collegeRankingsText ? JSON.parse(collegeRankingsText) : null;

      const skillAnalysisText = localStorage.getItem("skillAnalysis");
      const skillAnalysis = skillAnalysisText ? JSON.parse(skillAnalysisText) : null;

      // Load saved completed steps for this specific college
>>>>>>> 0306e2a8ef17e095bc77b518d4a06219ed869d08
      const savedProgress = localStorage.getItem(`progress_${data.name}`);

      setTimeout(() => {
        setUserProfile(userProfileParsed);
        setCollegeData(data);
        if (savedProgress) {
          setCompletedSteps(JSON.parse(savedProgress));
        }
      }, 0);

<<<<<<< HEAD
=======
      // Call API with placement data
>>>>>>> 0306e2a8ef17e095bc77b518d4a06219ed869d08
      fetch("/api/roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collegeName: data.name,
          grades: data.grades,
<<<<<<< HEAD
          categoryBenchmarks,
          userProfile: userProfileParsed,
          userSkills,
          collegeRankings,
          skillAnalysis,
        }),
      })
        .then((response) => {
          if (!response.ok) throw new Error("Server responded with error generating roadmap");
          return response.json();
        })
        .then((json) => {
          setRoadmap(json);
          setLoading(false);
        })
        .catch((apiError) => {
          console.error("API error:", apiError);
          setError("Failed to generate roadmap. Verify the Groq API key and network connection.");
=======
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
>>>>>>> 0306e2a8ef17e095bc77b518d4a06219ed869d08
          setLoading(false);
        });
    } catch (parseError) {
      console.error(parseError);
      setTimeout(() => {
        setError("Invalid roadmap setup data. Start again from benchmark setup.");
        setLoading(false);
      }, 0);
    }
  }, []);

  const handleToggleStep = (stepId) => {
    if (!collegeData) return;

    const newProgress = {
      ...completedSteps,
      [stepId]: !completedSteps[stepId],
    };

    setCompletedSteps(newProgress);
    localStorage.setItem(`progress_${collegeData.name}`, JSON.stringify(newProgress));
  };

  const completionRate = (() => {
    if (!roadmap?.steps?.length) return 0;
    const completedCount = Object.values(completedSteps).filter(Boolean).length;
    return Math.round((completedCount / roadmap.steps.length) * 100);
  })();

  if (loading) {
    return (
<<<<<<< HEAD
      <div className="workspace-page centered-state">
        <div>
          <div className="spinner"></div>
          <h2>Generating semester roadmap</h2>
          <p>Comparing acquired skills, placement signals, and college benchmark gaps.</p>
        </div>
=======
      <div className="glass-panel" style={{ textAlign: "center", padding: "5rem" }}>
        <div className="spinner"></div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginTop: "1.5rem" }}>
          🧠 AI Engine Generating Upskilling Track...
        </h2>
        <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
          Analyzing institutional deficits, placement data, and mapping personalized skills roadmap.
        </p>
>>>>>>> 0306e2a8ef17e095bc77b518d4a06219ed869d08
      </div>
    );
  }

  if (error) {
    return (
      <div className="workspace-page centered-state">
        <div className="empty-state-inner">
          <Circle size={36} />
          <h2>Roadmap generation failed</h2>
          <p>{error}</p>
          <Link href="/" className="btn btn-primary" style={{ marginTop: 18 }}>
            <ArrowLeft size={18} />
            Back to benchmark setup
          </Link>
        </div>
      </div>
    );
  }

<<<<<<< HEAD
=======
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

>>>>>>> 0306e2a8ef17e095bc77b518d4a06219ed869d08
  return (
    <div className="workspace-page roadmap-wrap">
      <header className="page-header">
        <div>
          <span className="eyebrow">
            <Target size={16} />
            Semester roadmap
          </span>
          <h1>{collegeData?.name} to {userProfile?.interestedRole}</h1>
          <p>
            Graduation year {userProfile?.graduationYear}. The plan compares selected acquired skills with the benchmark workbook and placement data.
          </p>
        </div>
        <Link href="/skills" className="btn btn-secondary">
          <ArrowLeft size={18} />
          Skill inventory
        </Link>
      </header>

      <section className="panel strategy-panel">
        <div className="section-title">
          <Gauge size={22} />
          <div>
            <h2>{roadmap?.strategyType}</h2>
            <p>{roadmap?.matchedCollege ? `Matched benchmark college: ${roadmap.matchedCollege}` : "Generated from selected benchmark data."}</p>
          </div>
<<<<<<< HEAD
        </div>
=======
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
>>>>>>> 0306e2a8ef17e095bc77b518d4a06219ed869d08

        <div className="strategy-grid">
          <div>
            <p style={{ color: "var(--text-secondary)" }}>{roadmap?.deficitSummary}</p>
            {roadmap?.placementStrategy && (
              <div className="note-box" style={{ marginTop: 14 }}>
                {roadmap.placementStrategy}
              </div>
            )}
          </div>
          <div className="roadmap-progress">
            <strong>{completionRate}%</strong>
            <span>completion</span>
            <div className="progress-track" style={{ marginTop: 12 }}>
              <div className="progress-fill" style={{ width: `${completionRate}%` }}></div>
            </div>
          </div>
        </div>
      </section>

<<<<<<< HEAD
      <div className="timeline">
        {roadmap?.steps?.map((step) => {
          const isDone = !!completedSteps[step.id];
=======
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
>>>>>>> 0306e2a8ef17e095bc77b518d4a06219ed869d08

          return (
            <article key={step.id} className="timeline-item">
              <div className="timeline-marker">
                {isDone ? <CheckCircle2 size={20} /> : <Circle size={18} />}
              </div>

              <section className={`timeline-card ${isDone ? "is-complete" : ""}`}>
                <div className="timeline-head">
                  <div className="timeline-title">
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => handleToggleStep(step.id)}
                      aria-label={`Mark ${step.title} complete`}
                    />
                    <div>
                      <h3>{step.title}</h3>
                      <span className="timeline-category">{step.category}</span>
                    </div>
                  </div>
                  <span className="status-pill">{step.timeline}</span>
                </div>

                <p className="timeline-description">{step.description}</p>

                {step.benchmarkFocus?.length > 0 && (
                  <div className="roadmap-block">
                    <h4>Benchmark focus</h4>
                    <div className="selected-skill-list">
                      {step.benchmarkFocus.map((item) => (
                        <span key={item} className="selected-skill">{item}</span>
                      ))}
                    </div>
                  </div>
<<<<<<< HEAD
                )}

                {step.deliverables?.length > 0 && (
                  <div className="roadmap-block">
                    <h4>Semester deliverables</h4>
                    <ul>
                      {step.deliverables.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {step.placementRelevance && (
                  <div className="roadmap-block note-box">
                    {step.placementRelevance}
                  </div>
                )}

                {step.skills?.length > 0 && (
                  <div className="roadmap-block">
                    <h4>Missing skills to build</h4>
                    <div className="skill-grid">
                      {step.skills.map((skill) => (
                        <span key={skill} className="skill-button is-selected">
                          {skill}
=======
                  
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
>>>>>>> 0306e2a8ef17e095bc77b518d4a06219ed869d08
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </article>
          );
        })}
      </div>

      <div className="btn-row" style={{ justifyContent: "center", marginTop: 28 }}>
        <button onClick={() => window.print()} className="btn btn-primary">
          <FileDown size={18} />
          Export printable report
        </button>
        <Link href="/skills" className="btn btn-secondary">
          <ClipboardList size={18} />
          Edit acquired skills
        </Link>
      </div>
    </div>
  );
}
