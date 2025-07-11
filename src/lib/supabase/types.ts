/**
 * Database Type Definitions for Hotel Management System
 * Generated for Indian hotel operations with 18 rooms
 * Includes complete auth, profiles, and all hotel management tables
 */

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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'manager' | 'staff' | 'receptionist'
          phone: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'manager' | 'staff' | 'receptionist'
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'manager' | 'staff' | 'receptionist'
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      hotel_config: {
        Row: {
          id: string
          hotel_name: string
          address_line1: string | null
          address_line2: string | null
          city: string | null
          state: string | null
          pin_code: string | null
          phone: string | null
          email: string | null
          gst_number: string | null
          currency: string
          gst_rate: number
          check_in_time: string
          check_out_time: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hotel_name?: string
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          pin_code?: string | null
          phone?: string | null
          email?: string | null
          gst_number?: string | null
          currency?: string
          gst_rate?: number
          check_in_time?: string
          check_out_time?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hotel_name?: string
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          pin_code?: string | null
          phone?: string | null
          email?: string | null
          gst_number?: string | null
          currency?: string
          gst_rate?: number
          check_in_time?: string
          check_out_time?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          id: string
          room_number: string
          room_type: 'double-bed-deluxe' | 'vip' | 'executive-3bed'
          base_rate: number
          current_rate: number
          ac_rate: number | null
          non_ac_rate: number | null
          has_ac: boolean
          amenities: string[] | null
          status: 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'blocked'
          max_occupancy: number
          allow_extra_bed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_number: string
          room_type: 'double-bed-deluxe' | 'vip' | 'executive-3bed'
          base_rate: number
          current_rate: number
          ac_rate?: number | null
          non_ac_rate?: number | null
          has_ac?: boolean
          amenities?: string[] | null
          status?: 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'blocked'
          max_occupancy: number
          allow_extra_bed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_number?: string
          room_type?: 'double-bed-deluxe' | 'vip' | 'executive-3bed'
          base_rate?: number
          current_rate?: number
          ac_rate?: number | null
          non_ac_rate?: number | null
          has_ac?: boolean
          amenities?: string[] | null
          status?: 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'blocked'
          max_occupancy?: number
          allow_extra_bed?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
              customers: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string
          alternate_phone: string | null
          id_type: 'aadhaar' | 'pan' | 'passport' | 'driving_license' | 'voter_id'
          id_number: string
          id_photo_urls: string[] | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          state: string | null
          pin_code: string | null
          country: string | null
          date_of_birth: string | null
          gender: 'male' | 'female' | 'other' | null
          nationality: string | null
          is_blacklisted: boolean
          blacklist_reason: string | null
          notes: string | null
          total_bookings: number
          total_spent: number
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone: string
          id_type: 'aadhaar' | 'pan' | 'passport' | 'driving_license' | 'voter_id'
          id_number: string
          id_photo_urls?: string[] | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          pin_code?: string | null
          country?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string
          id_type?: 'aadhaar' | 'pan' | 'passport' | 'driving_license' | 'voter_id'
          id_number?: string
          id_photo_urls?: string[] | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          pin_code?: string | null
          country?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
              bookings: {
        Row: {
          id: string
          booking_number: string
          room_id: string
          primary_customer_id: string
          check_in_date: string
          check_out_date: string
          check_in_time: string
          check_out_time: string
          actual_check_in: string | null
          actual_check_out: string | null
          total_guests: number
          adults: number
          children: number
          room_rate: number
          total_nights: number
          base_amount: number
          discount_amount: number
          gst_amount: number
          total_amount: number
          paid_amount: number
          due_amount: number
          is_gst_inclusive: boolean
          extra_bed_count: number
          extra_bed_rate: number
          extra_bed_total: number
          additional_charges: Json | null
          custom_rate_applied: boolean
          ac_preference: boolean
          gst_mode: 'inclusive' | 'exclusive' | 'none'
          payment_status: 'pending' | 'partial' | 'paid' | 'refunded'
          booking_status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show'
          booking_source: 'walk_in' | 'phone' | 'online' | 'agent'
          special_requests: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          booking_number: string
          room_id: string
          primary_customer_id: string
          check_in_date: string
          check_out_date: string
          check_in_time?: string
          check_out_time?: string
          actual_check_in?: string | null
          actual_check_out?: string | null
          total_guests?: number
          adults?: number
          children?: number
          room_rate: number
          total_nights: number
          base_amount: number
          discount_amount?: number
          gst_amount: number
          total_amount: number
          paid_amount?: number
          due_amount?: number
          is_gst_inclusive?: boolean
          extra_bed_count?: number
          extra_bed_rate?: number
          extra_bed_total?: number
          additional_charges?: Json | null
          custom_rate_applied?: boolean
          gst_mode?: 'inclusive' | 'exclusive' | 'none'
          payment_status?: 'pending' | 'partial' | 'paid' | 'refunded'
          booking_status?: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show'
          booking_source?: 'walk_in' | 'phone' | 'online' | 'agent'
          special_requests?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          booking_number?: string
          room_id?: string
          primary_customer_id?: string
          check_in_date?: string
          check_out_date?: string
          check_in_time?: string
          check_out_time?: string
          actual_check_in?: string | null
          actual_check_out?: string | null
          total_guests?: number
          adults?: number
          children?: number
          room_rate?: number
          total_nights?: number
          base_amount?: number
          discount_amount?: number
          gst_amount?: number
          total_amount?: number
          paid_amount?: number
          due_amount?: number
          is_gst_inclusive?: boolean
          extra_bed_count?: number
          extra_bed_rate?: number
          extra_bed_total?: number
          additional_charges?: Json | null
          custom_rate_applied?: boolean
          gst_mode?: 'inclusive' | 'exclusive' | 'none'
          payment_status?: 'pending' | 'partial' | 'paid' | 'refunded'
          booking_status?: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show'
          booking_source?: 'walk_in' | 'phone' | 'online' | 'agent'
          special_requests?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_room_id_fkey"
            columns: ["room_id"]
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_primary_customer_id_fkey"
            columns: ["primary_customer_id"]
            referencedRelation: "customers"
            referencedColumns: ["id"]
          }
        ]
      }
      booking_guests: {
        Row: {
          id: string
          booking_id: string
          customer_id: string
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          customer_id: string
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          customer_id?: string
          is_primary?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_guests_booking_id_fkey"
            columns: ["booking_id"]
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_guests_customer_id_fkey"
            columns: ["customer_id"]
            referencedRelation: "customers"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          payment_method: 'cash' | 'card' | 'upi' | 'bank_transfer'
          amount: number
          payment_date: string
          reference_number: string | null
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          payment_method: 'cash' | 'card' | 'upi' | 'bank_transfer'
          amount: number
          payment_date?: string
          reference_number?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          payment_method?: 'cash' | 'card' | 'upi' | 'bank_transfer'
          amount?: number
          payment_date?: string
          reference_number?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          }
        ]
      }
      room_maintenance: {
        Row: {
          id: string
          room_id: string
          maintenance_type: 'cleaning' | 'repair' | 'upgrade' | 'inspection'
          description: string
          priority: 'low' | 'medium' | 'high' | 'urgent'
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          scheduled_date: string | null
          started_at: string | null
          completed_at: string | null
          estimated_cost: number | null
          actual_cost: number | null
          assigned_to: string | null
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          room_id: string
          maintenance_type: 'cleaning' | 'repair' | 'upgrade' | 'inspection'
          description: string
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          scheduled_date?: string | null
          started_at?: string | null
          completed_at?: string | null
          estimated_cost?: number | null
          actual_cost?: number | null
          assigned_to?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          room_id?: string
          maintenance_type?: 'cleaning' | 'repair' | 'upgrade' | 'inspection'
          description?: string
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          scheduled_date?: string | null
          started_at?: string | null
          completed_at?: string | null
          estimated_cost?: number | null
          actual_cost?: number | null
          assigned_to?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_maintenance_room_id_fkey"
            columns: ["room_id"]
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_maintenance_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      room_rates: {
        Row: {
          id: string
          room_type: string
          rate_date: string
          base_rate: number
          weekend_rate: number | null
          holiday_rate: number | null
          is_active: boolean
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          room_type: string
          rate_date: string
          base_rate: number
          weekend_rate?: number | null
          holiday_rate?: number | null
          is_active?: boolean
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          room_type?: string
          rate_date?: string
          base_rate?: number
          weekend_rate?: number | null
          holiday_rate?: number | null
          is_active?: boolean
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_rates_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          table_name: string
          record_id: string
          action: 'INSERT' | 'UPDATE' | 'DELETE'
          old_values: Json | null
          new_values: Json | null
          changed_by: string | null
          changed_at: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          table_name: string
          record_id: string
          action: 'INSERT' | 'UPDATE' | 'DELETE'
          old_values?: Json | null
          new_values?: Json | null
          changed_by?: string | null
          changed_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          table_name?: string
          record_id?: string
          action?: 'INSERT' | 'UPDATE' | 'DELETE'
          old_values?: Json | null
          new_values?: Json | null
          changed_by?: string | null
          changed_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_changed_by_fkey"
            columns: ["changed_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          title: string
          message: string
          type: 'info' | 'success' | 'warning' | 'error'
          is_read: boolean
          action_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          message: string
          type?: 'info' | 'success' | 'warning' | 'error'
          is_read?: boolean
          action_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          message?: string
          type?: 'info' | 'success' | 'warning' | 'error'
          is_read?: boolean
          action_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          invoice_date: string
          due_date: string | null
          customer_id: string | null
          customer_name: string
          customer_email: string | null
          customer_phone: string | null
          customer_address: string | null
          customer_city: string | null
          customer_state: string | null
          customer_pincode: string | null
          customer_country: string | null
          customer_gst_number: string | null
          hotel_name: string
          hotel_address: string
          hotel_city: string
          hotel_state: string
          hotel_pincode: string
          hotel_country: string
          hotel_phone: string | null
          hotel_email: string | null
          hotel_gst_number: string | null
          hotel_website: string | null
          currency: string
          exchange_rate: number | null
          subtotal: number
          total_tax: number
          total_discount: number
          total_amount: number
          paid_amount: number
          balance_amount: number
          status: string
          payment_status: string
          notes: string | null
          terms_and_conditions: string | null
          booking_id: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          invoice_number?: string
          invoice_date: string
          due_date?: string | null
          customer_id?: string | null
          customer_name: string
          customer_email?: string | null
          customer_phone?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_state?: string | null
          customer_pincode?: string | null
          customer_country?: string | null
          customer_gst_number?: string | null
          hotel_name: string
          hotel_address: string
          hotel_city: string
          hotel_state: string
          hotel_pincode: string
          hotel_country: string
          hotel_phone?: string | null
          hotel_email?: string | null
          hotel_gst_number?: string | null
          hotel_website?: string | null
          currency?: string
          exchange_rate?: number | null
          subtotal?: number
          total_tax?: number
          total_discount?: number
          total_amount?: number
          paid_amount?: number
          balance_amount?: number
          status?: string
          payment_status?: string
          notes?: string | null
          terms_and_conditions?: string | null
          booking_id?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          invoice_number?: string
          invoice_date?: string
          due_date?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_email?: string | null
          customer_phone?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_state?: string | null
          customer_pincode?: string | null
          customer_country?: string | null
          customer_gst_number?: string | null
          hotel_name?: string
          hotel_address?: string
          hotel_city?: string
          hotel_state?: string
          hotel_pincode?: string
          hotel_country?: string
          hotel_phone?: string | null
          hotel_email?: string | null
          hotel_gst_number?: string | null
          hotel_website?: string | null
          currency?: string
          exchange_rate?: number | null
          subtotal?: number
          total_tax?: number
          total_discount?: number
          total_amount?: number
          paid_amount?: number
          balance_amount?: number
          status?: string
          payment_status?: string
          notes?: string | null
          terms_and_conditions?: string | null
          booking_id?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      invoice_line_items: {
        Row: {
          id: string
          invoice_id: string
          item_type: string
          custom_item_type_id: string | null
          description: string
          quantity: number
          unit_price: number
          line_total: number
          tax_rate: number
          tax_amount: number
          tax_inclusive: boolean
          tax_name: string
          discount_rate: number
          discount_amount: number
          is_buffet_item: boolean
          buffet_type: string | null
          persons_count: number
          price_per_person: number
          item_date: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          item_type: string
          custom_item_type_id?: string | null
          description: string
          quantity: number
          unit_price: number
          line_total: number
          tax_rate?: number
          tax_amount?: number
          tax_inclusive?: boolean
          tax_name?: string
          discount_rate?: number
          discount_amount?: number
          is_buffet_item?: boolean
          buffet_type?: string | null
          persons_count?: number
          price_per_person?: number
          item_date?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          item_type?: string
          custom_item_type_id?: string | null
          description?: string
          quantity?: number
          unit_price?: number
          line_total?: number
          tax_rate?: number
          tax_amount?: number
          tax_inclusive?: boolean
          tax_name?: string
          discount_rate?: number
          discount_amount?: number
          is_buffet_item?: boolean
          buffet_type?: string | null
          persons_count?: number
          price_per_person?: number
          item_date?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoice_payments: {
        Row: {
          id: string
          invoice_id: string
          payment_date: string
          amount: number
          payment_method: string
          reference_number: string | null
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          invoice_id: string
          payment_date: string
          amount: number
          payment_method: string
          reference_number?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          invoice_id?: string
          payment_date?: string
          amount?: number
          payment_method?: string
          reference_number?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      room_availability: {
        Row: {
          id: string
          room_number: string
          room_type: string
          floor_number: number | null
          base_rate: number
          current_rate: number
          amenities: string[] | null
          status: string
          max_occupancy: number
          description: string | null
          images: string[] | null
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          is_available: boolean
          current_booking: string | null
          current_checkout: string | null
          current_guest: string | null
        }
      }
      booking_summary: {
        Row: {
          id: string
          booking_number: string
          room_id: string
          primary_customer_id: string
          check_in_date: string
          check_out_date: string
          actual_check_in: string | null
          actual_check_out: string | null
          total_guests: number
          adults: number
          children: number
          room_rate: number
          total_nights: number
          base_amount: number
          discount_amount: number
          gst_amount: number
          total_amount: number
          paid_amount: number
          due_amount: number
          is_gst_inclusive: boolean
          payment_status: string
          booking_status: string
          booking_source: string
          special_requests: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          room_number: string
          room_type: string
          primary_guest_name: string
          primary_guest_phone: string
          total_paid: number
          balance_due: number
        }
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          invoice_date: string
          due_date: string | null
          customer_id: string | null
          customer_name: string
          customer_email: string | null
          customer_phone: string | null
          customer_address: string | null
          customer_city: string | null
          customer_state: string | null
          customer_pincode: string | null
          customer_country: string | null
          customer_gst_number: string | null
          hotel_name: string
          hotel_address: string
          hotel_city: string
          hotel_state: string
          hotel_pincode: string
          hotel_country: string
          hotel_phone: string | null
          hotel_email: string | null
          hotel_gst_number: string | null
          hotel_website: string | null
          currency: string
          exchange_rate: number | null
          subtotal: number
          total_tax: number
          total_discount: number
          total_amount: number
          paid_amount: number
          balance_amount: number
          status: string
          payment_status: string
          notes: string | null
          terms_and_conditions: string | null
          booking_id: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          invoice_number: string
          invoice_date?: string
          due_date?: string | null
          customer_id?: string | null
          customer_name: string
          customer_email?: string | null
          customer_phone?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_state?: string | null
          customer_pincode?: string | null
          customer_country?: string | null
          customer_gst_number?: string | null
          hotel_name?: string
          hotel_address?: string
          hotel_city?: string
          hotel_state?: string
          hotel_pincode?: string
          hotel_country?: string
          hotel_phone?: string | null
          hotel_email?: string | null
          hotel_gst_number?: string | null
          hotel_website?: string | null
          currency?: string
          exchange_rate?: number | null
          subtotal?: number
          total_tax?: number
          total_discount?: number
          total_amount?: number
          paid_amount?: number
          balance_amount?: number
          status?: string
          payment_status?: string
          notes?: string | null
          terms_and_conditions?: string | null
          booking_id?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          invoice_number?: string
          invoice_date?: string
          due_date?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_email?: string | null
          customer_phone?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_state?: string | null
          customer_pincode?: string | null
          customer_country?: string | null
          customer_gst_number?: string | null
          hotel_name?: string
          hotel_address?: string
          hotel_city?: string
          hotel_state?: string
          hotel_pincode?: string
          hotel_country?: string
          hotel_phone?: string | null
          hotel_email?: string | null
          hotel_gst_number?: string | null
          hotel_website?: string | null
          currency?: string
          exchange_rate?: number | null
          subtotal?: number
          total_tax?: number
          total_discount?: number
          total_amount?: number
          paid_amount?: number
          balance_amount?: number
          status?: string
          payment_status?: string
          notes?: string | null
          terms_and_conditions?: string | null
          booking_id?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          }
        ]
      }
      invoice_line_items: {
        Row: {
          id: string
          invoice_id: string
          item_type: string
          description: string
          quantity: number
          unit_price: number
          line_total: number
          tax_rate: number | null
          tax_amount: number | null
          tax_inclusive: boolean | null
          tax_name: string | null
          discount_rate: number | null
          discount_amount: number | null
          item_date: string | null
          sort_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          item_type?: string
          description: string
          quantity?: number
          unit_price?: number
          line_total?: number
          tax_rate?: number | null
          tax_amount?: number | null
          tax_inclusive?: boolean | null
          tax_name?: string | null
          discount_rate?: number | null
          discount_amount?: number | null
          item_date?: string | null
          sort_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          item_type?: string
          description?: string
          quantity?: number
          unit_price?: number
          line_total?: number
          tax_rate?: number | null
          tax_amount?: number | null
          tax_inclusive?: boolean | null
          tax_name?: string | null
          discount_rate?: number | null
          discount_amount?: number | null
          item_date?: string | null
          sort_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          }
        ]
      }
      invoice_payments: {
        Row: {
          id: string
          invoice_id: string
          payment_date: string
          amount: number
          payment_method: string
          reference_number: string | null
          notes: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          invoice_id: string
          payment_date?: string
          amount: number
          payment_method?: string
          reference_number?: string | null
          notes?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          invoice_id?: string
          payment_date?: string
          amount?: number
          payment_method?: string
          reference_number?: string | null
          notes?: string | null
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      get_current_user_profile: {
        Args: Record<string, never>
        Returns: {
          id: string
          email: string
          full_name: string
          role: string
          is_active: boolean
        }[]
      }
      has_permission: {
        Args: {
          required_role: string
        }
        Returns: boolean
      }
    }
    Enums: {
      room_type: 'double-bed-deluxe' | 'vip' | 'executive-3bed'
      room_status: 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'blocked'
      id_type: 'aadhaar' | 'pan' | 'passport' | 'driving_license' | 'voter_id'
      payment_status: 'pending' | 'partial' | 'paid' | 'refunded'
      booking_status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show'
      payment_method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'cheque'
      user_role: 'admin' | 'manager' | 'staff' | 'receptionist'
      maintenance_type: 'cleaning' | 'repair' | 'upgrade' | 'inspection'
      maintenance_status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
      notification_type: 'info' | 'success' | 'warning' | 'error'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 