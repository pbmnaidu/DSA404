import { ReactNode } from "react";
import { QuoteLoader } from "@/components/QuoteLoader";

export const metadata = {
  title: "Admin Dashboard | DSA⁴⁰⁴",
  description: "Secure admin control panel.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Admin layout inherits theme from next-themes in root layout */}
      {children}
    </div>
  );
}
