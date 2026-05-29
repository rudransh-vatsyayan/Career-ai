import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Groq from "groq-sdk";

export async function POST(request) {
  try {
    const { collegeName, grades, categoryBenchmarks, userProfile, userSkills } = await request.json();

    if (!collegeName || !grades) {
      return NextResponse.json({ error: "Missing collegeName or grades" }, { status: 400 });
    }

    const currentYear = new Date().getFullYear();
    const gradYear = userProfile?.graduationYear || (currentYear + 2);
    const yearsRemaining = Math.max(1, gradYear - currentYear);

    // 1. Read technical_skills.csv for reference skill taxonomy
    const csvPath = path.join(process.cwd(), "technical_skills.csv");
    let skillsList = [];
    try {
      const fileContent = fs.readFileSync(csvPath, "utf8");
      const lines = fileContent.split(/\r?\n/);
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(",");
        if (parts.length >= 3) {
          skillsList.push({ id: parts[0].trim(), name: parts[1].trim(), category: parts[2].trim() });
        }
      }
    } catch (err) {
      console.error("CSV Read Error:", err);
    }

    // Group skills by category (max 20 per category)
    const categoriesMap = {};
    skillsList.forEach(s => {
      if (!categoriesMap[s.category]) categoriesMap[s.category] = [];
      if (categoriesMap[s.category].length < 20) categoriesMap[s.category].push(s.name);
    });
    const skillsSummary = Object.entries(categoriesMap)
      .map(([c, s]) => `- **${c}**: ${s.join(", ")}`)
      .join("\n");

    // 2. Groq API Setup
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json(
        { error: "Groq API key not configured. Add GROQ_API_KEY to your .env file." },
        { status: 500 }
      );
    }

    // 3. Prompt Construction
    const prompt = `
You are a Senior Career Strategist AI. Generate a professional, multi-year upskilling roadmap for a student.

### CONTEXT:
- **Date**: ${new Date().toDateString()}
- **Student Profile**: ${userProfile?.branch || "General Engineering"}, targeting **${userProfile?.interestedRole || "Software Role"}**.
- **Graduation Year**: ${gradYear} (${yearsRemaining} years remaining).
- **Existing Skills**: ${userSkills?.length > 0 ? userSkills.join(", ") : "Entry-level (no specific skills listed)"}.

### INSTITUTIONAL GAP ANALYSIS (Category-Wise):
The student's college ("${collegeName}") is evaluated against the *regional best* performer in each category:
${Object.entries(grades).map(([key, val]) => {
  const bench = categoryBenchmarks?.[key] || { score: 10, college: "Gold Standard" };
  const variance = bench.score - val;
  return `- ${key.replace(/_/g, " ")}: ${val}/10 (Regional Best: ${bench.score}/10 by ${bench.college} | Variance: -${variance})`;
}).join("\n")}

### REFERENCE SKILLS TAXONOMY (from database):
${skillsSummary}

### INSTRUCTIONS:
1. **Strategic Pivot**: If variances are large (deficit > 3), prioritize "Aggressive Off-Campus" tracks.
2. **Timeline Alignment**: Break the roadmap into ${yearsRemaining * 2} semesters/phases.
3. **Outcome Focused**: Ensure the skills recommended directly contribute to becoming a **${userProfile?.interestedRole || "Software Engineer"}**.
4. **No Redundancy**: Acknowledge but do NOT re-list existing skills: ${userSkills?.join(", ") || "none"}.
5. **Use the taxonomy**: Only recommend skills that exist in the REFERENCE SKILLS TAXONOMY above.

### OUTPUT — respond with STRICT JSON only, no markdown, no explanation:
{
  "strategyType": "e.g., Aggressive Industrial-Ready Track",
  "deficitSummary": "Professional summary of the institutional gap and chosen strategy.",
  "steps": [
    {
      "id": 1,
      "title": "Year/Phase Title",
      "category": "Domain from taxonomy",
      "description": "Specific action items for this phase.",
      "skills": ["Skill1", "Skill2"],
      "timeline": "e.g., Semester 1-2 (Year 1)"
    }
  ]
}
`;

    // 4. Call Groq (uses Llama 3.3 70B — free tier)
    const client = new Groq({ apiKey: groqKey });
    const chatCompletion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a career strategist AI. You MUST respond with valid JSON only. No markdown, no code fences, no explanation — just the raw JSON object."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    });

    const text = chatCompletion.choices?.[0]?.message?.content;
    if (!text) throw new Error("Empty AI response from Groq");

    // Strip any accidental markdown code fences before parsing
    const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    return NextResponse.json(JSON.parse(cleaned));

  } catch (error) {
    console.error("Roadmap API Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
