"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Database,
  GraduationCap,
  Search,
  Target,
  TrendingUp,
} from "lucide-react";
import { parseCSV, calculateCollegeRankings, analyzeSkillCorrelation } from "@/lib/dataProcessor";

const INITIAL_CATEGORIES = [];
const SESSION_KEYS = [
  "roadmapSelection",
  "categoryBenchmarks",
  "userProfile",
  "collegeRankings",
  "skillAnalysis",
  "userSkills",
];

export default function Dashboard() {
  const router = useRouter();
  const [colleges, setColleges] = useState([]);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [selectedCollegeName, setSelectedCollegeName] = useState("");
  const [categoryBenchmarks, setCategoryBenchmarks] = useState({});
  const [benchmarkSource, setBenchmarkSource] = useState("SJCE_Benchmark_Graded_Dataset.xlsx");
  const [loading, setLoading] = useState(true);
  const [placementData, setPlacementData] = useState([]);
  const [userProfile, setUserProfile] = useState({
    branch: "",
    interestedRole: "",
    graduationYear: "",
    selectedSkills: [],
  });

  const [jobTitles, setJobTitles] = useState([]);
  const [jobSearch, setJobSearch] = useState("");
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const [branches, setBranches] = useState([]);
  const [branchSearch, setBranchSearch] = useState("");
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);

  const currentYear = new Date().getFullYear();
  const graduationYears = Array.from({ length: 6 }, (_, index) => currentYear + index);

  const selectedCollege = useMemo(
    () => colleges.find((college) => college.name === selectedCollegeName) || null,
    [colleges, selectedCollegeName]
  );

  const processColleges = useCallback((parsedColleges, cats, providedBenchmarks = null) => {
    setColleges(parsedColleges);
    setCategories(cats);

    const benchmarks = {};
    cats.forEach((cat) => {
      let maxScore = -1;
      let topCollege = "Dataset benchmark";

      parsedColleges.forEach((college) => {
        const score = college.grades[cat.key] || 0;
        if (score > maxScore) {
          maxScore = score;
          topCollege = college.name;
        }
      });

      benchmarks[cat.key] = { score: maxScore, college: topCollege };
    });

    setCategoryBenchmarks(providedBenchmarks || benchmarks);
  }, []);

  const parseCSVText = useCallback((text) => {
    try {
      const lines = text.split(/\r?\n/);
      if (lines.length < 2) return;

      const header = lines[0].split(",").map((value) => value.trim());
      const newCategories = header.slice(1).map((key) => ({
        key,
        label: key.replace(/_/g, " "),
      }));

      const parsedColleges = [];
      for (let index = 1; index < lines.length; index += 1) {
        const line = lines[index].trim();
        if (!line) continue;

        const parts = line.split(",");
        if (parts.length >= header.length) {
          const name = parts[0].trim();
          const grades = {};
          let totalScore = 0;

          newCategories.forEach((cat) => {
            const columnIndex = header.indexOf(cat.key);
            const val = parseFloat(parts[columnIndex]);
            const score = Number.isNaN(val) ? 5 : Math.max(0, Math.min(10, val));
            grades[cat.key] = score;
            totalScore += score;
          });

          parsedColleges.push({ name, grades, totalScore });
        }
      }

      if (parsedColleges.length > 0) {
        processColleges(parsedColleges, newCategories);
      }
    } catch (error) {
      console.error("Fallback CSV parse failed:", error);
    } finally {
      setLoading(false);
    }
  }, [processColleges]);

  useEffect(() => {
    setTimeout(() => {
      SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
    }, 0);

    const loadPlacementData = async () => {
      try {
        const response = await fetch("/api/placement-data");
        if (response.ok) {
          const csvText = await response.text();
          setPlacementData(parseCSV(csvText));
        }
      } catch (error) {
        console.error("Failed to load placement data:", error);
      }
    };

    loadPlacementData();
  }, []);

  useEffect(() => {
    fetch("/api/college-benchmarks")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load benchmark workbook");
        return response.json();
      })
      .then((data) => {
        if (!data.colleges?.length || !data.categories?.length) {
          throw new Error("Benchmark workbook was empty");
        }

        processColleges(data.colleges, data.categories, data.categoryBenchmarks);
        setBenchmarkSource(data.source || "SJCE_Benchmark_Graded_Dataset.xlsx");
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load benchmark workbook:", error);
        fetch("/sjce_data.csv")
          .then((response) => response.text())
          .then((text) => {
            setBenchmarkSource("sjce_data.csv");
            parseCSVText(text);
          })
          .catch((csvError) => {
            console.error("Failed to load fallback dataset:", csvError);
            setLoading(false);
          });
      });

    fetch("/job_titles.json").then((response) => response.json()).then(setJobTitles).catch(() => {});
    fetch("/branches.json").then((response) => response.json()).then(setBranches).catch(() => {});

    const handleClickOutside = (event) => {
      if (!event.target.closest(".search-container")) {
        setShowJobDropdown(false);
        setShowBranchDropdown(false);
      }
    };

    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [parseCSVText, processColleges]);

  const collegeRankings = useMemo(() => {
    if (placementData.length > 0 && userProfile.branch) {
      return calculateCollegeRankings(
        placementData,
        userProfile.branch,
        userProfile.interestedRole || null
      );
    }

    return [];
  }, [placementData, userProfile.branch, userProfile.interestedRole]);

  const skillAnalysis = useMemo(() => {
    if (placementData.length > 0 && userProfile.interestedRole && userProfile.branch) {
      return analyzeSkillCorrelation(
        placementData,
        userProfile.interestedRole,
        userProfile.branch
      );
    }

    return null;
  }, [placementData, userProfile.interestedRole, userProfile.branch]);

  const benchmarkRows = useMemo(() => {
    if (!selectedCollege) return [];

    return categories
      .map((category) => {
        const score = selectedCollege.grades[category.key] ?? 0;
        const benchmark = categoryBenchmarks[category.key] || { score: 10, college: "Dataset benchmark" };
        const deficit = Math.round((benchmark.score - score) * 10) / 10;

        return {
          ...category,
          score,
          benchmark,
          deficit,
        };
      })
      .sort((a, b) => b.deficit - a.deficit);
  }, [categories, categoryBenchmarks, selectedCollege]);

  const averageScore = selectedCollege?.averageScore || 0;
  const benchmarkAverage = useMemo(() => {
    const values = Object.values(categoryBenchmarks).map((benchmark) => benchmark.score || 0);
    if (values.length === 0) return 0;
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
  }, [categoryBenchmarks]);
  const readinessScore = benchmarkAverage > 0 ? Math.min(100, Math.round((averageScore / benchmarkAverage) * 100)) : 0;

  const canContinue =
    !!selectedCollege &&
    !!userProfile.branch.trim() &&
    !!userProfile.interestedRole.trim() &&
    !!userProfile.graduationYear;

  const updateProfile = (name, value) => {
    setUserProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGenerateRoadmap = (event) => {
    event.preventDefault();
    if (!canContinue) return;

    localStorage.setItem("roadmapSelection", JSON.stringify(selectedCollege));
    localStorage.setItem("categoryBenchmarks", JSON.stringify(categoryBenchmarks));
    localStorage.setItem("userProfile", JSON.stringify(userProfile));
    localStorage.setItem("collegeRankings", JSON.stringify(collegeRankings));
    localStorage.setItem("skillAnalysis", JSON.stringify(skillAnalysis));
    localStorage.removeItem("userSkills");

    router.push("/skills");
  };

  if (loading) {
    return (
      <div className="workspace-page centered-state">
        <div>
          <div className="spinner"></div>
          <h2>Loading benchmark dataset</h2>
          <p>Reading college scores from the workbook.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">
            <Target size={16} />
            Benchmark setup
          </span>
          <h1>Start with your institution, branch, role, and graduation year.</h1>
          <p>
            The institution dropdown is populated from the college benchmark workbook. No college, role, or skill is selected in advance.
          </p>
        </div>
        <span className="data-pill">
          <Database size={16} />
          {benchmarkSource}
        </span>
      </header>

      <div className="setup-grid">
        <section className="panel">
          <div className="section-title">
            <GraduationCap size={22} />
            <div>
              <h2>Student inputs</h2>
              <p>Required fields for the roadmap generator.</p>
            </div>
          </div>

          <form className="form-stack" onSubmit={handleGenerateRoadmap}>
            <div className="field">
              <label htmlFor="institution">Selected institution</label>
              <div className="input-shell">
                <Building2 size={17} />
                <select
                  id="institution"
                  className="control"
                  value={selectedCollegeName}
                  onChange={(event) => setSelectedCollegeName(event.target.value)}
                >
                  <option value="">Select a college from the dataset</option>
                  {colleges.map((college) => (
                    <option key={college.name} value={college.name}>
                      {college.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field search-container">
              <label htmlFor="branch">Academic specialization</label>
              <div className="input-shell">
                <Search size={17} />
                <input
                  id="branch"
                  type="text"
                  className="control"
                  placeholder="Search or enter branch"
                  value={branchSearch}
                  onChange={(event) => {
                    setBranchSearch(event.target.value);
                    setShowBranchDropdown(true);
                    updateProfile("branch", event.target.value);
                  }}
                  onFocus={() => setShowBranchDropdown(true)}
                />
              </div>
              {showBranchDropdown && branchSearch.length > 0 && (
                <div className="autocomplete-results">
                  {branches
                    .filter((branch) => branch.toLowerCase().includes(branchSearch.toLowerCase()))
                    .slice(0, 6)
                    .map((branch) => (
                      <div
                        key={branch}
                        className="result-item"
                        onClick={() => {
                          setBranchSearch(branch);
                          setShowBranchDropdown(false);
                          updateProfile("branch", branch);
                        }}
                      >
                        {branch}
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="field search-container">
              <label htmlFor="role">Target role</label>
              <div className="input-shell">
                <BriefcaseBusiness size={17} />
                <input
                  id="role"
                  type="text"
                  className="control"
                  placeholder="Search or enter role"
                  value={jobSearch}
                  onChange={(event) => {
                    setJobSearch(event.target.value);
                    setShowJobDropdown(true);
                    updateProfile("interestedRole", event.target.value);
                  }}
                  onFocus={() => setShowJobDropdown(true)}
                />
              </div>
              {showJobDropdown && jobSearch.length > 0 && (
                <div className="autocomplete-results">
                  {jobTitles
                    .filter((title) => title.toLowerCase().includes(jobSearch.toLowerCase()))
                    .slice(0, 6)
                    .map((title) => (
                      <div
                        key={title}
                        className="result-item"
                        onClick={() => {
                          setJobSearch(title);
                          setShowJobDropdown(false);
                          updateProfile("interestedRole", title);
                        }}
                      >
                        {title}
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="field">
              <label htmlFor="graduationYear">Graduation year</label>
              <div className="input-shell">
                <CalendarDays size={17} />
                <select
                  id="graduationYear"
                  className="control"
                  value={userProfile.graduationYear}
                  onChange={(event) => updateProfile("graduationYear", event.target.value)}
                >
                  <option value="">Select graduation year</option>
                  {graduationYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={!canContinue}>
              Continue to skill inventory
              <ArrowRight size={18} />
            </button>
          </form>
        </section>

        <main className="insight-stack">
          <section className="panel panel-tight">
            <div className="overview-grid">
              <div className="metric-card">
                <span>Colleges</span>
                <strong>{colleges.length}</strong>
              </div>
              <div className="metric-card">
                <span>Benchmark columns</span>
                <strong>{categories.length}</strong>
              </div>
              <div className="metric-card">
                <span>Selected readiness</span>
                <strong>{selectedCollege ? `${readinessScore}%` : "-"}</strong>
              </div>
            </div>
          </section>

          {!selectedCollege ? (
            <section className="panel empty-state">
              <div className="empty-state-inner">
                <Building2 size={34} />
                <h3>Select an institution from the workbook</h3>
                <p>The benchmark comparison will appear here after a college name is chosen from the dataset dropdown.</p>
              </div>
            </section>
          ) : (
            <>
              <section className="panel">
                <div className="section-title">
                  <BarChart3 size={22} />
                  <div>
                    <h2>{selectedCollege.name} benchmark gaps</h2>
                    <p>Highest-gap categories are listed first.</p>
                  </div>
                </div>

                <div className="benchmark-list">
                  {benchmarkRows.slice(0, 10).map((row) => (
                    <div key={row.key} className="benchmark-row">
                      <div className="benchmark-name">
                        <strong>{row.label}</strong>
                        <span>Benchmark: {row.benchmark.score}/10 by {row.benchmark.college}</span>
                      </div>
                      <div>
                        <div className="progress-track" aria-hidden="true">
                          <div
                            className="progress-fill"
                            style={{ width: `${Math.max(0, Math.min(100, row.score * 10))}%` }}
                          ></div>
                        </div>
                        <div className="benchmark-meta">{row.score}/10 current score</div>
                      </div>
                      <span className={`score-chip ${row.deficit > 0 ? "gap-chip" : ""}`}>
                        {row.deficit > 0 ? `Gap ${row.deficit}` : "Met"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {collegeRankings.length > 0 && (
                <section className="panel">
                  <div className="section-title">
                    <TrendingUp size={22} />
                    <div>
                      <h2>Placement comparison</h2>
                      <p>Ranked using matching branch and target role data.</p>
                    </div>
                  </div>
                  <div className="rank-list">
                    {collegeRankings.slice(0, 5).map((ranking, index) => (
                      <div key={ranking.college} className="rank-card">
                        <span className="rank-number">{index + 1}</span>
                        <div>
                          <h4>{ranking.college}</h4>
                          <div className="rank-metrics">
                            <span>{ranking.placementRate}% placement</span>
                            <span>Rs. {ranking.avgPackage} LPA avg package</span>
                            <span>{ranking.avgSkillsCount} avg skills</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
