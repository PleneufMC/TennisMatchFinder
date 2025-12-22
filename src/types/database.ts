/**
 * Types générés pour Supabase Database
 * À régénérer avec: npm run db:generate-types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      clubs: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          banner_url: string | null;
          settings: Json;
          contact_email: string | null;
          website_url: string | null;
          address: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          logo_url?: string | null;
          banner_url?: string | null;
          settings?: Json;
          contact_email?: string | null;
          website_url?: string | null;
          address?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          logo_url?: string | null;
          banner_url?: string | null;
          settings?: Json;
          contact_email?: string | null;
          website_url?: string | null;
          address?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      players: {
        Row: {
          id: string;
          club_id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          phone: string | null;
          bio: string | null;
          current_elo: number;
          best_elo: number;
          lowest_elo: number;
          self_assessed_level: 'débutant' | 'intermédiaire' | 'avancé' | 'expert';
          availability: Json;
          preferences: Json;
          matches_played: number;
          wins: number;
          losses: number;
          win_streak: number;
          best_win_streak: number;
          unique_opponents: number;
          is_admin: boolean;
          is_verified: boolean;
          is_active: boolean;
          last_active_at: string;
          last_match_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          club_id: string;
          email: string;
          full_name: string;
          avatar_url?: string | null;
          phone?: string | null;
          bio?: string | null;
          current_elo?: number;
          best_elo?: number;
          lowest_elo?: number;
          self_assessed_level?: 'débutant' | 'intermédiaire' | 'avancé' | 'expert';
          availability?: Json;
          preferences?: Json;
          matches_played?: number;
          wins?: number;
          losses?: number;
          win_streak?: number;
          best_win_streak?: number;
          unique_opponents?: number;
          is_admin?: boolean;
          is_verified?: boolean;
          is_active?: boolean;
          last_active_at?: string;
          last_match_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          phone?: string | null;
          bio?: string | null;
          current_elo?: number;
          best_elo?: number;
          lowest_elo?: number;
          self_assessed_level?: 'débutant' | 'intermédiaire' | 'avancé' | 'expert';
          availability?: Json;
          preferences?: Json;
          matches_played?: number;
          wins?: number;
          losses?: number;
          win_streak?: number;
          best_win_streak?: number;
          unique_opponents?: number;
          is_admin?: boolean;
          is_verified?: boolean;
          is_active?: boolean;
          last_active_at?: string;
          last_match_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'players_club_id_fkey';
            columns: ['club_id'];
            referencedRelation: 'clubs';
            referencedColumns: ['id'];
          }
        ];
      };
      matches: {
        Row: {
          id: string;
          club_id: string;
          player1_id: string;
          player2_id: string;
          winner_id: string;
          score: string;
          game_type: 'simple' | 'double';
          surface: 'terre battue' | 'dur' | 'gazon' | 'indoor' | null;
          location: string | null;
          player1_elo_before: number;
          player2_elo_before: number;
          player1_elo_after: number;
          player2_elo_after: number;
          modifiers_applied: Json;
          played_at: string;
          reported_by: string | null;
          validated: boolean;
          validated_by: string | null;
          validated_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          player1_id: string;
          player2_id: string;
          winner_id: string;
          score: string;
          game_type?: 'simple' | 'double';
          surface?: 'terre battue' | 'dur' | 'gazon' | 'indoor' | null;
          location?: string | null;
          player1_elo_before: number;
          player2_elo_before: number;
          player1_elo_after: number;
          player2_elo_after: number;
          modifiers_applied?: Json;
          played_at: string;
          reported_by?: string | null;
          validated?: boolean;
          validated_by?: string | null;
          validated_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          player1_id?: string;
          player2_id?: string;
          winner_id?: string;
          score?: string;
          game_type?: 'simple' | 'double';
          surface?: 'terre battue' | 'dur' | 'gazon' | 'indoor' | null;
          location?: string | null;
          player1_elo_before?: number;
          player2_elo_before?: number;
          player1_elo_after?: number;
          player2_elo_after?: number;
          modifiers_applied?: Json;
          played_at?: string;
          reported_by?: string | null;
          validated?: boolean;
          validated_by?: string | null;
          validated_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'matches_club_id_fkey';
            columns: ['club_id'];
            referencedRelation: 'clubs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_player1_id_fkey';
            columns: ['player1_id'];
            referencedRelation: 'players';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_player2_id_fkey';
            columns: ['player2_id'];
            referencedRelation: 'players';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_winner_id_fkey';
            columns: ['winner_id'];
            referencedRelation: 'players';
            referencedColumns: ['id'];
          }
        ];
      };
      elo_history: {
        Row: {
          id: string;
          player_id: string;
          elo: number;
          delta: number;
          match_id: string | null;
          reason: 'match_win' | 'match_loss' | 'inactivity_decay' | 'manual_adjustment';
          details: Json | null;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          elo: number;
          delta: number;
          match_id?: string | null;
          reason: 'match_win' | 'match_loss' | 'inactivity_decay' | 'manual_adjustment';
          details?: Json | null;
          recorded_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          elo?: number;
          delta?: number;
          match_id?: string | null;
          reason?: 'match_win' | 'match_loss' | 'inactivity_decay' | 'manual_adjustment';
          details?: Json | null;
          recorded_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'elo_history_player_id_fkey';
            columns: ['player_id'];
            referencedRelation: 'players';
            referencedColumns: ['id'];
          }
        ];
      };
      forum_threads: {
        Row: {
          id: string;
          club_id: string;
          author_id: string | null;
          category: 'général' | 'recherche-partenaire' | 'résultats' | 'équipement' | 'annonces';
          title: string;
          content: string;
          is_pinned: boolean;
          is_locked: boolean;
          is_bot: boolean;
          is_announcement: boolean;
          view_count: number;
          reply_count: number;
          last_reply_at: string | null;
          last_reply_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          author_id?: string | null;
          category: 'général' | 'recherche-partenaire' | 'résultats' | 'équipement' | 'annonces';
          title: string;
          content: string;
          is_pinned?: boolean;
          is_locked?: boolean;
          is_bot?: boolean;
          is_announcement?: boolean;
          view_count?: number;
          reply_count?: number;
          last_reply_at?: string | null;
          last_reply_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          author_id?: string | null;
          category?: 'général' | 'recherche-partenaire' | 'résultats' | 'équipement' | 'annonces';
          title?: string;
          content?: string;
          is_pinned?: boolean;
          is_locked?: boolean;
          is_bot?: boolean;
          is_announcement?: boolean;
          view_count?: number;
          reply_count?: number;
          last_reply_at?: string | null;
          last_reply_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'forum_threads_club_id_fkey';
            columns: ['club_id'];
            referencedRelation: 'clubs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'forum_threads_author_id_fkey';
            columns: ['author_id'];
            referencedRelation: 'players';
            referencedColumns: ['id'];
          }
        ];
      };
      forum_replies: {
        Row: {
          id: string;
          thread_id: string;
          author_id: string | null;
          parent_reply_id: string | null;
          content: string;
          is_bot: boolean;
          is_solution: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          author_id?: string | null;
          parent_reply_id?: string | null;
          content: string;
          is_bot?: boolean;
          is_solution?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          author_id?: string | null;
          parent_reply_id?: string | null;
          content?: string;
          is_bot?: boolean;
          is_solution?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'forum_replies_thread_id_fkey';
            columns: ['thread_id'];
            referencedRelation: 'forum_threads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'forum_replies_author_id_fkey';
            columns: ['author_id'];
            referencedRelation: 'players';
            referencedColumns: ['id'];
          }
        ];
      };
      forum_reactions: {
        Row: {
          id: string;
          user_id: string;
          target_type: 'thread' | 'reply';
          target_id: string;
          emoji: '👍' | '🎾' | '🔥' | '😂' | '🤔';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          target_type: 'thread' | 'reply';
          target_id: string;
          emoji: '👍' | '🎾' | '🔥' | '😂' | '🤔';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          target_type?: 'thread' | 'reply';
          target_id?: string;
          emoji?: '👍' | '🎾' | '🔥' | '😂' | '🤔';
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'forum_reactions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'players';
            referencedColumns: ['id'];
          }
        ];
      };
      match_proposals: {
        Row: {
          id: string;
          club_id: string;
          from_player_id: string;
          to_player_id: string;
          proposed_date: string | null;
          proposed_time: string | null;
          proposed_location: string | null;
          message: string | null;
          game_type: 'simple' | 'double';
          status: 'pending' | 'accepted' | 'declined' | 'expired';
          response_message: string | null;
          responded_at: string | null;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          from_player_id: string;
          to_player_id: string;
          proposed_date?: string | null;
          proposed_time?: string | null;
          proposed_location?: string | null;
          message?: string | null;
          game_type?: 'simple' | 'double';
          status?: 'pending' | 'accepted' | 'declined' | 'expired';
          response_message?: string | null;
          responded_at?: string | null;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          from_player_id?: string;
          to_player_id?: string;
          proposed_date?: string | null;
          proposed_time?: string | null;
          proposed_location?: string | null;
          message?: string | null;
          game_type?: 'simple' | 'double';
          status?: 'pending' | 'accepted' | 'declined' | 'expired';
          response_message?: string | null;
          responded_at?: string | null;
          created_at?: string;
          expires_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'match_proposals_club_id_fkey';
            columns: ['club_id'];
            referencedRelation: 'clubs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'match_proposals_from_player_id_fkey';
            columns: ['from_player_id'];
            referencedRelation: 'players';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'match_proposals_to_player_id_fkey';
            columns: ['to_player_id'];
            referencedRelation: 'players';
            referencedColumns: ['id'];
          }
        ];
      };
      player_badges: {
        Row: {
          id: string;
          player_id: string;
          badge_type: string;
          badge_name: string;
          badge_description: string | null;
          badge_icon: string | null;
          earned_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          badge_type: string;
          badge_name: string;
          badge_description?: string | null;
          badge_icon?: string | null;
          earned_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          badge_type?: string;
          badge_name?: string;
          badge_description?: string | null;
          badge_icon?: string | null;
          earned_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'player_badges_player_id_fkey';
            columns: ['player_id'];
            referencedRelation: 'players';
            referencedColumns: ['id'];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          link: string | null;
          data: Json | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          link?: string | null;
          data?: Json | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string;
          link?: string | null;
          data?: Json | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'players';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_user_club_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_club_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      player_level: 'débutant' | 'intermédiaire' | 'avancé' | 'expert';
      game_type: 'simple' | 'double';
      court_surface: 'terre battue' | 'dur' | 'gazon' | 'indoor';
      weekday: 'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi' | 'samedi' | 'dimanche';
      time_slot: 'matin' | 'midi' | 'après-midi' | 'soir';
      forum_category: 'général' | 'recherche-partenaire' | 'résultats' | 'équipement' | 'annonces';
      proposal_status: 'pending' | 'accepted' | 'declined' | 'expired';
      reaction_emoji: '👍' | '🎾' | '🔥' | '😂' | '🤔';
      reaction_target_type: 'thread' | 'reply';
      elo_change_reason: 'match_win' | 'match_loss' | 'inactivity_decay' | 'manual_adjustment';
    };
    CompositeTypes: Record<string, never>;
  };
};

// Helper types pour l'usage courant
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
