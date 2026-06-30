-- ============================================================
-- ApplePie Row-Level Security Policies
-- ============================================================

-- Helper: current user is a student
CREATE OR REPLACE FUNCTION is_student()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'student'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: current user is a parent
CREATE OR REPLACE FUNCTION is_parent()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'parent'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: check if parent is bound to student
CREATE OR REPLACE FUNCTION is_parent_of(student_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.parent_child_bindings
    WHERE parent_id = auth.uid()
      AND student_id = $1
      AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- users table
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own record"
  ON public.users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Parents can read bound children"
  ON public.users FOR SELECT
  USING (is_parent() AND EXISTS (
    SELECT 1 FROM public.parent_child_bindings
    WHERE parent_id = auth.uid()
      AND student_id = users.id
      AND status = 'active'
  ));

CREATE POLICY "Users can update own record"
  ON public.users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own record"
  ON public.users FOR INSERT
  WITH CHECK (id = auth.uid());

-- ============================================================
-- student_profiles
-- ============================================================
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read own profile"
  ON public.student_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Parents can read bound children profiles"
  ON public.student_profiles FOR SELECT
  USING (is_parent_of(user_id));

CREATE POLICY "Students can update own profile"
  ON public.student_profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Students can insert own profile"
  ON public.student_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- student_subjects
-- ============================================================
ALTER TABLE public.student_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can CRUD own subjects"
  ON public.student_subjects FOR ALL
  USING (student_id = auth.uid());

CREATE POLICY "Parents can read bound children subjects"
  ON public.student_subjects FOR SELECT
  USING (is_parent_of(student_id));

-- ============================================================
-- knowledge_points (read-only reference data)
-- ============================================================
ALTER TABLE public.knowledge_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read knowledge points"
  ON public.knowledge_points FOR SELECT
  USING (true);

-- ============================================================
-- student_knowledge_points
-- ============================================================
ALTER TABLE public.student_knowledge_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can CRUD own knowledge points"
  ON public.student_knowledge_points FOR ALL
  USING (student_id = auth.uid());

CREATE POLICY "Parents can read bound children knowledge points"
  ON public.student_knowledge_points FOR SELECT
  USING (is_parent_of(student_id));

-- ============================================================
-- schedules
-- ============================================================
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can CRUD own schedules"
  ON public.schedules FOR ALL
  USING (student_id = auth.uid());

CREATE POLICY "Parents can read bound children schedules"
  ON public.schedules FOR SELECT
  USING (is_parent_of(student_id));

-- ============================================================
-- game_sessions
-- ============================================================
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read own game sessions"
  ON public.game_sessions FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert own game sessions"
  ON public.game_sessions FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own game sessions"
  ON public.game_sessions FOR UPDATE
  USING (student_id = auth.uid());

CREATE POLICY "Parents can read bound children game sessions"
  ON public.game_sessions FOR SELECT
  USING (is_parent_of(student_id));

-- ============================================================
-- game_results
-- ============================================================
ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read own game results"
  ON public.game_results FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert own game results"
  ON public.game_results FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Parents can read bound children game results"
  ON public.game_results FOR SELECT
  USING (is_parent_of(student_id));

-- ============================================================
-- ability_profiles
-- ============================================================
ALTER TABLE public.ability_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read own ability profile"
  ON public.ability_profiles FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can upsert own ability profile"
  ON public.ability_profiles FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own ability profile"
  ON public.ability_profiles FOR UPDATE
  USING (student_id = auth.uid());

CREATE POLICY "Parents can read bound children ability profile"
  ON public.ability_profiles FOR SELECT
  USING (is_parent_of(student_id));

-- ============================================================
-- parent_child_bindings
-- ============================================================
ALTER TABLE public.parent_child_bindings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can read own bindings"
  ON public.parent_child_bindings FOR SELECT
  USING (parent_id = auth.uid());

CREATE POLICY "Students can read own bindings"
  ON public.parent_child_bindings FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Parents can insert bindings"
  ON public.parent_child_bindings FOR INSERT
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Students can update bindings (accept/reject)"
  ON public.parent_child_bindings FOR UPDATE
  USING (student_id = auth.uid());

-- ============================================================
-- weekly_reports
-- ============================================================
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can read bound children reports"
  ON public.weekly_reports FOR SELECT
  USING (parent_id = auth.uid());

CREATE POLICY "Students can read own reports"
  ON public.weekly_reports FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "System can insert reports"
  ON public.weekly_reports FOR INSERT
  WITH CHECK (true);
