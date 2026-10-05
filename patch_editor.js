const fs = require('fs');
const path = 'p:/DSA404-chatBot/src/components/CodeChefCompilerModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add lastRunCode state
const stateRegex = /const \[compileResult, setCompileResult\] = useState<CompileResult \| null>\(null\);/;
const stateReplacement = `const [compileResult, setCompileResult] = useState<CompileResult | null>(null);
  const [lastRunCode, setLastRunCode] = useState<string>("");`;
content = content.replace(stateRegex, stateReplacement);

// 2. Initialize lastRunCode in the useEffect
const initRegex = /setCode\(initialCode\);\n\s*setCompileResult\(null\);/;
const initReplacement = `setCode(initialCode);
  setLastRunCode(initialCode.trim());
  setCompileResult(null);`;
content = content.replace(initRegex, initReplacement);

// 3. Update handleRunCode to setLastRunCode on success
const runSuccessRegex = /if \(result\.code === 0 && !result\.stderr\) \{\n\s*toast\.success\(`Executed successfully in \$\{result\.time \|\| "0s"\}! 🎉`\);\n\s*\}/;
const runSuccessReplacement = `if (result.code === 0 && !result.stderr) {
      setLastRunCode(code.trim());
      toast.success(\`Executed successfully in \$\{result.time || "0s"\}! 🎉\`);
    }`;
content = content.replace(runSuccessRegex, runSuccessReplacement);

// 4. Update canSubmit logic
const canSubmitRegex = /const canSubmit = compileResult\?\.code === 0 && !compileResult\.stderr;/;
const canSubmitReplacement = `const isCodeUnchangedSinceLastRun = code.trim() === lastRunCode;
  const canSubmit = (compileResult?.code === 0 && !compileResult.stderr) || isCodeUnchangedSinceLastRun;`;
content = content.replace(canSubmitRegex, canSubmitReplacement);

// 5. Add a Manual Push to GitHub Button. There is a "Save Solution" button at the end.
const buttonsRegex = /<Button\n\s*onClick=\{handleSave\}\n\s*disabled=\{busy \|\| !code\.trim\(\) \|\| !canSubmit\}/;
const buttonsReplacement = `<Button
              type="button"
              variant="outline"
              onClick={async () => {
                if (!canSubmit) {
                  toast.error("First run in live server to push.", { description: "You must run the code successfully before pushing." });
                  return;
                }
                if (!ghConfig?.enabled || !ghConfig?.repo) {
                  toast.error("GitHub sync is not configured.", { description: "Please configure your GitHub repo in the auto-sync settings below." });
                  setShowGitHubModal(true);
                  return;
                }
                setBusy(true);
                try {
                  const { pushProblemSolutionToGitHub } = await import("@/lib/github-sync");
                  const res = await pushProblemSolutionToGitHub(
                    user!.uid,
                    ghConfig,
                    problemName,
                    code,
                    selectedLang,
                    link.trim(),
                    keyPoints.trim(),
                    problem?.topic,
                    problem?.difficulty
                  );
                  if (res.success) toast.success("Manually pushed to GitHub! 🚀", { description: res.filePath });
                  else toast.error("GitHub push failed", { description: res.error });
                } catch (e: any) {
                  toast.error("GitHub push failed", { description: e.message });
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy || !code.trim() || !canSubmit}
              title={canSubmit ? "Push to GitHub manually" : "Run code successfully before pushing"}
              className="mr-2 border-border text-foreground hover:bg-accent"
            >
              <GitHubIcon className="mr-2 size-4" />
              Push to GitHub
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={busy || !code.trim() || !canSubmit}`;
content = content.replace(buttonsRegex, buttonsReplacement);

fs.writeFileSync(path, content);
console.log("Patched CodeChefCompilerModal successfully.");
