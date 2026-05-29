"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const INITIAL_CATEGORIES = [
  { key: "Placement_Statistics", label: "Placement Statistics" },
  { key: "Accreditation_Rankings", label: "Accreditation & Rankings" },
  { key: "Fees_Structure", label: "Fees Structure" },
  { key: "Admission_Cutoffs", label: "Admission Cutoffs" },
  { key: "Courses_Seats", label: "Courses & Seats" },
  { key: "Faculty_Research", label: "Faculty & Research" },
  { key: "Infrastructure", label: "Infrastructure" },
  { key: "Internship_Opportunities", label: "Internship Opportunities" },
  { key: "Student_Life_Activities", label: "Student Life & Activities" },
  { key: "Location_Industry_Connect", label: "Location & Industry Connect" },
  { key: "Alumni_Network", label: "Alumni Network" },
  { key: "Value_for_Money_ROI", label: "Value for Money (ROI)" }
];

export default function Dashboard() {
  const router = useRouter();
  const [colleges, setColleges] = useState([]);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [categoryBenchmarks, setCategoryBenchmarks] = useState({}); // Top performer per category
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(true);

  // User Profile State
  const [userProfile, setUserProfile] = useState({
    collegeName: "",
    branch: "",
    interestedRole: "",
    graduationYear: new Date().getFullYear() + 2,
    isManualCollege: false
  });

  const [jobTitles, setJobTitles] = useState([]);
  const [jobSearch, setJobSearch] = useState("");
  const [showJobDropdown, setShowJobDropdown] = useState(false);

  const [branches, setBranches] = useState([]);
  const [branchSearch, setBranchSearch] = useState("");
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);

  const processColleges = useCallback((parsedColleges, cats) => {
    setColleges(parsedColleges);
    setCategories(cats);

    // Compute category benchmarks (highest score for each category)
    const benchmarks = {};
    cats.forEach(cat => {
      let maxScore = -1;
      let topCollege = "Standard";
      parsedColleges.forEach(col => {
        const score = col.grades[cat.key] || 0;
        if (score > maxScore) {
          maxScore = score;
          topCollege = col.name;
        }
      });
      benchmarks[cat.key] = { score: maxScore, college: topCollege };
    });
    setCategoryBenchmarks(benchmarks);

    // Default selection to SJCE if available
    const sjce = parsedColleges.find(c => c.name.includes("SJCE") || c.name.includes("JSS"));
    setSelectedCollege(sjce || parsedColleges[0]);
  }, []);

  const parseCSVText = useCallback((text, isDefault = false) => {
    try {
      const lines = text.split(/\r?\n/);
      if (lines.length < 2) return;
      
      const header = lines[0].split(",").map(s => s.trim());
      const newCategories = header.slice(1).map(key => ({
        key,
        label: key.replace(/_/g, " ")
      }));

      const parsedColleges = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(",");
        if (parts.length >= header.length) {
          const name = parts[0].trim();
          const grades = {};
          let totalScore = 0;
          newCategories.forEach(cat => {
            const index = header.indexOf(cat.key);
            const val = parseInt(parts[index], 10);
            const score = isNaN(val) ? 5 : Math.max(1, Math.min(10, val));
            grades[cat.key] = score;
            totalScore += score;
          });
          parsedColleges.push({ name, grades, totalScore });
        }
      }

      if (parsedColleges.length > 0) {
        processColleges(parsedColleges, newCategories);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [processColleges]);

  // 1. Initial Load
  useEffect(() => {
    const cachedProfile = localStorage.getItem("userProfile");
    
    if (cachedProfile) {
      try {
        const parsedProfile = JSON.parse(cachedProfile);
        setTimeout(() => {
          setUserProfile(parsedProfile);
          setJobSearch(parsedProfile.interestedRole || "");
          setBranchSearch(parsedProfile.branch || "");
        }, 0);
      } catch (e) {
        console.error("Failed to parse cached profile", e);
      }
    }

    // Always fetch the official SJCE dataset
    fetch("/sjce_data.csv")
      .then(res => res.text())
      .then(text => parseCSVText(text, true))
      .catch(err => {
        console.error("Failed to load official dataset:", err);
        setLoading(false);
      });

    // Fetch static datasets
    fetch("/job_titles.json").then(res => res.json()).then(setJobTitles).catch(() => {});
    fetch("/branches.json").then(res => res.json()).then(setBranches).catch(() => {});

    const handleClickOutside = (e) => {
      if (!e.target.closest(".search-container")) {
        setShowJobDropdown(false);
        setShowBranchDropdown(false);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [parseCSVText]);

  const handleGenerateRoadmap = (e) => {
    if (e) e.preventDefault();
    if (userProfile.isManualCollege && !userProfile.collegeName) {
      alert("Please enter your college name.");
      return;
    }
    if (!userProfile.isManualCollege && !selectedCollege) {
      alert("Please select a college.");
      return;
    }
    
    const finalCollege = userProfile.isManualCollege 
      ? { name: userProfile.collegeName, grades: {}, totalScore: 0 }
      : selectedCollege;

    localStorage.setItem("roadmapSelection", JSON.stringify(finalCollege));
    localStorage.setItem("categoryBenchmarks", JSON.stringify(categoryBenchmarks));
    localStorage.setItem("userProfile", JSON.stringify(userProfile));
    
    router.push("/roadmap");
  };

  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newVal = type === "checkbox" ? checked : value;
    setUserProfile(prev => {
      const updated = { ...prev, [name]: newVal };
      localStorage.setItem("userProfile", JSON.stringify(updated));
      return updated;
    });
  };

  if (loading) return (
    <div className="loading-screen" style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "var(--bg-gradient)" }}>
      <div className="spinner"></div>
    </div>
  );

  return (
    <div className="dashboard-container animate-in">
      <header className="page-hero">
        <h1 className="hero-title">Career Benchmarking</h1>
        <p className="hero-subtitle">
          Evaluate institutional performance metrics against regional leaders to architect your professional trajectory.
        </p>
      </header>

      <div className="dashboard-grid">
        {/* Profile Sidebar */}
        <aside className="sidebar-column">
          <section className="glass-panel">
            <h2 className="panel-title">
              <span>👤</span> Candidate Profile
            </h2>
            <form onSubmit={handleGenerateRoadmap} className="profile-form">
              <div className="form-group search-container">
                <label>Academic Specialization</label>
                <input
                  type="text"
                  className="search-bar"
                  placeholder="Search branch (e.g. Computer Science)..."
                  value={branchSearch}
                  onChange={(e) => {
                    setBranchSearch(e.target.value);
                    setShowBranchDropdown(true);
                    handleProfileChange({ target: { name: "branch", value: e.target.value } });
                  }}
                  onFocus={() => setShowBranchDropdown(true)}
                />
                {showBranchDropdown && branchSearch.length > 0 && (
                  <div className="autocomplete-results">
                    {branches.filter(b => b.toLowerCase().includes(branchSearch.toLowerCase())).slice(0, 5).map(b => (
                      <div key={b} className="result-item" onClick={() => {
                        setBranchSearch(b);
                        setShowBranchDropdown(false);
                        handleProfileChange({ target: { name: "branch", value: b } });
                      }}>{b}</div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group search-container">
                <label>Target Industry Role</label>
                <input
                  type="text"
                  className="search-bar"
                  placeholder="Search roles (e.g. Cloud Architect)..."
                  value={jobSearch}
                  onChange={(e) => {
                    setJobSearch(e.target.value);
                    setShowJobDropdown(true);
                    handleProfileChange({ target: { name: "interestedRole", value: e.target.value } });
                  }}
                  onFocus={() => setShowJobDropdown(true)}
                />
                {showJobDropdown && jobSearch.length > 0 && (
                  <div className="autocomplete-results">
                    {jobTitles.filter(t => t.toLowerCase().includes(jobSearch.toLowerCase())).slice(0, 5).map(t => (
                      <div key={t} className="result-item" onClick={() => {
                        setJobSearch(t);
                        setShowJobDropdown(false);
                        handleProfileChange({ target: { name: "interestedRole", value: t } });
                      }}>{t}</div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Expected Graduation</label>
                <select name="graduationYear" className="college-select" value={userProfile.graduationYear} onChange={handleProfileChange}>
                  {[2024, 2025, 2026, 2027, 2028, 2029].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div className="checkbox-row">
                <input type="checkbox" name="isManualCollege" id="isManual" checked={userProfile.isManualCollege} onChange={handleProfileChange} />
                <label htmlFor="isManual" style={{ fontSize: "0.9rem", color: "var(--text-secondary)", cursor: "pointer", userSelect: "none", fontWeight: 600 }}>Manual Institution Entry</label>
              </div>

              {userProfile.isManualCollege ? (
                <div className="form-group animate-in">
                  <label>Official Institution Name</label>
                  <input type="text" name="collegeName" className="search-bar" placeholder="Enter your college..." value={userProfile.collegeName} onChange={handleProfileChange} />
                </div>
              ) : (
                <div className="form-group">
                  <label>Selected Institution</label>
                  <select className="college-select" value={selectedCollege?.name} onChange={(e) => setSelectedCollege(colleges.find(c => c.name === e.target.value))}>
                    {colleges.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ marginTop: "1rem" }}>
                Generate Strategy 🚀
              </button>
            </form>
          </section>
        </aside>

        {/* Analytics Main View */}
        <main className="analytics-column">
          {selectedCollege && (
            <section className="glass-panel">
              <div className="analytics-header">
                <div>
                  <h2 className="panel-title" style={{ marginBottom: "0.25rem" }}>
                    <span>📊</span> Regional Gap Analysis
                  </h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                    Performance variance of <strong>{selectedCollege.name}</strong> vs regional category leaders.
                  </p>
                </div>
                <div className="status-badge">Official Dataset: SJCE-2024</div>
              </div>

              <div className="category-matrix" style={{ marginTop: "3rem" }}>
                {categories.map(cat => {
                  const score = selectedCollege.grades[cat.key] || 0;
                  const bench = categoryBenchmarks[cat.key];
                  const deficit = (bench?.score || 10) - score;
                  
                  return (
                    <div key={cat.key} className="category-card">
                      <div className="category-info">
                        <span className="category-name">{cat.label}</span>
                        <span className="category-score">{score}/10</span>
                      </div>
                      <div className="progress-track">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${score * 10}%`,
                            background: score >= 8 ? "var(--accent-success)" : score >= 5 ? "var(--accent-warning)" : "var(--accent-error)"
                          }}
                        ></div>
                        <div className="benchmark-pin" style={{ left: `${(bench?.score || 10) * 10}%` }}></div>
                      </div>
                      <div className="category-meta">
                        <span>Best: {bench?.score} ({bench?.college})</span>
                        {deficit > 0 && <span className="deficit-indicator">Gap: -{deficit}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
