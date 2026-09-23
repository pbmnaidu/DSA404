export interface SupportedLanguage {
  id: string;
  name: string;
  judge0Id: number;
  extension: string;
  starterCode: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  {
    id: "cpp",
    name: "C++ (GCC 13.2)",
    judge0Id: 105, // C++ (GCC 13.2.0)
    extension: "cpp",
    starterCode: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Write your solution logic here
    cout << "Hello from DSA404 CodeChef Compiler!" << endl;
    return 0;
}
`,
  },
  {
    id: "java",
    name: "Java (OpenJDK 17)",
    judge0Id: 91, // Java (OpenJDK 17.0.6)
    extension: "java",
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.println("Hello from DSA404 CodeChef Compiler!");
    }
}
`,
  },
  {
    id: "python",
    name: "Python 3 (3.11)",
    judge0Id: 92, // Python (3.11.2)
    extension: "py",
    starterCode: `# Write your Python solution here
import sys

def solve():
    print("Hello from DSA404 CodeChef Compiler!")

if __name__ == "__main__":
    solve()
`,
  },
  {
    id: "javascript",
    name: "JavaScript (Node.js 18)",
    judge0Id: 93, // JavaScript (Node.js 18.15.0)
    extension: "js",
    starterCode: `// Write your JavaScript solution here
function main() {
    console.log("Hello from DSA404 CodeChef Compiler!");
}

main();
`,
  },
  {
    id: "c",
    name: "C (GCC 13.2)",
    judge0Id: 103, // C (GCC 13.2.0)
    extension: "c",
    starterCode: `#include <stdio.h>

int main() {
    printf("Hello from DSA404 CodeChef Compiler!\\n");
    return 0;
}
`,
  },
  {
    id: "go",
    name: "Go (1.22)",
    judge0Id: 95, // Go (1.22.2)
    extension: "go",
    starterCode: `package main

import "fmt"

func main() {
    fmt.Println("Hello from DSA404 CodeChef Compiler!")
}
`,
  },
  {
    id: "rust",
    name: "Rust (1.77)",
    judge0Id: 96, // Rust (1.77.2)
    extension: "rs",
    starterCode: `fn main() {
    println!("Hello from DSA404 CodeChef Compiler!");
}
`,
  },
];

export interface CompileResult {
  stdout: string;
  stderr: string;
  output: string;
  code: number;
  time?: string;
  memory?: string;
  error?: string;
}

/**
  Executes code via Judge0 CE primary server, with Wandbox fallback
 */
export async function executeCode(
  languageId: string,
  sourceCode: string,
  stdin: string = ""
): Promise<CompileResult> {
  const langConfig = SUPPORTED_LANGUAGES.find((l) => l.id === languageId) || SUPPORTED_LANGUAGES[0];
  const startTime = performance.now();

  // 1. Primary Engine: Judge0 CE API (Fast, free, 100% non-authenticated open endpoint)
  try {
    const response = await fetch("https://ce.judge0.com/submissions?wait=true", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language_id: langConfig.judge0Id,
        source_code: sourceCode,
        stdin: stdin,
      }),
    });

    const duration = ((performance.now() - startTime) / 1000).toFixed(2);

    if (response.ok) {
      const data = await response.json();

      const stdout = data.stdout || "";
      const stderr = data.stderr || data.compile_output || (data.status?.id !== 3 ? data.status?.description : "") || "";
      const isSuccess = data.status?.id === 3; // 3 = Accepted in Judge0

      return {
        stdout: stdout,
        stderr: stderr,
        output: stdout || stderr || data.status?.description || "Execution finished.",
        code: isSuccess ? 0 : 1,
        time: `${data.time || duration}s`,
        memory: data.memory ? `${Math.round(data.memory / 1024)} KB` : undefined,
      };
    }
  } catch (judge0Err) {
    console.warn("Primary Judge0 execution failed, attempting fallback...", judge0Err);
  }

  // 2. Fallback Engine: In-browser JavaScript Sandbox for JavaScript
  if (languageId === "javascript") {
    try {
      const logs: string[] = [];
      const customConsole = {
        log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(" ")),
        error: (...args: any[]) => logs.push("[ERROR] " + args.map(a => String(a)).join(" ")),
        warn: (...args: any[]) => logs.push("[WARN] " + args.map(a => String(a)).join(" ")),
      };
      
      const runFn = new Function("console", "input", sourceCode);
      runFn(customConsole, stdin);

      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      return {
        stdout: logs.join("\n"),
        stderr: "",
        output: logs.join("\n") || "Code executed successfully with no output.",
        code: 0,
        time: `${duration}s`,
      };
    } catch (jsErr: any) {
      return {
        stdout: "",
        stderr: jsErr.message || String(jsErr),
        output: jsErr.message || String(jsErr),
        code: 1,
        time: "0.01s",
      };
    }
  }

  // 3. Fallback for C++ (Wandbox API)
  if (languageId === "cpp" || languageId === "c") {
    try {
      const wandboxCompiler = languageId === "cpp" ? "gcc-head" : "gcc-head-c";
      const response = await fetch("https://wandbox.org/api/compile.json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          compiler: wandboxCompiler,
          code: sourceCode,
          stdin: stdin,
        }),
      });

      const duration = ((performance.now() - startTime) / 1000).toFixed(2);

      if (response.ok) {
        const data = await response.json();
        const stdout = data.program_output || "";
        const stderr = data.compiler_error || data.program_error || "";
        return {
          stdout,
          stderr,
          output: stdout || stderr || "Execution complete.",
          code: data.status === "0" ? 0 : 1,
          time: `${duration}s`,
        };
      }
    } catch (wbErr) {
      console.warn("Wandbox fallback failed:", wbErr);
    }
  }

  return {
    stdout: "",
    stderr: "Execution server error. Please try clicking 'CodeChef Official IDE 👨‍🍳' tab to compile directly on CodeChef.",
    output: "Execution server error. Please try clicking 'CodeChef Official IDE 👨‍🍳' tab to compile directly on CodeChef.",
    code: 1,
    error: "Server Error",
  };
}

export function getCodeChefIdeUrl(): string {
  return "https://www.codechef.com/ide";
}
