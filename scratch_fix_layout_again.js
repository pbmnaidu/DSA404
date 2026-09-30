const fs = require('fs');

function fixCoderProfile() {
  const filePath = 'p:/DSA404-chatBot/src/components/CoderProfilePage.tsx';
  let content = fs.readFileSync(filePath, 'utf8');

  // Find {/* ── PROFILE WORKSPACE ── */} and { /* Gmail Requirement Modal */}
  const parts = content.split('{/* ── PROFILE WORKSPACE ── */}');
  if (parts.length < 2) return;
  const before = parts[0];
  const tailParts = parts[1].split('{/* Gmail Requirement Modal */}');
  const after = '{/* Gmail Requirement Modal */}' + tailParts[1];

  const middle = `
        {/* ── TWO COLUMN WORKSPACE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* PRIMARY COLUMN: Main Analytics */}
          <main className="lg:col-span-8 space-y-8 min-w-0 order-2 lg:order-1">
            
            {/* Unified Platform Profiles (Full Width of Primary Column) */}
            <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
              <UnifiedProfileDashboard
                initialProfiles={codingProfiles as Record<string, string>}
                initialStats={platformStats}
                userId={user?.uid}
                onSaveProfiles={async (updated) => {
                  setCodingProfiles(updated);
                  setDraftProfiles((prev) => ({ ...prev, ...updated }));
                  if (typeof window !== "undefined") {
                    try {
                      localStorage.setItem("dsa_coding_profiles_v2", JSON.stringify(updated));
                      if (user?.uid) {
                        localStorage.setItem("dsa_coding_profiles_" + user.uid, JSON.stringify(updated));
                      }
                      window.dispatchEvent(
                        new CustomEvent("ldt_coding_profiles_updated", {
                          detail: { codingProfiles: updated },
                        })
                      );
                    } catch {}
                  }
                  if (user) {
                    saveUserProfile(user.uid, { codingProfiles: updated }).catch(console.error);
                  }
                }}
              />
            </div>

            {/* Solved Days Heatmap */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm overflow-hidden">
              <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                Learning Consistency
              </h3>
              <p className="text-xs text-muted-foreground mb-6">Your daily problem-solving activity across the platform.</p>
              <div className="max-w-full overflow-x-auto pb-2">
                <SubmissionHeatmap data={heatmapData} detailMap={detailMap} />
              </div>
            </div>

            {/* GitHub Heatmap */}
            {githubUsername && (
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm overflow-hidden">
                <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                  <GitHubIcon className="size-4" /> GitHub Contributions
                </h3>
                <p className="text-xs text-muted-foreground mb-6">Synced activity for @{githubUsername}.</p>
                <div className="max-w-full overflow-x-auto pb-2">
                  <GitHubContributionHeatmap username={githubUsername} />
                </div>
              </div>
            )}

            {/* Solved Problems Archive */}
            <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
              <SolvedProblemsArchive completedProblems={completedProblems} isProfileTheme={true} />
            </div>

          </main>

          {/* SECONDARY COLUMN: Summary & Narrative */}
          <aside className="lg:col-span-4 space-y-6 order-1 lg:order-2">
            
            {/* Top Line Stats Stack */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl border border-border bg-card p-5 shadow-sm flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Total Solved</span>
                <span className="text-3xl font-display font-black text-primary mt-1">{stats.total}</span>
              </div>
              <div className="rounded-3xl border border-border bg-card p-5 shadow-sm flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Current Streak</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Flame className="size-5 text-orange-500" />
                  <span className="text-3xl font-display font-black text-foreground">{streakCount}</span>
                </div>
              </div>
              <div className="col-span-2 rounded-3xl border border-border bg-card p-5 shadow-sm">
                <span className="text-[10px] font-bold uppercase text-muted-foreground mb-3 block">Platform Distribution</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.byPlatform).sort((a,b) => b[1] - a[1]).map(([plat, num]) => (
                    <div key={plat} className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-lg">
                      <span className="size-1.5 rounded-full bg-primary/50" />
                      <span className="text-xs font-semibold">{plat}</span>
                      <span className="text-xs text-muted-foreground font-mono">{num}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* About Me */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <UserCircle2 className="size-4 text-primary" /> Story & Trajectory
                </h3>
                <Button variant="ghost" size="sm" onClick={() => { setAboutMeDraft(aboutMe); setIsEditingAboutMe(true); }} className="h-6 px-2 text-xs">
                  <Pencil className="size-3 mr-1" /> Edit
                </Button>
              </div>
              
              {aboutMe ? (
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{aboutMe}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No public biography provided.</p>
              )}
              {socialLinks.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border/50">
                  <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-3">Other Links</h4>
                  <div className="flex flex-wrap gap-2">
                    {socialLinks.map((s, i) => (
                      <a key={i} href={s.url} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                        {s.platform} <ExternalLink className="size-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Personal Notes (Private) */}
            <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Lock className="size-24 text-amber-500" />
              </div>
              <div className="relative">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
                  <Lock className="size-4" /> Private Notes
                </h3>
                <p className="text-[11px] text-muted-foreground mb-4">Visible only to you. Use for interview prep or reminders.</p>
                
                <Textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Draft your thoughts here..."
                  rows={4}
                  className="bg-background/80 border-amber-500/20 resize-none font-mono text-xs mb-3 shadow-inner text-amber-900 dark:text-amber-100"
                />
                <Button size="sm" onClick={handleSaveNotes} disabled={savingNotes} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold">
                  {savingNotes ? "Saving..." : "Secure Save"}
                </Button>
              </div>
            </div>

            {/* Badges Mini-View */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Trophy className="size-4 text-emerald-500" /> Achievements
              </h3>
              <BadgesGrid badges={badges} />
            </div>

          </aside>
        </div>
      `;
  
  fs.writeFileSync(filePath, before + '{/* ── PROFILE WORKSPACE ── */}' + middle + after);
}

function fixPublicProfile() {
  const filePath = 'p:/DSA404-chatBot/app/profile/[uid]/page.tsx';
  let content = fs.readFileSync(filePath, 'utf8');

  // Find {/* ── PROFILE WORKSPACE ── */} and {/* ── Footer ── */}
  const parts = content.split('{/* ── PROFILE WORKSPACE ── */}');
  if (parts.length < 2) return;
  const before = parts[0];
  const tailParts = parts[1].split('{/* ── Footer ── */}');
  const after = '{/* ── Footer ── */}' + tailParts[1];

  const middle = `
        {/* ── TWO COLUMN WORKSPACE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* PRIMARY COLUMN: Main Analytics */}
          <main className="lg:col-span-8 space-y-8 min-w-0 order-2 lg:order-1">
            
            {/* Unified Platform Profiles */}
            {(Object.entries(codingProfiles).some(([k, v]) => k !== "customLinks" && k !== "platformStats" && typeof v === "string" && Boolean(v.trim()))) && (
              <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
                <UnifiedProfileDashboard
                  initialProfiles={codingProfiles as Record<string, string>}
                  initialStats={platformStats}
                  userId={resolvedUid}
                  readOnly={true}
                />
              </div>
            )}

            {/* Solving Trend (Public) */}
            {effectiveDays.length > 0 && (
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm overflow-hidden">
                <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" /> Platform Solving Trend
                </h3>
                <div className="h-64 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend} margin={{ left: -20, right: 8, top: 8 }}>
                      <defs>
                        <linearGradient id="publicSolvedFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.6} />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                      <RTooltip
                        contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, color: "var(--color-popover-foreground)", fontSize: 12, padding: "12px" }}
                      />
                      <Area type="monotone" dataKey="solved" name="Solved" stroke="var(--color-primary)" fill="url(#publicSolvedFill)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Solved Days Heatmap */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm overflow-hidden">
              <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                Learning Consistency
              </h3>
              <p className="text-xs text-muted-foreground mb-6">Daily problem-solving activity across the platform.</p>
              <div className="max-w-full overflow-x-auto pb-2">
                <SubmissionHeatmap data={heatmapData} detailMap={detailMap} />
              </div>
            </div>

            {/* GitHub Heatmap */}
            {githubUsername && (
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm overflow-hidden">
                <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                  <GitHubIcon className="size-4" /> GitHub Contributions
                </h3>
                <p className="text-xs text-muted-foreground mb-6">Synced activity for @{githubUsername}.</p>
                <div className="max-w-full overflow-x-auto pb-2">
                  <GitHubContributionHeatmap username={githubUsername} />
                </div>
              </div>
            )}

            {/* Solved Problems Archive */}
            <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
              <SolvedProblemsArchive completedProblems={completedProblems} />
            </div>

          </main>

          {/* SECONDARY COLUMN: Summary & Narrative */}
          <aside className="lg:col-span-4 space-y-6 order-1 lg:order-2">
            
            {/* Top Line Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl border border-border bg-card p-5 shadow-sm flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Total Solved</span>
                <span className="text-3xl font-display font-black text-primary mt-1">{allPlatformsStats.grandTotalSolved}</span>
              </div>
              <div className="rounded-3xl border border-border bg-card p-5 shadow-sm flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Current Streak</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Flame className="size-5 text-orange-500" />
                  <span className="text-3xl font-display font-black text-foreground">{streakCount}</span>
                </div>
              </div>
              <div className="col-span-2 rounded-3xl border border-border bg-card p-5 shadow-sm">
                <span className="text-[10px] font-bold uppercase text-muted-foreground mb-3 block">Platform Distribution</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(allPlatformsStats.byPlatform).sort((a,b) => b[1] - a[1]).map(([plat, num]) => (
                    <div key={plat} className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-lg">
                      <span className="size-1.5 rounded-full bg-primary/50" />
                      <span className="text-xs font-semibold">{plat}</span>
                      <span className="text-xs text-muted-foreground font-mono">{num}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* About Me & Contact */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <UserCircle2 className="size-4 text-primary" /> Story & Trajectory
              </h3>
              
              {aboutMe ? (
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{aboutMe}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No detailed biography provided.</p>
              )}

              {email && (
                <div className="mt-6 pt-4 border-t border-border/50">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-2">Contact Email</span>
                  <a href={"mailto:" + email} className="text-sm font-mono text-primary hover:underline">{email}</a>
                </div>
              )}

              {/* Other Custom Links */}
              {((codingProfiles.customLinks ?? []).some((cl) => cl.url) || socialLinks.length > 0) && (
                <div className="mt-6 pt-4 border-t border-border/50">
                  <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-3">Verified Links</h4>
                  <div className="flex flex-col gap-2">
                    {socialLinks.map((s, i) => (
                      <a key={"social-" + i} href={s.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-foreground hover:text-primary transition-colors flex items-center justify-between bg-secondary/40 px-3 py-2 rounded-lg">
                        <span className="flex items-center gap-2">{getSocialIcon(s.platform, "size-3.5")} {s.platform}</span>
                        <ExternalLink className="size-3 opacity-50" />
                      </a>
                    ))}
                    {(codingProfiles.customLinks ?? []).filter(cl => cl.url).map((cl, i) => (
                      <a key={"custom-" + i} href={cl.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-foreground hover:text-primary transition-colors flex items-center justify-between bg-secondary/40 px-3 py-2 rounded-lg">
                        <span className="flex items-center gap-2"><Globe className="size-3.5 text-muted-foreground" /> {cl.label || "Link"}</span>
                        <ExternalLink className="size-3 opacity-50" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Badges */}
            {effectiveDays.length > 0 && (
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                  <Flame className="size-4 text-orange-500" /> Achievements
                </h3>
                <BadgesGrid badges={badges} />
              </div>
            )}
            
            {/* Global Difficulty Split */}
            {effectiveDays.length > 0 && (
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <BarChart3 className="size-3.5 text-primary" /> Difficulty Split
                </h3>
                <div className="h-48 w-full bg-secondary/30 rounded-2xl p-2 border border-border/50">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={diffSplit} margin={{ left: -20, right: 8, top: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.6} />
                      <XAxis dataKey="difficulty" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                      <RTooltip
                        contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, color: "var(--color-popover-foreground)", fontSize: 12, padding: "12px" }}
                      />
                      <Bar dataKey="done" name="Solved" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

          </aside>
        </div>
      `;
  
  fs.writeFileSync(filePath, before + '{/* ── PROFILE WORKSPACE ── */}' + middle + after);
}

fixCoderProfile();
fixPublicProfile();
