-- Add notes_folder_path to github_connections table
ALTER TABLE public.github_connections ADD COLUMN notes_folder_path TEXT DEFAULT 'notes';
