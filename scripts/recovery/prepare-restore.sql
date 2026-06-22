-- Run before auth-data.sql restore (full disaster recovery).
-- Clears sessions so users sign in again with restored credentials.

SET session_replication_role = replica;

TRUNCATE auth.refresh_tokens CASCADE;
TRUNCATE auth.sessions CASCADE;
TRUNCATE auth.mfa_challenges CASCADE;
TRUNCATE auth.mfa_factors CASCADE;
TRUNCATE auth.identities CASCADE;
TRUNCATE auth.users CASCADE;

SET session_replication_role = DEFAULT;
