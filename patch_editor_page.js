const fs = require('fs');
const path = 'p:/DSA404-chatBot/app/(authenticated)/editor/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const stateRegex = /const \[compileResult, setCompileResult\] = useState<CompileResult \| null>\(null\);/;
const stateReplacement = `const [compileResult, setCompileResult] = useState<CompileResult | null>(null);
  const [lastRunCode, setLastRunCode] = useState<string>("");`;
content = content.replace(stateRegex, stateReplacement);

const initRegex = /if \(existingSubmission\?\.code\) \{\n\s*setCode\(existingSubmission\.code\);\n\s*\}/;
const initReplacement = `if (existingSubmission?.code) {
      setCode(existingSubmission.code);
      setLastRunCode(existingSubmission.code.trim());
    }`;
content = content.replace(initRegex, initReplacement);

const runSuccessRegex = /if \(result\.code === 0 && !result\.stderr\) toast\.success\("Compiled and ran successfully\."\);/;
const runSuccessReplacement = `if (result.code === 0 && !result.stderr) {
        setLastRunCode(code.trim());
        toast.success("Compiled and ran successfully.");
      }`;
content = content.replace(runSuccessRegex, runSuccessReplacement);

const canSubmitRegex = /const canSubmit = compileResult\?\.code === 0 && !compileResult\.stderr;/;
const canSubmitReplacement = `const isCodeUnchangedSinceLastRun = code.trim() === lastRunCode;
  const canSubmit = (compileResult?.code === 0 && !compileResult.stderr) || isCodeUnchangedSinceLastRun;`;
content = content.replace(canSubmitRegex, canSubmitReplacement);

fs.writeFileSync(path, content);
console.log("Patched editor/page.tsx successfully.");
