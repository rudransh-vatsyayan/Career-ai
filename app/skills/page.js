"use client";

import { useState, useEffect } from "react";

export default function SkillsPage() {
  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load selected skills from localStorage
    const saved = localStorage.getItem("userSkills");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTimeout(() => {
          setSelectedSkills(parsed);
        }, 0);
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
      <div className="glass-panel" style={{ textAlign: "center", padding: "4rem" }}>
        <div className="spinner"></div>
        <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>Loading skills database...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container animate-in">
      <header className="page-hero" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 className="hero-title">Skill Matrix</h1>
          <p className="hero-subtitle">Catalog your technical stack to allow the AI to architect a complementary learning path.</p>
        </div>
        {selectedSkills.length > 0 && (
          <div style={{ textAlign: "right", paddingBottom: "1rem" }}>
            <div className="status-badge" style={{ marginBottom: "0.75rem" }}>
              {selectedSkills.length} COMPETENCIES IDENTIFIED
            </div>
            <button onClick={clearSelection} className="btn-reset" style={{ width: "auto", margin: 0, padding: "0.5rem 1.25rem", color: "var(--accent-error)", borderColor: "rgba(239, 68, 68, 0.2)" }}>
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
                  <span className="status-badge" style={{ fontSize: "0.7rem", padding: "0.2rem 0.6rem", background: "rgba(255,255,255,0.03)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>{list.length}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  {list.map((skill) => {
                    const isSelected = selectedSkills.includes(skill.name);
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
                          border: isSelected ? "1px solid var(--brand-primary)" : "1px solid var(--border-subtle)",
                          background: isSelected ? "var(--brand-glow)" : "rgba(255,255,255,0.02)",
                          color: isSelected ? "var(--brand-primary)" : "var(--text-secondary)",
                          transition: "var(--transition-smooth)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem"
                        }}
                      >
                        {isSelected && <span style={{ fontSize: "1rem" }}>✓</span>}
                        {skill.name}
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
