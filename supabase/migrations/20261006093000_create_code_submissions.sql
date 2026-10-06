-- Persist submitted solution code and key points per account so they sync
-- across desktop, mobile, and every browser using the same Supabase user.

CREATE TABLE IF NOT EXISTS code_submissions (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    problem_name TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'Unknown',
    difficulty TEXT NOT NULL DEFAULT 'Unknown',
    problem_link TEXT DEFAULT '',
    code TEXT NOT NULL DEFAULT '',
    submission_link TEXT DEFAULT '',
    key_points TEXT DEFAULT '',
    topic TEXT,
    section TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, problem_name)
);

CREATE INDEX IF NOT EXISTS idx_code_submissions_user_updated
    ON code_submissions(user_id, updated_at DESC);

CREATE TRIGGER update_code_submissions_modtime
    BEFORE UPDATE ON code_submissions
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

ALTER TABLE code_submissions ENABLE ROW LEVEL SECURITY;

-- Stream submission changes so another signed-in device refreshes immediately.
ALTER PUBLICATION supabase_realtime ADD TABLE code_submissions;

CREATE POLICY "Users can view own code submissions"
    ON code_submissions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own code submissions"
    ON code_submissions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own code submissions"
    ON code_submissions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own code submissions"
    ON code_submissions FOR DELETE
    USING (auth.uid() = user_id);

INSERT INTO code_submissions (
    user_id,
    problem_name,
    platform,
    difficulty,
    problem_link,
    code,
    submission_link,
    key_points,
    topic,
    section,
    submitted_at
)
SELECT
    p.id,
    item->>'name',
    COALESCE(NULLIF(item->>'platform', ''), 'Unknown'),
    COALESCE(NULLIF(item->>'difficulty', ''), 'Unknown'),
    COALESCE(item->>'link', ''),
    COALESCE(item->>'code', ''),
    COALESCE(NULLIF(item->>'submissionLink', ''), item->>'link', ''),
    COALESCE(item->>'keyPoints', ''),
    NULLIF(item->>'topic', ''),
    NULLIF(item->>'section', ''),
    COALESCE((item->>'submittedAt')::timestamptz, NOW())
FROM profiles p
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(p.completed_problems, '[]'::jsonb)) AS item
WHERE item ? 'name'
  AND (
    COALESCE(item->>'code', '') <> ''
    OR COALESCE(item->>'keyPoints', '') <> ''
    OR COALESCE(item->>'submissionLink', '') <> ''
  )
ON CONFLICT (user_id, problem_name) DO UPDATE SET
    platform = EXCLUDED.platform,
    difficulty = EXCLUDED.difficulty,
    problem_link = EXCLUDED.problem_link,
    code = EXCLUDED.code,
    submission_link = EXCLUDED.submission_link,
    key_points = EXCLUDED.key_points,
    topic = EXCLUDED.topic,
    section = EXCLUDED.section,
    submitted_at = EXCLUDED.submitted_at;
