export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      abandoned_checkouts: {
        Row: {
          cart_items: Json | null
          cart_total: number | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          district: string | null
          division: string | null
          id: string
          recovered: boolean
          shipping_address: string | null
          upazila: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cart_items?: Json | null
          cart_total?: number | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          district?: string | null
          division?: string | null
          id?: string
          recovered?: boolean
          shipping_address?: string | null
          upazila?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cart_items?: Json | null
          cart_total?: number | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          district?: string | null
          division?: string | null
          id?: string
          recovered?: boolean
          shipping_address?: string | null
          upazila?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string
          cta_link: string | null
          cta_text: string | null
          id: string
          image_url: string | null
          is_active: boolean
          show_text_overlay: boolean
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          show_text_overlay?: boolean
          sort_order?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          show_text_overlay?: boolean
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          expense_date: string
          id: string
          notes: string | null
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          created_by?: string | null
          expense_date?: string
          id?: string
          notes?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          expense_date?: string
          id?: string
          notes?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          name_bn: string
          pricing_note: string | null
          requires_weight: boolean
          sort_order: number
          suggested_price_per_kg: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          name_bn: string
          pricing_note?: string | null
          requires_weight?: boolean
          sort_order?: number
          suggested_price_per_kg?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          name_bn?: string
          pricing_note?: string | null
          requires_weight?: boolean
          sort_order?: number
          suggested_price_per_kg?: number | null
        }
        Relationships: []
      }
      courier_charges: {
        Row: {
          charge_per_kg: number
          created_at: string
          district: string
          division: string
          id: string
          label: string | null
          upazila: string | null
          updated_at: string
        }
        Insert: {
          charge_per_kg?: number
          created_at?: string
          district: string
          division: string
          id?: string
          label?: string | null
          upazila?: string | null
          updated_at?: string
        }
        Update: {
          charge_per_kg?: number
          created_at?: string
          district?: string
          division?: string
          id?: string
          label?: string | null
          upazila?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      courier_providers: {
        Row: {
          created_at: string
          credentials: Json
          display_name: string
          id: string
          is_active: boolean
          is_default: boolean
          provider_key: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          credentials?: Json
          display_name: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          provider_key: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          credentials?: Json
          display_name?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          provider_key?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      customer_reviews: {
        Row: {
          contact_info: string | null
          created_at: string
          customer_image: string | null
          customer_name: string
          id: string
          is_active: boolean
          location: string | null
          product_id: string | null
          rating: number
          review_images: string[]
          review_text: string
          sort_order: number
          status: string
          submitted_by_customer: boolean
          updated_at: string
        }
        Insert: {
          contact_info?: string | null
          created_at?: string
          customer_image?: string | null
          customer_name: string
          id?: string
          is_active?: boolean
          location?: string | null
          product_id?: string | null
          rating?: number
          review_images?: string[]
          review_text: string
          sort_order?: number
          status?: string
          submitted_by_customer?: boolean
          updated_at?: string
        }
        Update: {
          contact_info?: string | null
          created_at?: string
          customer_image?: string | null
          customer_name?: string
          id?: string
          is_active?: boolean
          location?: string | null
          product_id?: string | null
          rating?: number
          review_images?: string[]
          review_text?: string
          sort_order?: number
          status?: string
          submitted_by_customer?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          body: string | null
          created_at: string
          error_message: string | null
          gmail_message_id: string | null
          id: string
          metadata: Json | null
          recipient_email: string
          recipient_name: string | null
          related_order_id: string | null
          related_user_id: string | null
          sent_by: string | null
          status: string
          subject: string
          template_key: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          error_message?: string | null
          gmail_message_id?: string | null
          id?: string
          metadata?: Json | null
          recipient_email: string
          recipient_name?: string | null
          related_order_id?: string | null
          related_user_id?: string | null
          sent_by?: string | null
          status?: string
          subject: string
          template_key?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          error_message?: string | null
          gmail_message_id?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string
          recipient_name?: string | null
          related_order_id?: string | null
          related_user_id?: string | null
          sent_by?: string | null
          status?: string
          subject?: string
          template_key?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string
          description: string | null
          html_body: string
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          subject: string
          template_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          html_body: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          subject: string
          template_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          html_body?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          subject?: string
          template_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_purchases: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          product_id: string | null
          product_name: string
          purchase_date: string
          quantity: number
          supplier_name: string | null
          total_cost: number
          unit_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          product_name: string
          purchase_date?: string
          quantity?: number
          supplier_name?: string | null
          total_cost?: number
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          product_name?: string
          purchase_date?: string
          quantity?: number
          supplier_name?: string | null
          total_cost?: number
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_pages: {
        Row: {
          bullet_points: Json
          bundle_discount_percent: number | null
          bundle_label: string | null
          countdown_enabled: boolean
          countdown_end_at: string | null
          created_at: string
          cta_text: string
          enable_bundle: boolean
          expire_at: string | null
          facebook_pixel_id: string | null
          faq_items: Json
          featured_review_ids: string[]
          hero_headline: string
          hero_image_url: string | null
          hero_subheadline: string | null
          hero_video_url: string | null
          id: string
          long_description: string | null
          meta_description: string | null
          order_count: number
          products: Json
          publish_at: string | null
          slug: string
          status: string
          stock_counter_enabled: boolean
          stock_counter_value: number | null
          theme_preset: string
          title: string
          total_revenue: number
          trust_badges: Json
          updated_at: string
          view_count: number
        }
        Insert: {
          bullet_points?: Json
          bundle_discount_percent?: number | null
          bundle_label?: string | null
          countdown_enabled?: boolean
          countdown_end_at?: string | null
          created_at?: string
          cta_text?: string
          enable_bundle?: boolean
          expire_at?: string | null
          facebook_pixel_id?: string | null
          faq_items?: Json
          featured_review_ids?: string[]
          hero_headline: string
          hero_image_url?: string | null
          hero_subheadline?: string | null
          hero_video_url?: string | null
          id?: string
          long_description?: string | null
          meta_description?: string | null
          order_count?: number
          products?: Json
          publish_at?: string | null
          slug: string
          status?: string
          stock_counter_enabled?: boolean
          stock_counter_value?: number | null
          theme_preset?: string
          title: string
          total_revenue?: number
          trust_badges?: Json
          updated_at?: string
          view_count?: number
        }
        Update: {
          bullet_points?: Json
          bundle_discount_percent?: number | null
          bundle_label?: string | null
          countdown_enabled?: boolean
          countdown_end_at?: string | null
          created_at?: string
          cta_text?: string
          enable_bundle?: boolean
          expire_at?: string | null
          facebook_pixel_id?: string | null
          faq_items?: Json
          featured_review_ids?: string[]
          hero_headline?: string
          hero_image_url?: string | null
          hero_subheadline?: string | null
          hero_video_url?: string | null
          id?: string
          long_description?: string | null
          meta_description?: string | null
          order_count?: number
          products?: Json
          publish_at?: string | null
          slug?: string
          status?: string
          stock_counter_enabled?: boolean
          stock_counter_value?: number | null
          theme_preset?: string
          title?: string
          total_revenue?: number
          trust_badges?: Json
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          commission_amount: number
          commission_percent: number
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string | null
          product_name: string
          quantity: number
          vendor_id: string | null
          vendor_payout_amount: number
        }
        Insert: {
          commission_amount?: number
          commission_percent?: number
          created_at?: string
          id?: string
          order_id: string
          price: number
          product_id?: string | null
          product_name: string
          quantity: number
          vendor_id?: string | null
          vendor_payout_amount?: number
        }
        Update: {
          commission_amount?: number
          commission_percent?: number
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
          vendor_id?: string | null
          vendor_payout_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          city: string
          courier_provider: string | null
          courier_tracking_id: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          delivery_fee: number | null
          district: string | null
          id: string
          landing_page_id: string | null
          notes: string | null
          order_number: string
          pathao_consignment_id: string | null
          pathao_order_status: string | null
          pathao_tracking_url: string | null
          payment_method: string
          shipping_address: string
          shipping_cost: number
          status: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          city: string
          courier_provider?: string | null
          courier_tracking_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          delivery_fee?: number | null
          district?: string | null
          id?: string
          landing_page_id?: string | null
          notes?: string | null
          order_number: string
          pathao_consignment_id?: string | null
          pathao_order_status?: string | null
          pathao_tracking_url?: string | null
          payment_method?: string
          shipping_address: string
          shipping_cost?: number
          status?: string
          subtotal: number
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          city?: string
          courier_provider?: string | null
          courier_tracking_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_fee?: number | null
          district?: string | null
          id?: string
          landing_page_id?: string | null
          notes?: string | null
          order_number?: string
          pathao_consignment_id?: string | null
          pathao_order_status?: string | null
          pathao_tracking_url?: string | null
          payment_method?: string
          shipping_address?: string
          shipping_cost?: number
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: false
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          coming_soon: boolean
          compare_price: number | null
          cost_price: number
          created_at: string
          description: string | null
          description_bn: string | null
          grade: string | null
          id: string
          image_url: string | null
          images: string[] | null
          is_active: boolean
          is_featured: boolean
          name: string
          name_bn: string
          price: number
          stock: number
          unit: string | null
          updated_at: string
          vendor_id: string | null
          vendor_status: string
          weight: string | null
        }
        Insert: {
          category_id?: string | null
          coming_soon?: boolean
          compare_price?: number | null
          cost_price?: number
          created_at?: string
          description?: string | null
          description_bn?: string | null
          grade?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          name: string
          name_bn: string
          price: number
          stock?: number
          unit?: string | null
          updated_at?: string
          vendor_id?: string | null
          vendor_status?: string
          weight?: string | null
        }
        Update: {
          category_id?: string | null
          coming_soon?: boolean
          compare_price?: number | null
          cost_price?: number
          created_at?: string
          description?: string | null
          description_bn?: string | null
          grade?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          name?: string
          name_bn?: string
          price?: number
          stock?: number
          unit?: string | null
          updated_at?: string
          vendor_id?: string | null
          vendor_status?: string
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_address: string | null
          default_district: string | null
          default_division: string | null
          default_upazila: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_address?: string | null
          default_district?: string | null
          default_division?: string | null
          default_upazila?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_address?: string | null
          default_district?: string | null
          default_division?: string | null
          default_upazila?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_addresses: {
        Row: {
          address: string
          created_at: string
          district: string
          division: string
          email: string | null
          full_name: string
          id: string
          is_default: boolean
          label: string
          phone: string
          upazila: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          district: string
          division: string
          email?: string | null
          full_name: string
          id?: string
          is_default?: boolean
          label?: string
          phone: string
          upazila: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          district?: string
          division?: string
          email?: string | null
          full_name?: string
          id?: string
          is_default?: boolean
          label?: string
          phone?: string
          upazila?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          label: string | null
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          label?: string | null
          updated_at?: string
          value?: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          label?: string | null
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_payouts: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          method: string
          payout_account: string | null
          processed_at: string | null
          processed_by: string | null
          requested_at: string
          status: string
          transaction_ref: string | null
          updated_at: string
          vendor_id: string
          vendor_notes: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          method?: string
          payout_account?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: string
          transaction_ref?: string | null
          updated_at?: string
          vendor_id: string
          vendor_notes?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          method?: string
          payout_account?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: string
          transaction_ref?: string | null
          updated_at?: string
          vendor_id?: string
          vendor_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payouts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_settings: {
        Row: {
          account_holder: string | null
          account_number: string | null
          bank_branch: string | null
          bank_name: string | null
          bkash_number: string | null
          created_at: string
          id: string
          nagad_number: string | null
          notes: string | null
          preferred_method: string
          rocket_number: string | null
          routing_number: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          bkash_number?: string | null
          created_at?: string
          id?: string
          nagad_number?: string | null
          notes?: string | null
          preferred_method?: string
          rocket_number?: string | null
          routing_number?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          bkash_number?: string | null
          created_at?: string
          id?: string
          nagad_number?: string | null
          notes?: string | null
          preferred_method?: string
          rocket_number?: string | null
          routing_number?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_settings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string
          approved_at: string | null
          approved_by: string | null
          banner_url: string | null
          commission_percent: number
          created_at: string
          description: string | null
          district: string
          division: string
          email: string
          facebook_url: string | null
          id: string
          logo_url: string | null
          nid_number: string
          owner_name: string
          phone: string
          rejection_reason: string | null
          shop_name: string
          shop_name_bn: string
          shop_slug: string
          status: string
          total_commission_earned: number
          total_orders: number
          total_revenue: number
          upazila: string
          updated_at: string
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          address: string
          approved_at?: string | null
          approved_by?: string | null
          banner_url?: string | null
          commission_percent?: number
          created_at?: string
          description?: string | null
          district: string
          division: string
          email: string
          facebook_url?: string | null
          id?: string
          logo_url?: string | null
          nid_number: string
          owner_name: string
          phone: string
          rejection_reason?: string | null
          shop_name: string
          shop_name_bn: string
          shop_slug: string
          status?: string
          total_commission_earned?: number
          total_orders?: number
          total_revenue?: number
          upazila: string
          updated_at?: string
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          address?: string
          approved_at?: string | null
          approved_by?: string | null
          banner_url?: string | null
          commission_percent?: number
          created_at?: string
          description?: string | null
          district?: string
          division?: string
          email?: string
          facebook_url?: string | null
          id?: string
          logo_url?: string | null
          nid_number?: string
          owner_name?: string
          phone?: string
          rejection_reason?: string | null
          shop_name?: string
          shop_name_bn?: string
          shop_slug?: string
          status?: string
          total_commission_earned?: number
          total_orders?: number
          total_revenue?: number
          upazila?: string
          updated_at?: string
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_get_vendor_activity: { Args: { _vendor_id: string }; Returns: Json }
      count_orders_by_email: { Args: { _email: string }; Returns: number }
      generate_order_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_landing_page_view: {
        Args: { _slug: string }
        Returns: undefined
      }
      lookup_order_by_number: {
        Args: { _order_number: string; _phone: string }
        Returns: {
          city: string
          created_at: string
          delivery_fee: number
          district: string
          id: string
          order_number: string
          pathao_consignment_id: string
          pathao_order_status: string
          pathao_tracking_url: string
          payment_method: string
          shipping_address: string
          shipping_cost: number
          status: string
          subtotal: number
          total: number
        }[]
      }
      lookup_order_items_by_number: {
        Args: { _order_number: string; _phone: string }
        Returns: {
          id: string
          price: number
          product_id: string
          product_name: string
          quantity: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "vendor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "vendor"],
    },
  },
} as const
