-- Add production redirect URIs for beak-gaming.com domain
-- This updates the OAuth clients to include the production domain alongside localhost

-- Bingo: Add production redirect URI
UPDATE oauth_clients
SET redirect_uris = ARRAY[
  'http://localhost:3000/auth/callback',
  'https://bingo.beak-gaming.com/auth/callback'
]
WHERE id = '0d87a03a-d90a-4ccc-a46b-85fdd8d53c21';

-- Trivia: Add production redirect URI
UPDATE oauth_clients
SET redirect_uris = ARRAY[
  'http://localhost:3001/auth/callback',
  'https://trivia.beak-gaming.com/auth/callback'
]
WHERE id = '0cd92ba6-459b-4c07-ab9d-b9bf9dbb1936';
