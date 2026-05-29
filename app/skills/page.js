"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SkillsPage() {
  const router = useRouter();
  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [skillAnalysis, setSkillAnalysis] = useState(null);
  const [recommendedSkills, setRecommendedSkills] = useState([]);

  useEffect(() => {
    // Load user profile and skill analysis from localStorage
    const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
    const analysis = JSON.parse(localStorage.getItem("skillAnalysis") || "null");
    const saved = localStorage.getItem("userSkills");
    
    setUserProfile(profile);
    setSkillAnalysis(analysis);
    
    if (saved) {
      try {
        setSelectedSkills(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved skills", e);
      }
    }

    fetch("/technical_skills.csv")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load skills dataset");
        return res.text();
      })
      .then((text) => {
        const lines = text.split(/\r?\n/);
        const parsed = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
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
        
        // Set recommended skills based on analysis
        if (analysis && analysis.avgSkillsPlaced) {
          const recommendCount = Math.ceil(parseFloat(analysis.avgSkillsPlaced));
          const recommended = parsed.slice(0, recommendCount).map(s => s.name);
          setRecommendedSkills(recommended);
          
          // Auto-select recommended skills if none selected yet
          if (!saved) {
            setSelectedSkills(recommended);
            localStorage.setItem("userSkills", JSON.stringify(recommended));
          }
        }
        
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching skills:", err);
        setLoading(false);
      });
  }, []);

  const toggleSkill = (skillName) => {
    let newSelection;
    if (selectedSkills.includes(skillName)) {
      newSelection = selectedSkills.filter(s => s !== skillName);
    } else {
      newSelection = [...selectedSkills, skillName];
    }
    setSelectedSkills(newSelection);
    localStorage.setItem("userSkills", JSON.stringify(newSelection));
  };

  const clearSelection = () => {
    setSelectedSkills([]);
    localStorage.removeItem("userSkills");
  };

  const handleContinueToRoadmap = () => {
    const updatedProfile = { ...userProfile, selectedSkills };
    localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
    router.push("/roadmap");
  };

  // Filter skills based on search query
  const filteredSkills = skills.filter(
    (skill) =>
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by category
  const categoriesMap = {};
  filteredSkills.forEach((skill) => {
    if (!categoriesMap[skill.category]) {
      categoriesMap[skill.category] = [];
    }
    categoriesMap[skill.category].push(skill);
  });

  const categories = Object.keys(categoriesMap).sort();

  if (loading) {
    return (
      <div className="loading-screen" style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "var(--bg-gradient)" }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container animate-in">
      <header className="page-hero" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 className="hero-title">Skill Matrix</h1>
          <p className="hero-subtitle">
            {skillAnalysis 
              ? `Based on placement data, ${Math.ceil(parseFloat(skillAnalysis.avgSkillsPlaced))} skills helped successful graduates in your target role.`
              : "Catalog your technical stack to allow the AI to architect a complementary learning path."
            }
          </p>
        </div>
        {selectedSkills.length > 0 && (
          <div style={{ textAlign: "right", paddingBottom: "1rem" }}>
            <div className="status-badge" style={{ marginBottom: "0.75rem" }}>
              {selectedSkills.length} COMPETENCIES IDENTIFIED
            </div>
            <button 
              onClick={handleContinueToRoadmap} 
              className="btn-primary" 
              style={{ width: "auto", margin: 0, padding: "0.5rem 1.25rem", marginRight: "0.5rem" }}
            >
              Generate Roadmap 🚀
            </button>
            <button 
              onClick={clearSelection} 
              className="btn-reset" 
              style={{ width: "auto", margin: 0, padding: "0.5rem 1.25rem", color: "var(--accent-error)", borderColor: "rgba(239, 68, 68, 0.2)" }}
            >
              Reset Taxonomy
            </button>
          </div>
        )}
      </header>

      <section className="glass-panel" style={{ padding: "1.75rem", marginBottom: "3rem" }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Global Taxonomy Search</label>
          <input
            type="text"
            className="search-bar"
            placeholder="Search competencies (e.g. Distributed Systems, Neural Networks, React)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: "rgba(0,0,0,0.2)" }}
          />
        </div>
      </section>

      {/* Info Panel */}
      {skillAnalysis && (
        <section className="glass-panel" style={{ padding: "1.5rem", marginBottom: "2rem", background: "rgba(76, 175, 80, 0.08)", borderLeft: "4px solid var(--accent-success)" }}>
          <h3 style={{ marginBottom: "0.75rem" }}>📊 Placement Insights for {userProfile?.interestedRole}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Placement Rate</p>
              <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--accent-success)" }}>
                {skillAnalysis.placementRate?.toFixed(1)}%
              </p>
            </div>
            <div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Avg Skills (Placed)</p>
              <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--accent-success)" }}>
                {skillAnalysis.avgSkillsPlaced}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Avg Package</p>
              <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--accent-success)" }}>
                ₹{skillAnalysis.avgPackagePlaced} LPA
              </p>
            </div>
          </div>
        </section>
      )}

      {categories.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "5rem" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>No competencies matched your current query criteria.</p>
        </div>
      ) : (
        <div className="category-matrix" style={{ marginTop: 0 }}>
          {categories.map((catName) => {
            const list = categoriesMap[catName];
            return (
              <div key={catName} className="glass-panel" style={{ padding: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1rem" }}>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>{catName}</h3>
                  <span className="status-badge" style={{ fontSize: "0.7rem", padding: "0.2rem 0.6rem", background: "rgba(255,255,255,0.03)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                    {list.length} Skills
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  {list.map((skill) => {
                    const isSelected = selectedSkills.includes(skill.name);
                    const isRecommended = recommendedSkills.includes(skill.name);
                    return (
                      <div 
                        key={skill.id} 
                        onClick={() => toggleSkill(skill.name)}
                        style={{ 
                          cursor: "pointer",
                          padding: "0.5rem 1rem",
                          borderRadius: "10px",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          border: isSelected ? "1px solid var(--brand-primary)" : isRecommended ? "1px solid var(--accent-success)" : "1px solid var(--border-subtle)",
                          background: isSelected ? "var(--brand-glow)" : isRecommended ? "rgba(76, 175, 80, 0.08)" : "rgba(255,255,255,0.02)",
                          color: isSelected ? "var(--brand-primary)" : "var(--text-secondary)",
                          transition: "var(--transition-smooth)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem"
                        }}
                      >
                        {isSelected && <span style={{ fontSize: "1rem" }}>✓</span>}
                        {skill.name}
                        {isRecommended && <span style={{ fontSize: "0.75rem" }}>⭐</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
