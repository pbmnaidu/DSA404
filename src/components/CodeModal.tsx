"use client";

import type { CodeSubmission } from "@/lib/db";
import { CodeChefCompilerModal } from "./CodeChefCompilerModal";

interface CodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problemName: string;
  existingSubmission?: CodeSubmission;
  onSave: (code: string, link: string, keyPoints: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  readOnly?: boolean;
  initialTab?: "solution" | "compiler" | "codechef_ide";
}

export function CodeModal({
  open,
  onOpenChange,
  problemName,
  existingSubmission,
  onSave,
  onDelete,
  readOnly = false,
  initialTab = "solution",
}: CodeModalProps) {
  return (
    <CodeChefCompilerModal
      open={open}
      onOpenChange={onOpenChange}
      problemName={problemName}
      existingSubmission={existingSubmission}
      onSave={onSave}
      onDelete={onDelete}
      readOnly={readOnly}
      initialTab={initialTab}
    />
  );
}

