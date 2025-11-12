export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          name: string
          domain: string
          ga4_property_id: string | null
          gsc_url: string | null
          gtm_container_id: string | null
          focus_service: string | null
          primary_location: string | null
          status: 'active' | 'paused' | 'archived'
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          domain: string
          ga4_property_id?: string | null
          gsc_url?: string | null
          gtm_container_id?: string | null
          focus_service?: string | null
          primary_location?: string | null
          status?: 'active' | 'paused' | 'archived'
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string
          ga4_property_id?: string | null
          gsc_url?: string | null
          gtm_container_id?: string | null
          focus_service?: string | null
          primary_location?: string | null
          status?: 'active' | 'paused' | 'archived'
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          client_id: string
          month: number
          name: string
          description: string | null
          category: 'keyword_research' | 'content' | 'technical_seo' | 'backlinks' | 'local_seo' | 'analytics'
          automated: boolean
          automation_config: Json | null
          status: 'pending' | 'in_progress' | 'completed' | 'blocked'
          completed_at: string | null
          assigned_to: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          month: number
          name: string
          description?: string | null
          category: 'keyword_research' | 'content' | 'technical_seo' | 'backlinks' | 'local_seo' | 'analytics'
          automated?: boolean
          automation_config?: Json | null
          status?: 'pending' | 'in_progress' | 'completed' | 'blocked'
          completed_at?: string | null
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          month?: number
          name?: string
          description?: string | null
          category?: 'keyword_research' | 'content' | 'technical_seo' | 'backlinks' | 'local_seo' | 'analytics'
          automated?: boolean
          automation_config?: Json | null
          status?: 'pending' | 'in_progress' | 'completed' | 'blocked'
          completed_at?: string | null
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      metrics: {
        Row: {
          id: string
          client_id: string
          date: string
          period_type: 'daily' | 'weekly' | 'monthly'
          traffic: number
          sessions: number
          bounce_rate: number | null
          avg_session_duration: number | null
          ranking_avg: number | null
          top_10_keywords: number
          total_keywords: number
          backlinks_count: number
          referring_domains: number
          domain_rating: number | null
          gbp_views: number
          gbp_actions: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          date: string
          period_type?: 'daily' | 'weekly' | 'monthly'
          traffic?: number
          sessions?: number
          bounce_rate?: number | null
          avg_session_duration?: number | null
          ranking_avg?: number | null
          top_10_keywords?: number
          total_keywords?: number
          backlinks_count?: number
          referring_domains?: number
          domain_rating?: number | null
          gbp_views?: number
          gbp_actions?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          date?: string
          period_type?: 'daily' | 'weekly' | 'monthly'
          traffic?: number
          sessions?: number
          bounce_rate?: number | null
          avg_session_duration?: number | null
          ranking_avg?: number | null
          top_10_keywords?: number
          total_keywords?: number
          backlinks_count?: number
          referring_domains?: number
          domain_rating?: number | null
          gbp_views?: number
          gbp_actions?: number
          created_at?: string
          updated_at?: string
        }
      }
      keywords: {
        Row: {
          id: string
          client_id: string
          keyword: string
          search_volume: number | null
          difficulty: number | null
          cpc: number | null
          current_position: number | null
          best_position: number | null
          target_url: string | null
          intent: 'informational' | 'commercial' | 'transactional' | 'navigational' | null
          category: string | null
          priority: 'low' | 'medium' | 'high'
          first_tracked: string
          last_checked: string
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          keyword: string
          search_volume?: number | null
          difficulty?: number | null
          cpc?: number | null
          current_position?: number | null
          best_position?: number | null
          target_url?: string | null
          intent?: 'informational' | 'commercial' | 'transactional' | 'navigational' | null
          category?: string | null
          priority?: 'low' | 'medium' | 'high'
          first_tracked?: string
          last_checked?: string
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          keyword?: string
          search_volume?: number | null
          difficulty?: number | null
          cpc?: number | null
          current_position?: number | null
          best_position?: number | null
          target_url?: string | null
          intent?: 'informational' | 'commercial' | 'transactional' | 'navigational' | null
          category?: string | null
          priority?: 'low' | 'medium' | 'high'
          first_tracked?: string
          last_checked?: string
          created_at?: string
        }
      }
      content: {
        Row: {
          id: string
          client_id: string
          title: string
          url: string | null
          type: 'blog' | 'page' | 'service' | 'location' | null
          status: 'draft' | 'in_review' | 'published' | 'updated'
          target_keyword: string | null
          word_count: number | null
          readability_score: number | null
          ai_generated: boolean
          ai_prompt: string | null
          published_at: string | null
          last_updated: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          title: string
          url?: string | null
          type?: 'blog' | 'page' | 'service' | 'location' | null
          status?: 'draft' | 'in_review' | 'published' | 'updated'
          target_keyword?: string | null
          word_count?: number | null
          readability_score?: number | null
          ai_generated?: boolean
          ai_prompt?: string | null
          published_at?: string | null
          last_updated?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          title?: string
          url?: string | null
          type?: 'blog' | 'page' | 'service' | 'location' | null
          status?: 'draft' | 'in_review' | 'published' | 'updated'
          target_keyword?: string | null
          word_count?: number | null
          readability_score?: number | null
          ai_generated?: boolean
          ai_prompt?: string | null
          published_at?: string | null
          last_updated?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      backlinks: {
        Row: {
          id: string
          client_id: string
          source_url: string
          target_url: string
          anchor_text: string | null
          source_domain_rating: number | null
          link_type: 'dofollow' | 'nofollow' | 'ugc' | 'sponsored' | null
          status: 'active' | 'lost' | 'broken'
          discovered_at: string
          last_checked: string
          lost_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          source_url: string
          target_url: string
          anchor_text?: string | null
          source_domain_rating?: number | null
          link_type?: 'dofollow' | 'nofollow' | 'ugc' | 'sponsored' | null
          status?: 'active' | 'lost' | 'broken'
          discovered_at?: string
          last_checked?: string
          lost_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          source_url?: string
          target_url?: string
          anchor_text?: string | null
          source_domain_rating?: number | null
          link_type?: 'dofollow' | 'nofollow' | 'ugc' | 'sponsored' | null
          status?: 'active' | 'lost' | 'broken'
          discovered_at?: string
          last_checked?: string
          lost_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          client_id: string
          month: string
          year: number
          report_type: 'monthly' | 'quarterly' | 'custom'
          pdf_url: string | null
          report_data: Json | null
          status: 'draft' | 'generated' | 'sent'
          sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          month: string
          year: number
          report_type?: 'monthly' | 'quarterly' | 'custom'
          pdf_url?: string | null
          report_data?: Json | null
          status?: 'draft' | 'generated' | 'sent'
          sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          month?: string
          year?: number
          report_type?: 'monthly' | 'quarterly' | 'custom'
          pdf_url?: string | null
          report_data?: Json | null
          status?: 'draft' | 'generated' | 'sent'
          sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      client_interviews: {
        Row: {
          id: string
          client_id: string
          interview_type: 'onboarding' | 'monthly' | 'quarterly' | null
          questions: Json
          responses: Json | null
          ai_analysis: Json | null
          status: 'sent' | 'completed' | 'analyzed'
          sent_at: string
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          interview_type?: 'onboarding' | 'monthly' | 'quarterly' | null
          questions: Json
          responses?: Json | null
          ai_analysis?: Json | null
          status?: 'sent' | 'completed' | 'analyzed'
          sent_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          interview_type?: 'onboarding' | 'monthly' | 'quarterly' | null
          questions?: Json
          responses?: Json | null
          ai_analysis?: Json | null
          status?: 'sent' | 'completed' | 'analyzed'
          sent_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
