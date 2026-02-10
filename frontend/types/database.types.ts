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
      users: {
        Row: {
          id: string
          user_id: number
          name: string | null
          email: string | null
          phone: string | null
          tokens: number
          status: 'active' | 'inactive'
          total_draws: number
          total_spent: number
          address: string | null
          recipient_name: string | null
          recipient_phone: string | null
          created_at: string
          last_login_at: string | null
          invite_code: string | null
        }
        Insert: {
          id: string
          user_id?: number
          name?: string | null
          email?: string | null
          phone?: string | null
          tokens?: number
          status?: 'active' | 'inactive'
          total_draws?: number
          total_spent?: number
          address?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          created_at?: string
          last_login_at?: string | null
          invite_code?: string | null
        }
        Update: {
          id?: string
          user_id?: number
          name?: string | null
          email?: string | null
          phone?: string | null
          tokens?: number
          status?: 'active' | 'inactive'
          total_draws?: number
          total_spent?: number
          address?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          created_at?: string
          last_login_at?: string | null
          invite_code?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          username: string | null
          email: string | null
          avatar_url: string | null
          points: number
          recipient_name: string | null
          recipient_phone: string | null
          recipient_address: string | null
          role: 'user' | 'admin'
          status: 'active' | 'banned'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          email?: string | null
          avatar_url?: string | null
          points?: number
          recipient_name?: string | null
          recipient_phone?: string | null
          recipient_address?: string | null
          role?: 'user' | 'admin'
          status?: 'active' | 'banned'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          email?: string | null
          avatar_url?: string | null
          points?: number
          recipient_name?: string | null
          recipient_phone?: string | null
          recipient_address?: string | null
          role?: 'user' | 'admin'
          status?: 'active' | 'banned'
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: number
          product_code: string | null
          name: string
          image_url: string | null
          category: string
          price: number
          status: 'active' | 'pending' | 'ended'
          is_hot: boolean
          total_count: number
          remaining: number
          release_date: string | null
          created_at: string
          major_prizes: string[] | null
          distributor: string | null
          rarity: number | null
          txid_hash: string | null
          seed: string | null
          ended_at: string | null
          type: 'ichiban' | 'blindbox' | 'gacha' | 'custom'
        }
        Insert: {
          id?: number
          product_code?: string | null
          name: string
          image_url?: string | null
          category?: string
          price?: number
          status?: 'active' | 'pending' | 'ended'
          is_hot?: boolean
          total_count?: number
          remaining?: number
          release_date?: string | null
          created_at?: string
          major_prizes?: string[] | null
          distributor?: string | null
          rarity?: number | null
          txid_hash?: string | null
          seed?: string | null
          ended_at?: string | null
          type?: 'ichiban' | 'blindbox' | 'gacha' | 'custom'
        }
        Update: {
          id?: number
          product_code?: string | null
          name?: string
          image_url?: string | null
          category?: string
          price?: number
          status?: 'active' | 'pending' | 'ended'
          is_hot?: boolean
          total_count?: number
          remaining?: number
          release_date?: string | null
          created_at?: string
          major_prizes?: string[] | null
          distributor?: string | null
          rarity?: number | null
          txid_hash?: string | null
          seed?: string | null
          ended_at?: string | null
          type?: 'ichiban' | 'blindbox' | 'gacha' | 'custom'
        }
      }
      product_tags: {
        Row: {
          product_id: number
          category_id: string
          created_at: string
        }
        Insert: {
          product_id: number
          category_id: string
          created_at?: string
        }
        Update: {
          product_id?: number
          category_id?: string
          created_at?: string
        }
      }
      product_prizes: {
        Row: {
          id: number
          product_id: number
          level: string
          name: string
          image_url: string | null
          total: number
          remaining: number
          probability: number | null
          created_at: string | null
        }
        Insert: {
          id?: number
          product_id: number
          level: string
          name: string
          image_url?: string | null
          total: number
          remaining: number
          probability?: number | null
          created_at?: string | null
        }
        Update: {
          id?: number
          product_id?: number
          level?: string
          name?: string
          image_url?: string | null
          total?: number
          remaining?: number
          probability?: number | null
          created_at?: string | null
        }
      }
      draw_records: {
        Row: {
          id: number
          user_id: string | null
          product_id: number | null
          prize_level: string | null
          ticket_number: number | null
          status: 'in_warehouse' | 'pending_delivery' | 'shipped' | 'exchanged'
          order_id: string | null
          product_prize_id: number | null
          created_at: string
          txid_nonce: number | null
          txid_hash: string | null
          profit_rate: number | null
          random_value: number | null
        }
        Insert: {
          id?: number
          user_id?: string | null
          product_id?: number | null
          prize_level?: string | null
          ticket_number?: number | null
          status?: 'in_warehouse' | 'pending_delivery' | 'shipped' | 'exchanged'
          order_id?: string | null
          product_prize_id?: number | null
          created_at?: string
          txid_nonce?: number | null
          txid_hash?: string | null
          profit_rate?: number | null
          random_value?: number | null
        }
        Update: {
          id?: number
          user_id?: string | null
          product_id?: number | null
          prize_level?: string | null
          ticket_number?: number | null
          status?: 'in_warehouse' | 'pending_delivery' | 'shipped' | 'exchanged'
          order_id?: string | null
          product_prize_id?: number | null
          created_at?: string
          txid_nonce?: number | null
          txid_hash?: string | null
          profit_rate?: number | null
          random_value?: number | null
        }
      }
      recharge_records: {
        Row: {
          id: number
          order_number: string | null
          user_id: string | null
          amount: number | null
          bonus: number | null
          status: string | null
          created_at: string
        }
        Insert: {
          id?: number
          order_number?: string | null
          user_id?: string | null
          amount?: number | null
          bonus?: number | null
          status?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          order_number?: string | null
          user_id?: string | null
          amount?: number | null
          bonus?: number | null
          status?: string | null
          created_at?: string
        }
      }
      prizes: {
        Row: {
          id: string
          product_id: number | null
          grade: string
          name: string
          image_url: string | null
          quantity: number
          probability: number | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id?: number | null
          grade: string
          name: string
          image_url?: string | null
          quantity?: number
          probability?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: number | null
          grade?: string
          name?: string
          image_url?: string | null
          quantity?: number
          probability?: number | null
          created_at?: string
        }
      }
      draw_history: {
        Row: {
          id: string
          user_id: string | null
          product_id: number | null
          prize_id: string | null
          ticket_no: string | null
          status: 'in_warehouse' | 'pending_delivery' | 'shipped' | 'exchanged'
          delivery_order_id: string | null
          cost: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          product_id?: number | null
          prize_id?: string | null
          ticket_no?: string | null
          status?: 'in_warehouse' | 'pending_delivery' | 'shipped' | 'exchanged'
          delivery_order_id?: string | null
          cost?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          product_id?: number | null
          prize_id?: string | null
          ticket_no?: string | null
          status?: 'in_warehouse' | 'pending_delivery' | 'shipped' | 'exchanged'
          delivery_order_id?: string | null
          cost?: number
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          amount: number
          points: number
          payment_method: string | null
          status: 'pending' | 'paid' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          amount: number
          points: number
          payment_method?: string | null
          status?: 'pending' | 'paid' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          amount?: number
          points?: number
          payment_method?: string | null
          status?: 'pending' | 'paid' | 'failed'
          created_at?: string
        }
      }
      delivery_orders: {
        Row: {
          id: string
          user_id: string | null
          recipient_name: string | null
          recipient_phone: string | null
          recipient_address: string | null
          shipping_method: string | null
          tracking_number: string | null
          status: 'pending' | 'shipping' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          recipient_address?: string | null
          shipping_method?: string | null
          tracking_number?: string | null
          status?: 'pending' | 'shipping' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          recipient_address?: string | null
          shipping_method?: string | null
          tracking_number?: string | null
          status?: 'pending' | 'shipping' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      product_follows: {
        Row: {
          user_id: string
          product_id: number
          created_at: string
        }
        Insert: {
          user_id: string
          product_id: number
          created_at?: string
        }
        Update: {
          user_id?: string
          product_id?: number
          created_at?: string
        }
      }
      news: {
        Row: {
          id: string
          title: string
          content: string | null
          category: string | null
          image_url: string | null
          is_published: boolean
          published_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          content?: string | null
          category?: string | null
          image_url?: string | null
          is_published?: boolean
          published_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string | null
          category?: string | null
          image_url?: string | null
          is_published?: boolean
          published_at?: string | null
          created_at?: string
        }
      }
      banners: {
        Row: {
          id: string
          image_url: string
          link_url: string | null
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          image_url: string
          link_url?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          image_url?: string
          link_url?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
      }
      coupons: {
        Row: {
          id: string
          code: string | null
          title: string
          description: string | null
          discount_type: 'fixed' | 'percentage'
          discount_value: number
          min_spend: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code?: string | null
          title: string
          description?: string | null
          discount_type: 'fixed' | 'percentage'
          discount_value: number
          min_spend?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          code?: string | null
          title?: string
          description?: string | null
          discount_type?: 'fixed' | 'percentage'
          discount_value?: number
          min_spend?: number
          is_active?: boolean
          created_at?: string
        }
      }
      user_coupons: {
        Row: {
          id: string
          user_id: string
          coupon_id: string
          status: 'unused' | 'used' | 'expired'
          used_at: string | null
          expiry_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          coupon_id: string
          status?: 'unused' | 'used' | 'expired'
          used_at?: string | null
          expiry_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          coupon_id?: string
          status?: 'unused' | 'used' | 'expired'
          used_at?: string | null
          expiry_date?: string | null
          created_at?: string
        }
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string | null
          referee_id: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id?: string | null
          referee_id?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          referrer_id?: string | null
          referee_id?: string | null
          status?: string
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          name: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
      }
    }
    Functions: {
      play_ichiban: {
        Args: {
          p_product_id: number
          p_ticket_numbers: number[]
        }
        Returns: Json
      }
    }
  }
}
