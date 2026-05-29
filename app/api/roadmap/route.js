import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Groq from "groq-sdk";
import { analyzeSkillCorrelation, calculateCollegeRankings, parseCSV } from "@/lib/dataProcessor";
import {
  buildBenchmarkComparison,
  getCollegeBenchmarkDataset,
} from "@/lib/collegeBenchmarks";

export const runtime = "nodejs";

const formatScore = (score) => (score === null || score === undefined ? "not available" : `${score}/10`);

const normalizeGraduationYear = (value) => {
  const currentYear = new Date().getFullYear();
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) return currentYear + 2;
  return Math.max(currentYear, parsed);
};

const getSemesterTerm = (semester, graduationYear) => {
  const academicOffset = Math.floor((8 - semester) / 2);

  if (semester % 2 === 1) {
    return `Aug-Dec ${graduationYear - 1 - academicOffset}`;
  }

  return `Jan-May ${graduationYear - academicOffset}`;
};

const buildSemesterPlan = (graduationYear) => {
  const currentYear = new Date().getFullYear();
  const yearsUntilGraduation = Math.max(0, graduationYear - currentYear);
  const semesterCount = Math.max(1, Math.min(8, yearsUntilGraduation * 2));
  const startSemester = Math.max(1, 9 - semesterCount);

  return Array.from({ length: 9 - startSemester }, (_, index) => {
    const semester = startSemester + index;
    const term = getSemesterTerm(semester, graduationYear);

    return {
      id: index + 1,
      semester,
      timeline: `Semester ${semester} (${term})`,
    };
  });
};

const readSkillsTaxonomy = () => {
  const csvPath = path.join(process.cwd(), "public", "technical_skills.csv");
  const fileContent = fs.readFileSync(csvPath, "utf8");
  const lines = fileContent.split(/\r?\n/);
  const skills = [];

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) continue;

    const parts = line.split(",");
    if (parts.length >= 3) {
      skills.push({
        id: parts[0].trim(),
        name: parts[1].trim(),
        category: parts[2].trim(),
      });
    }
  }

  return skills;
};

const buildSkillsSummary = (skillsList) => {
  const categoriesMap = {};

  skillsList.forEach((skill) => {
    if (!categoriesMap[skill.category]) categoriesMap[skill.category] = [];
    if (categoriesMap[skill.category].length < 20) categoriesMap[skill.category].push(skill.name);
  });

  return Object.entries(categoriesMap)
    .map(([category, skills]) => `- ${category}: ${skills.join(", ")}`)
    .join("\n");
};

const readPlacementData = () => {
  const candidatePaths = [
    path.join(process.cwd(), "college_students_skills_vs_placement_reality.csv"),
    path.join(process.cwd(), "public", "college_students_skills_vs_placement_reality.csv"),
  ];
  const csvPath = candidatePaths.find((candidate) => fs.existsSync(candidate));

  if (!csvPath) return [];

  return parseCSV(fs.readFileSync(csvPath, "utf8"));
};

const buildPlacementInsights = ({ placementData, userProfile, collegeRankings, skillAnalysis }) => {
  const branch = userProfile?.branch || null;
  const interestedRole = userProfile?.interestedRole || null;
  const rankings =
    Array.isArray(collegeRankings) && collegeRankings.length > 0
      ? collegeRankings
      : calculateCollegeRankings(placementData, branch, interestedRole);
  const analysis =
    skillAnalysis && Object.keys(skillAnalysis).length > 0
      ? skillAnalysis
      : interestedRole && branch
        ? analyzeSkillCorrelation(placementData, interestedRole, branch)
        : null;

  let placementInsights = "";

  if (rankings.length > 0) {
    const topCollege = rankings[0];
    placementInsights += `
### PLACEMENT DATA INSIGHTS:
- Top performer for ${branch || "all branches"} in ${interestedRole || "all roles"}: ${topCollege.college}
  - Placement Rate: ${topCollege.placementRate}%
  - Average Package: Rs. ${topCollege.avgPackage} LPA
  - Average Skills Count: ${topCollege.avgSkillsCount}
  - Average CGPA: ${topCollege.avgCGPA}
  - Internship Rate: ${topCollege.internshipRate}%
`;
  }

  if (analysis && Object.keys(analysis).length > 0) {
    placementInsights += `
- Success metrics for ${interestedRole}:
  - Overall Placement Rate: ${analysis.placementRate?.toFixed?.(1) ?? analysis.placementRate}%
  - Successful Students Had: ${analysis.avgSkillsPlaced} skills on average
  - Unsuccessful Students Had: ${analysis.avgSkillsNotPlaced} skills on average
  - Average Package for Placed: Rs. ${analysis.avgPackagePlaced} LPA
  - Minimum CGPA for Placement: ${analysis.criticalFactors?.minCGPAForPlacement}
  - Internship Significantly Boosts Placement: ${analysis.criticalFactors?.internshipBenefit ? "Yes" : "No"}
`;
  }

  return placementInsights || "### PLACEMENT DATA INSIGHTS:\n- No matching placement segment found; prioritize benchmark gaps, target role fit, internships, and portfolio proof.";
};

const buildBenchmarkLines = (benchmarkComparison) =>
  benchmarkComparison.comparison
    .map((item) => {
      const gap =
        item.deficit === null
          ? "selected score unavailable"
          : item.deficit > 0
            ? `gap ${item.deficit}`
            : "at or above benchmark";

      return `- ${item.label}: selected ${formatScore(item.selectedScore)} | benchmark ${item.benchmarkScore}/10 by ${item.benchmarkCollege} | ${gap}`;
    })
    .join("\n");

const buildPriorityGapLines = (benchmarkComparison) => {
  const priorityGaps = benchmarkComparison.priorityGaps.slice(0, 10);

  if (priorityGaps.length === 0) {
    return "- No positive benchmark gaps; focus on preserving advantages and role-specific depth.";
  }

  return priorityGaps
    .map((item) => `- ${item.label}: improve by ${item.deficit} points to match ${item.benchmarkCollege}`)
    .join("\n");
};

const sanitizeRoadmap = ({ roadmap, semesterPlan, skillsList, userSkills }) => {
  const taxonomyByName = new Map(skillsList.map((skill) => [skill.name.toLowerCase(), skill.name]));
  const existingSkills = new Set((userSkills || []).map((skill) => String(skill).toLowerCase()));
  const steps = Array.isArray(roadmap.steps) ? roadmap.steps : [];

  return {
    ...roadmap,
    steps: semesterPlan.map((semester, index) => {
      const step = steps[index] || {};
      const uniqueSkills = [];

      (Array.isArray(step.skills) ? step.skills : []).forEach((skill) => {
        const canonical = taxonomyByName.get(String(skill).toLowerCase());
        if (!canonical || existingSkills.has(canonical.toLowerCase()) || uniqueSkills.includes(canonical)) return;
        uniqueSkills.push(canonical);
      });

      return {
        ...step,
        id: index + 1,
        semester: semester.semester,
        timeline: semester.timeline,
        title: step.title || `Semester ${semester.semester} Execution Plan`,
        skills: uniqueSkills,
      };
    }),
  };
};

export async function POST(request) {
  try {
    const {
      collegeName,
      grades = {},
      userProfile,
      userSkills = [],
      collegeRankings,
      skillAnalysis,
    } = await request.json();

    if (!collegeName) {
      return NextResponse.json({ error: "Missing collegeName" }, { status: 400 });
    }

    const profile = userProfile || {};
    const graduationYear = normalizeGraduationYear(profile.graduationYear);
    const semesterPlan = buildSemesterPlan(graduationYear);
    const benchmarkDataset = await getCollegeBenchmarkDataset();
    const benchmarkComparison = buildBenchmarkComparison(benchmarkDataset, collegeName, grades);
    const skillsList = readSkillsTaxonomy();
    const skillsSummary = buildSkillsSummary(skillsList);
    const placementInsights = buildPlacementInsights({
      placementData: readPlacementData(),
      userProfile: profile,
      collegeRankings,
      skillAnalysis,
    });

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json(
        { error: "Groq API key not configured. Add GROQ_API_KEY to your .env file." },
        { status: 500 }
      );
    }

    const prompt = `
You are a Senior Career Strategist AI. Generate an accurate semester-wise roadmap by comparing the student's acquired skills with college benchmark gaps and placement success data.

### SOURCE OF TRUTH:
- College benchmark workbook: ${benchmarkDataset.source}, sheet: ${benchmarkDataset.sheetName}.
- Every numeric *_Score column is a benchmark dimension.
- For each dimension, the benchmark is the highest score in that workbook column across all colleges.
- Requested college: ${collegeName}
- Matched workbook college: ${benchmarkComparison.matchedCollegeName || "No exact workbook match; use available selected scores only"}

### STUDENT PROFILE:
- Date: ${new Date().toDateString()}
- Branch: ${profile.branch || "General Engineering"}
- Target role: ${profile.interestedRole || "Software Role"}
- Graduation year: ${graduationYear}
- Roadmap must contain exactly ${semesterPlan.length} semester steps:
${semesterPlan.map((semester) => `  - ${semester.timeline}`).join("\n")}
- Already acquired skills: ${userSkills.length > 0 ? userSkills.join(", ") : "none listed"}

${placementInsights}

### COLLEGE BENCHMARK COMPARISON:
${buildBenchmarkLines(benchmarkComparison)}

### HIGHEST PRIORITY BENCHMARK GAPS:
${buildPriorityGapLines(benchmarkComparison)}

### REFERENCE SKILLS TAXONOMY:
${skillsSummary}

### INSTRUCTIONS:
1. Build one roadmap step for each listed semester only. Do not combine multiple semesters into one phase.
2. Compare acquired skills against the target-role needs and benchmark gaps. Recommend only missing skills.
3. Do not re-list already acquired skills as recommended skills. You may mention them only as prerequisites already completed.
4. Recommended skills must use exact names from the REFERENCE SKILLS TAXONOMY.
5. Tie each semester to the highest-priority benchmark gaps, placement success metrics, internships, projects, CGPA, and interview readiness.
6. If the benchmark gap is large, include off-campus execution, external projects, certifications, and recruiter outreach.
7. Make the roadmap concrete enough for a student to execute: deliverables, projects, internships, assessment goals, and placement relevance.

### OUTPUT:
Respond with STRICT JSON only, no markdown, no code fences, no explanation:
{
  "strategyType": "Data-driven strategy name",
  "deficitSummary": "Summary of college benchmark gaps, acquired skills, and most critical missing capabilities.",
  "placementStrategy": "Specific actions to replicate successful placement patterns.",
  "benchmarkSource": "${benchmarkDataset.source}",
  "matchedCollege": "${benchmarkComparison.matchedCollegeName || ""}",
  "graduationYear": ${graduationYear},
  "steps": [
    {
      "id": 1,
      "semester": ${semesterPlan[0].semester},
      "title": "Semester-specific title",
      "category": "Domain from taxonomy",
      "description": "Specific semester action plan.",
      "skills": ["Exact taxonomy skill"],
      "timeline": "${semesterPlan[0].timeline}",
      "benchmarkFocus": ["Specific benchmark gap"],
      "deliverables": ["Concrete output"],
      "placementRelevance": "How this improves placement probability"
    }
  ]
}
`;

    const client = new Groq({ apiKey: groqKey });
    const chatCompletion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a data-driven career strategist AI. You MUST respond with valid JSON only. No markdown, no code fences, no explanation, just the raw JSON object.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.25,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    });

    const text = chatCompletion.choices?.[0]?.message?.content;
    if (!text) throw new Error("Empty AI response from Groq");

    const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    const roadmap = JSON.parse(cleaned);

    return NextResponse.json(
      sanitizeRoadmap({
        roadmap,
        semesterPlan,
        skillsList,
        userSkills,
      })
    );
  } catch (error) {
    console.error("Roadmap API Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
