/*
  # Add Download Count Increment Function

  Creates a safe PostgreSQL function to increment project download counts.
  This function is called when users download projects.
*/

CREATE OR REPLACE FUNCTION increment_download_count(project_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE projects
  SET download_count = COALESCE(download_count, 0) + 1
  WHERE id = project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
