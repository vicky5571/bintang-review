-- Migration: Hardening Row Level Security (RLS) Policies
-- Fix for SEC-01 (CWE-284: Improper Access Control)

-- 1. Ensure RLS is enabled on all tables
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_agents ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- 2. VENUES TABLE POLICIES
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access to venues" ON venues;
DROP POLICY IF EXISTS "Allow manage access to venues" ON venues;
DROP POLICY IF EXISTS "Allow public read active venues" ON venues;
DROP POLICY IF EXISTS "Allow service role full access to venues" ON venues;

-- Public / Anonymous: Can ONLY read venues that are active
CREATE POLICY "Allow public read active venues"
ON venues
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Service Role (Backend Server): Full management
CREATE POLICY "Allow service role full access to venues"
ON venues
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- -------------------------------------------------------------
-- 3. SCAN_LOGS TABLE POLICIES
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public insert to scan_logs" ON scan_logs;
DROP POLICY IF EXISTS "Allow read access to scan_logs" ON scan_logs;
DROP POLICY IF EXISTS "Allow public insert scan logs" ON scan_logs;
DROP POLICY IF EXISTS "Allow service role full access to scan_logs" ON scan_logs;

-- Public / Anonymous: Can ONLY record new scans (Customer taps)
CREATE POLICY "Allow public insert scan logs"
ON scan_logs
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Service Role: Full access for server-side analytics calculations
CREATE POLICY "Allow service role full access to scan_logs"
ON scan_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- -------------------------------------------------------------
-- 4. FEEDBACK_MESSAGES TABLE POLICIES
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public insert to feedback_messages" ON feedback_messages;
DROP POLICY IF EXISTS "Allow read access to feedback_messages" ON feedback_messages;
DROP POLICY IF EXISTS "Allow public insert feedback" ON feedback_messages;
DROP POLICY IF EXISTS "Allow service role full access to feedback_messages" ON feedback_messages;

-- Public / Anonymous: Can ONLY submit private feedback
CREATE POLICY "Allow public insert feedback"
ON feedback_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Service Role: Authorized backend can read/manage feedback for Owner Portal
CREATE POLICY "Allow service role full access to feedback_messages"
ON feedback_messages
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- -------------------------------------------------------------
-- 5. SALES_AGENTS TABLE POLICIES
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Allow read access to sales_agents" ON sales_agents;
DROP POLICY IF EXISTS "Allow manage access to sales_agents" ON sales_agents;
DROP POLICY IF EXISTS "Allow service role full access to sales_agents" ON sales_agents;

-- Public / Anonymous: Access completely revoked (private partner data)
-- Service Role: Full access from Super Admin console
CREATE POLICY "Allow service role full access to sales_agents"
ON sales_agents
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
