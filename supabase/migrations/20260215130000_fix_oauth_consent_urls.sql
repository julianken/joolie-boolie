-- Fix OAuth consent_page_url from localhost to production (BEA-517)
--
-- Both OAuth clients (Bingo and Trivia) had consent_page_url
-- pointing to http://localhost:3002/oauth/consent instead of the
-- production URL. This caused OAuth consent redirects to fail in
-- production.
--
-- Production URLs:
--   Platform Hub (consent page): https://joolie-boolie.com/oauth/consent
--   Bingo:                       https://bingo.joolie-boolie.com
--   Trivia:                      https://trivia.joolie-boolie.com
--
-- Redirect URIs were already fixed in migration 20260204110000.

UPDATE oauth_clients
SET consent_page_url = 'https://joolie-boolie.com/oauth/consent',
    updated_at = NOW()
WHERE consent_page_url LIKE '%localhost%';
