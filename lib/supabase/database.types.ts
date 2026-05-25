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
      profiles: {
        Row: {
          id: string;
          full_name: string;
          headline: string | null;
          workplace_institution_slug: string | null;
          license_number: string | null;
          city: string | null;
          avatar_url: string | null;
          cv_draft: Json | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          headline?: string | null;
          workplace_institution_slug?: string | null;
          license_number?: string | null;
          city?: string | null;
          avatar_url?: string | null;
          cv_draft?: Json | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          headline?: string | null;
          workplace_institution_slug?: string | null;
          license_number?: string | null;
          city?: string | null;
          avatar_url?: string | null;
          cv_draft?: Json | null;
          deleted_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      specialties: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          name?: string;
        };
      };
      workplaces: {
        Row: {
          id: string;
          name: string;
          city: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          city?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          city?: string | null;
        };
      };
      user_specialties: {
        Row: {
          user_id: string;
          specialty_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          specialty_id: string;
          created_at?: string;
        };
        Update: never;
      };
      user_workplaces: {
        Row: {
          user_id: string;
          workplace_id: string;
          role: string | null;
          start_year: number | null;
          end_year: number | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          workplace_id: string;
          role?: string | null;
          start_year?: number | null;
          end_year?: number | null;
          created_at?: string;
        };
        Update: {
          role?: string | null;
          start_year?: number | null;
          end_year?: number | null;
        };
      };
      connections: {
        Row: {
          requester_id: string;
          addressee_id: string;
          status: "pending" | "accepted" | "blocked";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          requester_id: string;
          addressee_id: string;
          status?: "pending" | "accepted" | "blocked";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: "pending" | "accepted" | "blocked";
          updated_at?: string;
        };
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: never;
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          body: string;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          body: string;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          image_url?: string | null;
          updated_at?: string;
        };
      };
      post_likes: {
        Row: {
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: never;
      };
      post_comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          body: string;
          created_at?: string;
        };
        Update: never;
      };
      post_comment_likes: {
        Row: {
          comment_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          comment_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: never;
      };
      post_shares: {
        Row: {
          id: string;
          post_id: string;
          sharer_id: string;
          recipient_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          sharer_id: string;
          recipient_id: string;
          created_at?: string;
        };
        Update: never;
      };
      direct_messages: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          body: string;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          body: string;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          read_at?: string | null;
        };
      };
      jobs: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          body: string;
          hospital: string | null;
          city: string | null;
          institution_slug: string | null;
          status: "active" | "filled";
          created_at: string;
          updated_at: string;
          filled_at: string | null;
        };
        Insert: {
          id?: string;
          author_id: string;
          title: string;
          body: string;
          hospital?: string | null;
          city?: string | null;
          institution_slug?: string | null;
          status?: "active" | "filled";
          created_at?: string;
          updated_at?: string;
          filled_at?: string | null;
        };
        Update: {
          title?: string;
          body?: string;
          hospital?: string | null;
          city?: string | null;
          institution_slug?: string | null;
          status?: "active" | "filled";
          updated_at?: string;
          filled_at?: string | null;
        };
      };
      job_list_views: {
        Row: {
          user_id: string;
          seen_at: string;
          applications_seen_at: string;
        };
        Insert: {
          user_id: string;
          seen_at?: string;
          applications_seen_at?: string;
        };
        Update: {
          seen_at?: string;
          applications_seen_at?: string;
        };
      };
      job_applications: {
        Row: {
          id: string;
          job_id: string;
          applicant_id: string;
          full_name: string;
          phone: string;
          note: string | null;
          created_at: string;
          owner_read_at: string | null;
        };
        Insert: {
          id?: string;
          job_id: string;
          applicant_id: string;
          full_name: string;
          phone: string;
          note?: string | null;
          created_at?: string;
          owner_read_at?: string | null;
        };
        Update: {
          owner_read_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      feed_post_stats: {
        Args: { post_ids: string[] };
        Returns: {
          post_id: string;
          like_count: number;
          comment_count: number;
          share_count: number;
        }[];
      };
      users_are_connected: {
        Args: { user_a: string; user_b: string };
        Returns: boolean;
      };
      connection_recommendations: {
        Args: { limit_count?: number };
        Returns: {
          profile_id: string;
          mutual_count: number;
          mutual_ids: string[];
        }[];
      };
      get_profile_cv_draft: {
        Args: { target_id: string };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
