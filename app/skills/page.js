"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Layers3,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";

export default function SkillsPage() {
  const router = useRouter();
  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [collegeData, setCollegeData] = useState(null);
  const [skillAnalysis, setSkillAnalysis] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      const profile = JSON.parse(localStorage.getItem("userProfile") || "null");
      const analysis = JSON.parse(localStorage.getItem("skillAnalysis") || "null");
      const selection = JSON.parse(localStorage.getItem("roadmapSelection") || "null");

      setUserProfile(profile);
      setSkillAnalysis(analysis);
      setCollegeData(selection);
      setSelectedSkills([]);
      localStorage.removeItem("userSkills");
    }, 0);

    fetch("/technical_skills.csv")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load skills dataset");
        return response.text();
      })
      .then((text) => {
        const lines = text.split(/\r?\n/);
        const parsed = [];

        for (let index = 1; index < lines.length; index += 1) {
          const line = lines[index].trim();
          if (!line) continue;

          const parts = line.split(",");
          if (parts.length >= 3) {
            parsed.push({
              id: parts[0].trim(),
              name: parts[1].trim(),
              category: parts[2].trim(),
            });
          }
        }

        setSkills(parsed);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching skills:", error);
        setLoading(false);
      });
  }, []);

  const filteredSkills = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return skills;

    return skills.filter(
      (skill) =>
        skill.name.toLowerCase().includes(query) ||
        skill.category.toLowerCase().includes(query)
    );
  }, [searchQuery, skills]);

  const categoriesMap = useMemo(() => {
    return filteredSkills.reduce((map, skill) => {
      if (!map[skill.category]) map[skill.category] = [];
      map[skill.category].push(skill);
      return map;
    }, {});
  }, [filteredSkills]);

  const categories = Object.keys(categoriesMap).sort();
  const requiredContextReady = !!userProfile && !!collegeData;

  const toggleSkill = (skillName) => {
    setSelectedSkills((current) =>
      current.includes(skillName)
        ? current.filter((skill) => skill !== skillName)
        : [...current, skillName]
    );
  };

  const clearSelection = () => {
    setSelectedSkills([]);
    localStorage.removeItem("userSkills");
  };

  const handleContinueToRoadmap = () => {
    const updatedProfile = { ...userProfile, selectedSkills };
    localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
    localStorage.setItem("userSkills", JSON.stringify(selectedSkills));
    router.push("/roadmap");
  };

  if (loading) {
    return (
      <div className="workspace-page centered-state">
        <div>
          <div className="spinner"></div>
          <h2>Loading skill taxonomy</h2>
          <p>Preparing the list of selectable skills.</p>
        </div>
      </div>
    );
  }

  if (!requiredContextReady) {
    return (
      <div className="workspace-page centered-state">
        <div className="empty-state-inner">
          <Layers3 size={36} />
          <h2>Profile setup is missing</h2>
          <p>Start from the benchmark page so the roadmap has college, branch, role, and graduation year context.</p>
          <Link href="/" className="btn btn-primary" style={{ marginTop: 18 }}>
            <ArrowLeft size={18} />
            Back to benchmark setup
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">
            <Sparkles size={16} />
            Skill inventory
          </span>
          <h1>Select only the skills you already have.</h1>
          <p>
            Nothing is auto-selected. Leave this page empty if you want the roadmap to treat you as starting from scratch.
          </p>
        </div>
        <Link href="/" className="btn btn-secondary">
          <ArrowLeft size={18} />
          Benchmark setup
        </Link>
      </header>

      <div className="skills-layout">
        <aside className="panel side-panel">
          <div className="section-title">
            <Layers3 size={22} />
            <div>
              <h2>Current context</h2>
              <p>Used by the roadmap prompt.</p>
            </div>
          </div>

          <div className="profile-summary">
            <div className="summary-line">
              <span>Institution</span>
              <strong>{collegeData?.name}</strong>
            </div>
            <div className="summary-line">
              <span>Branch</span>
              <strong>{userProfile?.branch}</strong>
            </div>
            <div className="summary-line">
              <span>Role</span>
              <strong>{userProfile?.interestedRole}</strong>
            </div>
            <div className="summary-line">
              <span>Graduation</span>
              <strong>{userProfile?.graduationYear}</strong>
            </div>
          </div>

          {skillAnalysis && (
            <div className="metric-card" style={{ marginBottom: 18 }}>
              <span>Placement skill average</span>
              <strong>{skillAnalysis.avgSkillsPlaced || "-"}</strong>
            </div>
          )}

          <div className="section-title" style={{ marginBottom: 12 }}>
            <Check size={20} />
            <div>
              <h2>{selectedSkills.length} selected</h2>
              <p>These are treated as acquired skills.</p>
            </div>
          </div>

          {selectedSkills.length > 0 ? (
            <div className="selected-skill-list" style={{ marginBottom: 18 }}>
              {selectedSkills.map((skill) => (
                <span key={skill} className="selected-skill">
                  <Check size={14} />
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <div className="empty-state-inner" style={{ marginBottom: 18 }}>
              <p style={{ color: "var(--text-muted)" }}>No acquired skills selected.</p>
            </div>
          )}

          <div className="btn-row">
            <button className="btn btn-primary" onClick={handleContinueToRoadmap}>
              Generate roadmap
              <ArrowRight size={18} />
            </button>
            <button className="btn btn-secondary" onClick={clearSelection} disabled={selectedSkills.length === 0}>
              <Trash2 size={17} />
              Clear
            </button>
          </div>
        </aside>

        <main className="library-panel">
          <section className="panel panel-tight">
            <div className="field" style={{ gap: 0 }}>
              <label htmlFor="skillSearch">Search skills</label>
              <div className="input-shell" style={{ marginTop: 8 }}>
                <Search size={17} />
                <input
                  id="skillSearch"
                  className="control"
                  type="text"
                  placeholder="Search by skill or category"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
            </div>
          </section>

          {categories.length === 0 ? (
            <section className="panel empty-state">
              <div className="empty-state-inner">
                <Search size={34} />
                <h3>No skills matched</h3>
                <p>Try a broader search term.</p>
              </div>
            </section>
          ) : (
            categories.map((category) => (
              <section key={category} className="category-section">
                <div className="category-section-header">
                  <h3>{category}</h3>
                  <span className="status-pill">{categoriesMap[category].length} skills</span>
                </div>
                <div className="skill-grid">
                  {categoriesMap[category].map((skill) => {
                    const isSelected = selectedSkills.includes(skill.name);

                    return (
                      <button
                        key={skill.id}
                        type="button"
                        className={`skill-button ${isSelected ? "is-selected" : ""}`}
                        onClick={() => toggleSkill(skill.name)}
                      >
                        {isSelected && <Check size={14} />}
                        {skill.name}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </main>
      </div>
    </div>
  );
}
