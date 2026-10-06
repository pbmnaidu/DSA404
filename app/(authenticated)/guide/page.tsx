"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { USER_GUIDE_CONTENT, GuideSection } from "@/lib/guide-content";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronRight, ChevronLeft, ExternalLink, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeCustomizer } from "../../../app/theme-customizer-context";

export default function GuidePage() {
  const { openPanel } = useThemeCustomizer();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSectionId, setActiveSectionId] = useState<string>(USER_GUIDE_CONTENT[0].id);

  // Load last read section from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("dsa404_last_guide_section");
    if (saved && USER_GUIDE_CONTENT.find(s => s.id === saved)) {
      setActiveSectionId(saved);
    }
  }, []);

  // Save active section to local storage
  useEffect(() => {
    localStorage.setItem("dsa404_last_guide_section", activeSectionId);
  }, [activeSectionId]);

  const filteredSections = useMemo(() => {
    if (!searchQuery) return USER_GUIDE_CONTENT;
    const lowerQ = searchQuery.toLowerCase();
    return USER_GUIDE_CONTENT.filter(
      (section) =>
        section.title.toLowerCase().includes(lowerQ) ||
        section.summary.toLowerCase().includes(lowerQ) ||
        section.steps.some(step => step.toLowerCase().includes(lowerQ))
    );
  }, [searchQuery]);

  const activeSection = useMemo(() => {
    return USER_GUIDE_CONTENT.find((s) => s.id === activeSectionId) || USER_GUIDE_CONTENT[0];
  }, [activeSectionId]);

  const activeIndex = USER_GUIDE_CONTENT.findIndex(s => s.id === activeSectionId);
  const prevSection = activeIndex > 0 ? USER_GUIDE_CONTENT[activeIndex - 1] : null;
  const nextSection = activeIndex < USER_GUIDE_CONTENT.length - 1 ? USER_GUIDE_CONTENT[activeIndex + 1] : null;

  return (
    <div className="flex h-full flex-col lg:flex-row gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      
      {/* Sidebar TOC */}
      <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">User Guide</h1>
          <p className="text-muted-foreground text-sm">Everything you need to master DSA⁴⁰⁴.</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="Search guide..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Card className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 font-semibold border-b border-border bg-muted/30">
            Table of Contents
          </div>
          <div className="overflow-y-auto p-2 flex flex-col gap-1 h-[300px] lg:h-[calc(100vh-280px)]">
            {filteredSections.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">No matching sections found.</p>
            ) : (
              filteredSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSectionId(section.id)}
                  className={cn(
                    "flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors",
                    activeSectionId === section.id 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <section.icon className={cn("size-4 shrink-0", activeSectionId === section.id ? "text-primary" : "text-muted-foreground")} />
                  <span className="truncate">{section.title}</span>
                </button>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Card className="flex-1 flex flex-col min-h-[500px]">
          <CardHeader className="border-b border-border bg-muted/10 pb-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                <activeSection.icon className="size-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">{activeSection.title}</CardTitle>
                <CardDescription className="text-base mt-1.5 text-foreground/80">
                  {activeSection.summary}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-6 flex flex-col">
            <div className="space-y-8 flex-1">
              {/* Steps */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-primary" />
                  How it works
                </h3>
                <ul className="space-y-3">
                  {activeSection.steps.map((step, idx) => (
                    <li key={idx} className="flex gap-3 text-muted-foreground">
                      <span className="flex items-center justify-center size-6 rounded-full bg-muted text-foreground text-xs font-medium shrink-0">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tips */}
              {activeSection.tips && activeSection.tips.length > 0 && (
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                  <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                    💡 Pro Tips
                  </h4>
                  <ul className="space-y-2">
                    {activeSection.tips.map((tip, idx) => (
                      <li key={idx} className="text-sm text-foreground/80 flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Try it now Link & Custom Action Button */}
              {(activeSection.route || activeSection.actionButton) && (
                <div className="pt-4 flex items-center gap-4">
                  {activeSection.route && (
                    activeSection.route === "#theme-panel" ? (
                      <Button onClick={openPanel} className="gap-2">
                        Try it now <ExternalLink className="size-4" />
                      </Button>
                    ) : (
                      <Button asChild>
                        <Link 
                          href={activeSection.route} 
                          className="gap-2" 
                          target={activeSection.route.startsWith('http') ? "_blank" : undefined}
                        >
                          Try it now <ExternalLink className="size-4" />
                        </Link>
                      </Button>
                    )
                  )}
                  {activeSection.actionButton && (
                    <Button variant="outline" asChild>
                      <Link href={activeSection.actionButton.route}>
                        {activeSection.actionButton.label} <ExternalLink className="size-4 ml-2" />
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-12 pt-6 border-t border-border">
              {prevSection ? (
                <Button 
                  variant="outline" 
                  onClick={() => setActiveSectionId(prevSection.id)}
                  className="gap-2 max-w-[45%] truncate"
                >
                  <ChevronLeft className="size-4 shrink-0" />
                  <span className="truncate hidden sm:inline">{prevSection.title}</span>
                  <span className="inline sm:hidden">Previous</span>
                </Button>
              ) : <div />}
              
              {nextSection ? (
                <Button 
                  variant="default" 
                  onClick={() => setActiveSectionId(nextSection.id)}
                  className="gap-2 max-w-[45%] truncate"
                >
                  <span className="truncate hidden sm:inline">{nextSection.title}</span>
                  <span className="inline sm:hidden">Next</span>
                  <ChevronRight className="size-4 shrink-0" />
                </Button>
              ) : <div />}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
