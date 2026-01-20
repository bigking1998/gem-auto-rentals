import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for TypeScript support
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          role: 'CUSTOMER' | 'SUPPORT' | 'MANAGER' | 'ADMIN';
          email_verified: boolean;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone?: string | null;
          role?: 'CUSTOMER' | 'SUPPORT' | 'MANAGER' | 'ADMIN';
          email_verified?: boolean;
          avatar_url?: string | null;
        };
        Update: {
          email?: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          role?: 'CUSTOMER' | 'SUPPORT' | 'MANAGER' | 'ADMIN';
          email_verified?: boolean;
          avatar_url?: string | null;
        };
      };
      vehicles: {
        Row: {
          id: string;
          make: string;
          model: string;
          year: number;
          category: 'ECONOMY' | 'STANDARD' | 'PREMIUM' | 'LUXURY' | 'SUV' | 'VAN';
          daily_rate: number;
          status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'RETIRED';
          images: string[];
          features: string[];
          description: string | null;
          seats: number;
          doors: number;
          transmission: 'AUTOMATIC' | 'MANUAL';
          fuel_type: 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
          mileage: number;
          color: string | null;
          license_plate: string;
          vin: string;
          location: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          make: string;
          model: string;
          year: number;
          category: 'ECONOMY' | 'STANDARD' | 'PREMIUM' | 'LUXURY' | 'SUV' | 'VAN';
          daily_rate: number;
          status?: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'RETIRED';
          images?: string[];
          features?: string[];
          description?: string | null;
          seats: number;
          doors?: number;
          transmission: 'AUTOMATIC' | 'MANUAL';
          fuel_type: 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
          mileage?: number;
          color?: string | null;
          license_plate: string;
          vin: string;
          location?: string | null;
        };
        Update: {
          make?: string;
          model?: string;
          year?: number;
          category?: 'ECONOMY' | 'STANDARD' | 'PREMIUM' | 'LUXURY' | 'SUV' | 'VAN';
          daily_rate?: number;
          status?: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'RETIRED';
          images?: string[];
          features?: string[];
          description?: string | null;
          seats?: number;
          doors?: number;
          transmission?: 'AUTOMATIC' | 'MANUAL';
          fuel_type?: 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
          mileage?: number;
          color?: string | null;
          license_plate?: string;
          vin?: string;
          location?: string | null;
        };
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          vehicle_id: string;
          start_date: string;
          end_date: string;
          status: 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
          total_amount: number;
          daily_rate: number;
          extras: Record<string, unknown>;
          pickup_location: string;
          dropoff_location: string;
          notes: string | null;
          contract_signed: boolean;
          contract_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vehicle_id: string;
          start_date: string;
          end_date: string;
          status?: 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
          total_amount: number;
          daily_rate: number;
          extras?: Record<string, unknown>;
          pickup_location: string;
          dropoff_location: string;
          notes?: string | null;
          contract_signed?: boolean;
          contract_url?: string | null;
        };
        Update: {
          user_id?: string;
          vehicle_id?: string;
          start_date?: string;
          end_date?: string;
          status?: 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
          total_amount?: number;
          daily_rate?: number;
          extras?: Record<string, unknown>;
          pickup_location?: string;
          dropoff_location?: string;
          notes?: string | null;
          contract_signed?: boolean;
          contract_url?: string | null;
        };
      };
      payments: {
        Row: {
          id: string;
          booking_id: string;
          amount: number;
          status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
          stripe_payment_intent_id: string | null;
          stripe_charge_id: string | null;
          method: 'CARD' | 'BANK_TRANSFER' | null;
          refund_amount: number | null;
          refund_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          amount: number;
          status?: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
          stripe_payment_intent_id?: string | null;
          stripe_charge_id?: string | null;
          method?: 'CARD' | 'BANK_TRANSFER' | null;
          refund_amount?: number | null;
          refund_reason?: string | null;
        };
        Update: {
          booking_id?: string;
          amount?: number;
          status?: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
          stripe_payment_intent_id?: string | null;
          stripe_charge_id?: string | null;
          method?: 'CARD' | 'BANK_TRANSFER' | null;
          refund_amount?: number | null;
          refund_reason?: string | null;
        };
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          type: 'DRIVERS_LICENSE' | 'ID_CARD' | 'PASSPORT' | 'PROOF_OF_ADDRESS' | 'INSURANCE';
          url: string;
          filename: string;
          verified: boolean;
          verified_at: string | null;
          verified_by: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'DRIVERS_LICENSE' | 'ID_CARD' | 'PASSPORT' | 'PROOF_OF_ADDRESS' | 'INSURANCE';
          url: string;
          filename: string;
          verified?: boolean;
          verified_at?: string | null;
          verified_by?: string | null;
          expires_at?: string | null;
        };
        Update: {
          user_id?: string;
          type?: 'DRIVERS_LICENSE' | 'ID_CARD' | 'PASSPORT' | 'PROOF_OF_ADDRESS' | 'INSURANCE';
          url?: string;
          filename?: string;
          verified?: boolean;
          verified_at?: string | null;
          verified_by?: string | null;
          expires_at?: string | null;
        };
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          vehicle_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vehicle_id: string;
          rating: number;
          comment?: string | null;
        };
        Update: {
          user_id?: string;
          vehicle_id?: string;
          rating?: number;
          comment?: string | null;
        };
      };
      maintenance_records: {
        Row: {
          id: string;
          vehicle_id: string;
          type: string;
          description: string | null;
          cost: number | null;
          performed_at: string;
          next_due_at: string | null;
          mileage_at: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          type: string;
          description?: string | null;
          cost?: number | null;
          performed_at: string;
          next_due_at?: string | null;
          mileage_at?: number | null;
        };
        Update: {
          vehicle_id?: string;
          type?: string;
          description?: string | null;
          cost?: number | null;
          performed_at?: string;
          next_due_at?: string | null;
          mileage_at?: number | null;
        };
      };
    };
  };
}
