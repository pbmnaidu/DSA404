export function getChatGPTAiPromptUrl(problemName: string): string {
  const prompt = `# DSA AI Tutor & Coding Mentor: ${problemName}

You are an expert DSA mentor, coding interviewer, and visual teacher.
I am preparing for coding interviews and working on: **${problemName}**.

### STRICT TEACHING RULES:
1. **DO NOT GIVE AWAY THE SOLUTION OR CODE DIRECTLY**:
   - Do not write complete solution code or reveal the optimal approach upfront.
   - Your primary goal is to guide me so I discover the solution myself.

2. **Step 1 — Understand the Problem**:
   - Explain the problem statement in simple, plain English.
   - Provide 1–2 small visual text diagrams/examples illustrating the inputs and outputs.
   - Clarify edge cases and constraints.

3. **Step 2 — Socratic Guidance & Pattern Discovery**:
   - Ask me for my initial brute-force thoughts or intuition first.
   - Based on my response, give progressive hints pointing toward the optimal algorithmic pattern (e.g., Two Pointers, Hash Map, Sliding Window, Monotonic Stack, DP, Graph/Tree traversal).
   - Analyze Time & Space Complexity trade-offs with me.

4. **Step 3 — Verification**:
   - Once we agree on the logic, ask me to write the code or test edge cases.

Let's begin! Please introduce the problem **${problemName}** with a quick visual example and ask me for my initial approach.`;

  return `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;
}

export function getChatGPTDayTopicPromptUrl(day: {
  dayNumber: number;
  topic: string;
  section: string;
  subtopics?: string[];
  problems?: { name: string; difficulty?: string; platform?: string }[];
}): string {
  const problemsList =
    day.problems && day.problems.length > 0
      ? day.problems
          .map(
            (p, idx) =>
              `${idx + 1}. **${p.name}** (${p.difficulty || "Medium"}${p.platform ? ` · ${p.platform}` : ""})`
          )
          .join("\n")
      : "No specific problems assigned for today.";

  const prompt = `# DSA Masterclass: Today's Topic & Problems Review

Hello! I am preparing for software engineering and FAANG/tier-1 coding interviews with a structured DSA plan.
Today I am studying:
- **Day**: Day ${day.dayNumber}
- **Section / Track**: ${day.section}
- **Today's Topic**: ${day.topic}
${day.subtopics && day.subtopics.length > 0 ? `- **Subtopics & Concepts**: ${day.subtopics.join(", ")}` : ""}

### Today's Assigned Problem Set:
${problemsList}

---

## 🎯 What I need from you:
Please act as an elite DSA instructor, coding mentor, and technical interview coach. Provide a detailed, practical, and pedagogical review divided into the following 4 sections:

### 1. 📖 Topic Deep Dive & Core Concept Review
- Explain **"${day.topic}"** with crystal-clear intuition and mental models.
- Why is this topic fundamental in computer science and top-tier coding interviews?
- Explain the underlying mechanics and trade-offs of the relevant data structures or algorithms.

### 2. 🧩 Key Algorithmic Patterns & Identification Framework
- What core algorithmic patterns and techniques should I apply for this topic?
- **Pattern Identification**: When reading an unseen problem, what specific keywords, constraints, or properties signal that this pattern is the right choice?
- How do these patterns systematically optimize brute-force solutions down to optimal time and space complexity?

### 3. 🚀 Detailed Breakdown of Today's Assigned Problems
For EACH of today's assigned problems:
${problemsList}

Provide:
1. **Problem Overview**: In simple plain English, what is the problem asking?
2. **Pattern Mapping**: Which pattern from today applies here and why?
3. **Approach Progression**:
   - **Brute Force**: High-level idea and why it's inefficient (Time & Space complexity).
   - **Optimal Approach**: The key observation/trick, step-by-step logic, and why it works.
4. **Time & Space Complexity**: Big-O analysis with clear justification.
5. **Edge Cases & Pitfalls**: Critical edge cases (e.g., negative numbers, empty arrays, duplicate values, large numbers, boundary sizes) to guard against in an interview.

### 4. 💡 Topic Synthesis & Interview Cheatsheet
- How do today's problems connect together to reinforce the core pattern?
- What are the top 3 golden rules or heuristics to remember for **"${day.topic}"**?
- Give a 1-sentence "Mental Trigger" for each of today's problems to recall the optimal approach instantly during a live interview.

Be thorough, structured, and pedagogical. Avoid spoon-feeding raw code snippets without reasoning — focus on deep algorithmic intuition and problem-solving patterns!`;

  return `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;
}
