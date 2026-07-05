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
          suspended_until: string | null;
          suspension_reason: string | null;
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
          suspended_until?: string | null;
          suspension_reason?: string | null;
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
          suspended_until?: string | null;
          suspension_reason?: string | null;
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
          parent_comment_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          body: string;
          parent_comment_id?: string | null;
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
      discussion_threads: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          body: string;
          is_anonymous: boolean;
          anonymous_label: string | null;
          reply_count: number;
          created_at: string;
          updated_at: string;
          last_reply_at: string | null;
        };
        Insert: {
          id?: string;
          author_id: string;
          title: string;
          body: string;
          is_anonymous?: boolean;
          anonymous_label?: string | null;
          reply_count?: number;
          created_at?: string;
          updated_at?: string;
          last_reply_at?: string | null;
        };
        Update: {
          reply_count?: number;
          updated_at?: string;
          last_reply_at?: string | null;
        };
      };
      discussion_replies: {
        Row: {
          id: string;
          thread_id: string;
          author_id: string;
          body: string;
          is_anonymous: boolean;
          anonymous_label: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          author_id: string;
          body: string;
          is_anonymous?: boolean;
          anonymous_label?: string | null;
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
          cv_url: string | null;
          cv_file_name: string | null;
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
          cv_url?: string | null;
          cv_file_name?: string | null;
          created_at?: string;
          owner_read_at?: string | null;
        };
        Update: {
          owner_read_at?: string | null;
        };
      };
      admin_users: {
        Row: {
          user_id: string;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          user_id: string;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          created_by?: string | null;
        };
      };
      moderation_flags: {
        Row: {
          id: string;
          content_type: "post" | "comment" | "message";
          content_id: string;
          subject_user_id: string;
          reporter_id: string | null;
          body_excerpt: string;
          source: "auto" | "user_report";
          status: "pending" | "reviewed" | "dismissed";
          matched_term: string | null;
          report_note: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          resolution: "dismissed" | "content_deleted" | "user_suspended" | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          content_type: "post" | "comment" | "message";
          content_id: string;
          subject_user_id: string;
          reporter_id?: string | null;
          body_excerpt: string;
          source: "auto" | "user_report";
          status?: "pending" | "reviewed" | "dismissed";
          matched_term?: string | null;
          report_note?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          resolution?: "dismissed" | "content_deleted" | "user_suspended" | null;
          created_at?: string;
        };
        Update: {
          status?: "pending" | "reviewed" | "dismissed";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          resolution?: "dismissed" | "content_deleted" | "user_suspended" | null;
        };
      };
      connection_recommendation_snapshots: {
        Row: {
          user_id: string;
          candidate_id: string;
          mutual_count: number;
          mutual_ids: string[];
          source: "mutual" | "workplace" | "both";
          institution_slug: string | null;
          rank: number;
          generated_at: string;
        };
        Insert: {
          user_id: string;
          candidate_id: string;
          mutual_count?: number;
          mutual_ids?: string[];
          source?: "mutual" | "workplace" | "both";
          institution_slug?: string | null;
          rank: number;
          generated_at?: string;
        };
        Update: {
          mutual_count?: number;
          mutual_ids?: string[];
          source?: "mutual" | "workplace" | "both";
          institution_slug?: string | null;
          rank?: number;
          generated_at?: string;
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
          source: "mutual" | "workplace" | "both";
          institution_slug: string | null;
        }[];
      };
      connection_recommendations_for_user: {
        Args: { target_user_id: string; limit_count?: number };
        Returns: {
          profile_id: string;
          mutual_count: number;
          mutual_ids: string[];
        }[];
      };
      connection_recommendations_merged_for_user: {
        Args: { target_user_id: string; limit_count?: number };
        Returns: {
          profile_id: string;
          mutual_count: number;
          mutual_ids: string[];
          source: "mutual" | "workplace" | "both";
          institution_slug: string | null;
        }[];
      };
      workplace_colleague_recommendations_for_user: {
        Args: { target_user_id: string; limit_count?: number };
        Returns: {
          profile_id: string;
          institution_slug: string | null;
        }[];
      };
      refresh_connection_recommendation_snapshots: {
        Args: { limit_count?: number };
        Returns: number;
      };
      get_profile_cv_draft: {
        Args: { target_id: string };
        Returns: Json;
      };
      search_profiles_by_name: {
        Args: {
          name_pattern: string;
          result_limit?: number;
          exclude_admin?: boolean;
        };
        Returns: {
          id: string;
          full_name: string;
          headline: string | null;
          workplace_institution_slug: string | null;
          avatar_url: string | null;
          cv_draft: Json | null;
          deleted_at: string | null;
        }[];
      };
      is_admin: {
        Args: { target_user_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
