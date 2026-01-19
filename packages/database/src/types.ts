/**
 * Database types for the Beak Gaming Platform
 *
 * These types can be auto-generated using:
 * npx supabase gen types typescript --project-id <project-id> > src/types.ts
 *
 * For now, we define them manually based on the migrations.
 */

// =============================================================================
// Profile Types
// =============================================================================

export interface Profile {
  id: string; // UUID, references auth.users
  facility_name: string | null;
  default_game_title: string | null;
  logo_url: string | null;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

export interface ProfileInsert {
  id: string; // Required - must match auth.users id
  facility_name?: string | null;
  default_game_title?: string | null;
  logo_url?: string | null;
}

export interface ProfileUpdate {
  facility_name?: string | null;
  default_game_title?: string | null;
  logo_url?: string | null;
}

// =============================================================================
// Bingo Template Types
// =============================================================================

export interface BingoTemplate {
  id: string; // UUID
  user_id: string; // UUID, references profiles
  name: string;
  pattern_id: string;
  voice_pack: string;
  auto_call_enabled: boolean;
  auto_call_interval: number; // milliseconds, 1000-30000
  is_default: boolean;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

export interface BingoTemplateInsert {
  user_id: string; // Required
  name: string; // Required
  pattern_id: string; // Required
  voice_pack?: string;
  auto_call_enabled?: boolean;
  auto_call_interval?: number;
  is_default?: boolean;
}

export interface BingoTemplateUpdate {
  name?: string;
  pattern_id?: string;
  voice_pack?: string;
  auto_call_enabled?: boolean;
  auto_call_interval?: number;
  is_default?: boolean;
}

// =============================================================================
// Trivia Template Types
// =============================================================================

export interface TriviaQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  category?: string;
}

export interface TriviaTemplate {
  id: string; // UUID
  user_id: string; // UUID, references profiles
  name: string;
  questions: TriviaQuestion[];
  rounds_count: number; // 1-20
  questions_per_round: number; // 1-50
  timer_duration: number; // seconds, 5-300
  is_default: boolean;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

export interface TriviaTemplateInsert {
  user_id: string; // Required
  name: string; // Required
  questions?: TriviaQuestion[];
  rounds_count?: number;
  questions_per_round?: number;
  timer_duration?: number;
  is_default?: boolean;
}

export interface TriviaTemplateUpdate {
  name?: string;
  questions?: TriviaQuestion[];
  rounds_count?: number;
  questions_per_round?: number;
  timer_duration?: number;
  is_default?: boolean;
}

// =============================================================================
// Database Schema Type (for Supabase client)
// =============================================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      bingo_templates: {
        Row: BingoTemplate;
        Insert: BingoTemplateInsert;
        Update: BingoTemplateUpdate;
      };
      trivia_templates: {
        Row: TriviaTemplate;
        Insert: TriviaTemplateInsert;
        Update: TriviaTemplateUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// =============================================================================
// Utility Types
// =============================================================================

export type TableName = keyof Database['public']['Tables'];

export type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row'];
export type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert'];
export type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update'];

// Type guard helpers
export function isProfile(obj: unknown): obj is Profile {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'created_at' in obj &&
    'updated_at' in obj
  );
}

export function isBingoTemplate(obj: unknown): obj is BingoTemplate {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'user_id' in obj &&
    'pattern_id' in obj &&
    'voice_pack' in obj
  );
}

export function isTriviaTemplate(obj: unknown): obj is TriviaTemplate {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'user_id' in obj &&
    'questions' in obj &&
    'rounds_count' in obj
  );
}
