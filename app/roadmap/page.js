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
      const skillsText = localStorage.getItem("userSkills");
      const userSkills = skillsText ? JSON.parse(skillsText) : [];
      const collegeRankingsText = localStorage.getItem("collegeRankings");
      const collegeRankings = collegeRankingsText ? JSON.parse(collegeRankingsText) : [];
      const skillAnalysisText = localStorage.getItem("skillAnalysis");
      const skillAnalysis = skillAnalysisText ? JSON.parse(skillAnalysisText) : null;
      const savedProgress = localStorage.getItem(`progress_${data.name}`);

      setTimeout(() => {
        setUserProfile(userProfileParsed);
        setCollegeData(data);
        if (savedProgress) {
          setCompletedSteps(JSON.parse(savedProgress));
        }
      }, 0);

      fetch("/api/roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collegeName: data.name,
          grades: data.grades,
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
      <div className="workspace-page centered-state">
        <div>
          <div className="spinner"></div>
          <h2>Generating semester roadmap</h2>
          <p>Comparing acquired skills, placement signals, and college benchmark gaps.</p>
        </div>
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
        </div>

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

      <div className="timeline">
        {roadmap?.steps?.map((step) => {
          const isDone = !!completedSteps[step.id];

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
