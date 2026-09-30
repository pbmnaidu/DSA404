const fs = require('fs');

const filePath = 'p:/DSA404-chatBot/src/components/DayDetail.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const target = `        </main>
      </div>
    </article>`;

const replacement = `        </main>
      </div>

      {/* ── FULL WIDTH ROW: Notes & Revision ── */}
      <section aria-label="Learning notes workspace" className="w-full min-w-0 pt-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          
          {/* Daily Notes */}
          <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-6 shadow-sm">
            <Label htmlFor={\`notes-\${day.dayNumber}\`} className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
               Topic Notes & Takeaways
            </Label>
            <Textarea
              id={\`notes-\${day.dayNumber}\`}
              rows={5}
              defaultValue={day.notes}
              placeholder="Write key code snippets, intuitions, or algorithm patterns..."
              disabled={locked}
              className="flex-1 bg-secondary/40 border-border rounded-xl text-sm resize-none focus-visible:ring-primary/20 p-4"
              onBlur={(e) => void updateDay(day.dayNumber, (d) => ({ ...d, notes: e.target.value }))}
            />
          </div>

          {/* Revision Reminders */}
          <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-6 shadow-sm">
            <Label htmlFor={\`rev-\${day.dayNumber}\`} className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
               Revision Reminders
            </Label>
            <Textarea
              id={\`rev-\${day.dayNumber}\`}
              rows={5}
              defaultValue={day.revisionNotes}
              placeholder="Important edge cases, time complexities, or trick points to remember..."
              disabled={locked}
              className="flex-1 bg-secondary/40 border-border rounded-xl text-sm resize-none focus-visible:ring-primary/20 p-4"
              onBlur={(e) =>
                void updateDay(day.dayNumber, (d) => ({ ...d, revisionNotes: e.target.value }))
              }
            />
          </div>

        </div>
      </section>
    </article>`;

// Normalizing CRLF to LF for safe replacement
const normalizedContent = content.replace(/\r\n/g, '\n');
const newContent = normalizedContent.replace(target, replacement);

fs.writeFileSync(filePath, newContent, 'utf8');
console.log("Successfully replaced layout at end of file.");
