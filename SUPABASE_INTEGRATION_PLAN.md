# Full Supabase Integration Plan - Gem Auto Rentals

## Overview

Convert both frontend apps from mock/prototype mode to **Full Supabase** integration:

- **Supabase Auth** for authentication (login, register, sessions)
- **Direct database queries** from frontend via `@supabase/supabase-js`
- **Row Level Security (RLS)** for data protection
- **No Express backend needed** - all logic in frontend + RLS policies

---

## Implementation Status (Updated Jan 2026)

### Code Integration - COMPLETED

| Component | Status | Notes |
|-----------|--------|-------|
| Supabase client (web) | ✅ Done | `apps/web/src/lib/supabase.ts` |
| Supabase client (admin) | ✅ Done | `apps/admin/src/lib/supabase.ts` |
| Admin auth store | ✅ Done | `apps/admin/src/stores/authStore.ts` |
| Admin login page | ✅ Done | `apps/admin/src/pages/LoginPage.tsx` |
| Admin route protection | ✅ Done | `apps/admin/src/App.tsx` |
| Customer auth store | ✅ Done | `apps/web/src/stores/authStore.ts` |
| VehiclesPage queries | ✅ Done | With mock fallback |
| FeaturedVehicles queries | ✅ Done | With mock fallback |
| ProfilePage queries | ✅ Done | With mock fallback |
| DashboardHome queries | ✅ Done | Admin dashboard stats |
| FleetManagement CRUD | ✅ Done | Full CRUD operations |
| CustomersPage queries | ✅ Done | Customer list |
| CustomerProfilePage queries | ✅ Done | Customer details |

### Database Setup - REQUIRED MANUAL STEPS

**You must complete these steps in the Supabase Dashboard:**

1. **Create Tables** - Run SQL in Phase 2 below
2. **Enable RLS Policies** - Run SQL in Phase 3 below
3. **Seed Sample Data** - Run SQL in Phase 4 below
4. **Create Admin User** - See "Test Credentials" section

---

## Current State Analysis

### What Exists

| Component | Status | Notes |
|-----------|--------|-------|
| Supabase Project | Configured | URL: `szvnxiozrxmsudtcsddx.supabase.co` |
| Environment Variables | Partial | Only in `apps/web/.env` |
| `@supabase/supabase-js` | Not Installed | Needs to be added to both apps |
| Database Tables | Not Created | Need to match Prisma schema |
| RLS Policies | Not Created | Need security rules |
| Auth Integration | None | Using mock auth |
| Data Fetching | Mock Data | All pages use hardcoded arrays |

### Apps Architecture

```
gem-auto-rentals/
├── apps/
│   ├── web/          # Customer-facing site (localhost:5173)
│   │   └── src/
│   │       ├── lib/api.ts        # Unused API client
│   │       ├── stores/authStore.ts  # Needs Supabase integration
│   │       └── pages/            # All use mock data
│   │
│   └── admin/        # Admin dashboard (localhost:5174)
│       └── src/
│           ├── lib/              # No API client exists
│           ├── stores/           # No auth store exists
│           └── pages/            # All use mock data
│
└── supabase/
    └── config.toml   # Local dev configuration
```

---

## Phase 1: Install & Configure Supabase Client

### 1.1 Install Package in Both Apps

```bash
# Customer site
cd apps/web && pnpm add @supabase/supabase-js

# Admin dashboard
cd apps/admin && pnpm add @supabase/supabase-js
```

### 1.2 Create Supabase Client - Customer Site

**File:** `apps/web/src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

### 1.3 Create Supabase Client - Admin Dashboard

**File:** `apps/admin/src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

### 1.4 Add Environment Variables to Admin App

**File:** `apps/admin/.env`

```env
VITE_SUPABASE_URL="https://szvnxiozrxmsudtcsddx.supabase.co"
VITE_SUPABASE_ANON_KEY="sb_publishable_BvNRkwTYJoUfjgcRflV00g_yCkiZg76"
```

---

## Phase 2: Database Schema Setup

### 2.1 Complete SQL Schema

Run this in **Supabase SQL Editor**:

```sql
-- =============================================
-- USERS TABLE (extends Supabase Auth)
-- =============================================
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'SUPPORT', 'MANAGER', 'ADMIN')),
  email_verified BOOLEAN DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- VEHICLES TABLE
-- =============================================
CREATE TABLE public.vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2100),
  category TEXT NOT NULL CHECK (category IN ('ECONOMY', 'STANDARD', 'PREMIUM', 'LUXURY', 'SUV', 'VAN')),
  daily_rate DECIMAL(10,2) NOT NULL CHECK (daily_rate > 0),
  status TEXT DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RENTED', 'MAINTENANCE', 'RETIRED')),
  images TEXT[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  description TEXT,
  seats INTEGER NOT NULL CHECK (seats > 0),
  doors INTEGER DEFAULT 4 CHECK (doors > 0),
  transmission TEXT NOT NULL CHECK (transmission IN ('AUTOMATIC', 'MANUAL')),
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID')),
  mileage INTEGER NOT NULL DEFAULT 0 CHECK (mileage >= 0),
  color TEXT,
  license_plate TEXT UNIQUE NOT NULL,
  vin TEXT UNIQUE NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BOOKINGS TABLE
-- =============================================
CREATE TABLE public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE RESTRICT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  daily_rate DECIMAL(10,2) NOT NULL CHECK (daily_rate > 0),
  extras JSONB DEFAULT '{}',
  pickup_location TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  notes TEXT,
  contract_signed BOOLEAN DEFAULT false,
  contract_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- =============================================
-- PAYMENTS TABLE
-- =============================================
CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED')),
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  method TEXT CHECK (method IN ('CARD', 'BANK_TRANSFER')),
  refund_amount DECIMAL(10,2) CHECK (refund_amount >= 0),
  refund_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DOCUMENTS TABLE
-- =============================================
CREATE TABLE public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('DRIVERS_LICENSE', 'ID_CARD', 'PASSPORT', 'PROOF_OF_ADDRESS', 'INSURANCE')),
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- REVIEWS TABLE
-- =============================================
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, vehicle_id)
);

-- =============================================
-- MAINTENANCE RECORDS TABLE
-- =============================================
CREATE TABLE public.maintenance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  cost DECIMAL(10,2) CHECK (cost >= 0),
  performed_at TIMESTAMPTZ NOT NULL,
  next_due_at TIMESTAMPTZ,
  mileage_at INTEGER CHECK (mileage_at >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_vehicles_status ON public.vehicles(status);
CREATE INDEX idx_vehicles_category ON public.vehicles(category);
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_vehicle_id ON public.bookings(vehicle_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_dates ON public.bookings(start_date, end_date);
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_reviews_vehicle_id ON public.reviews(vehicle_id);
CREATE INDEX idx_maintenance_vehicle_id ON public.maintenance_records(vehicle_id);

-- =============================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_updated_at BEFORE UPDATE ON public.maintenance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Phase 3: Row Level Security (RLS) Policies

```sql
-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTION: Check if user is admin/manager
-- =============================================
CREATE OR REPLACE FUNCTION is_admin_or_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('ADMIN', 'MANAGER')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- USERS POLICIES
-- =============================================
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (is_admin_or_manager());

-- Admins can update all users
CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (is_admin_or_manager());

-- =============================================
-- VEHICLES POLICIES
-- =============================================
-- Anyone can view vehicles (public catalog)
CREATE POLICY "Vehicles are publicly viewable" ON public.vehicles
  FOR SELECT USING (true);

-- Only admins can insert vehicles
CREATE POLICY "Admins can insert vehicles" ON public.vehicles
  FOR INSERT WITH CHECK (is_admin_or_manager());

-- Only admins can update vehicles
CREATE POLICY "Admins can update vehicles" ON public.vehicles
  FOR UPDATE USING (is_admin_or_manager());

-- Only admins can delete vehicles
CREATE POLICY "Admins can delete vehicles" ON public.vehicles
  FOR DELETE USING (is_admin_or_manager());

-- =============================================
-- BOOKINGS POLICIES
-- =============================================
-- Users can view their own bookings
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT USING (is_admin_or_manager());

-- Authenticated users can create bookings
CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their pending bookings (cancel)
CREATE POLICY "Users can update own pending bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id AND status = 'PENDING');

-- Admins can update any booking
CREATE POLICY "Admins can update any booking" ON public.bookings
  FOR UPDATE USING (is_admin_or_manager());

-- =============================================
-- PAYMENTS POLICIES
-- =============================================
-- Users can view payments for their bookings
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = payments.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

-- Admins can view all payments
CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT USING (is_admin_or_manager());

-- Admins can manage payments
CREATE POLICY "Admins can manage payments" ON public.payments
  FOR ALL USING (is_admin_or_manager());

-- =============================================
-- DOCUMENTS POLICIES
-- =============================================
-- Users can view their own documents
CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

-- Users can upload their own documents
CREATE POLICY "Users can upload own documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all documents
CREATE POLICY "Admins can view all documents" ON public.documents
  FOR SELECT USING (is_admin_or_manager());

-- Admins can verify documents
CREATE POLICY "Admins can update documents" ON public.documents
  FOR UPDATE USING (is_admin_or_manager());

-- =============================================
-- REVIEWS POLICIES
-- =============================================
-- Anyone can view reviews
CREATE POLICY "Reviews are publicly viewable" ON public.reviews
  FOR SELECT USING (true);

-- Users can create reviews
CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- MAINTENANCE RECORDS POLICIES
-- =============================================
-- Admins only for maintenance records
CREATE POLICY "Admins can manage maintenance" ON public.maintenance_records
  FOR ALL USING (is_admin_or_manager());
```

---

## Phase 4: Seed Data

```sql
-- =============================================
-- SEED SAMPLE VEHICLES
-- =============================================
INSERT INTO public.vehicles (make, model, year, category, daily_rate, status, images, features, seats, transmission, fuel_type, mileage, color, license_plate, vin, location) VALUES
('Toyota', 'Camry', 2024, 'STANDARD', 65.00, 'AVAILABLE',
  ARRAY['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800'],
  ARRAY['Bluetooth', 'Backup Camera', 'Apple CarPlay', 'Lane Assist'],
  5, 'AUTOMATIC', 'GASOLINE', 12500, 'Silver', 'ABC-1234', '1HGBH41JXMN109186', 'Los Angeles'),

('Honda', 'Civic', 2024, 'ECONOMY', 55.00, 'AVAILABLE',
  ARRAY['https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=800'],
  ARRAY['Bluetooth', 'Fuel Efficient', 'USB Ports'],
  5, 'AUTOMATIC', 'GASOLINE', 8200, 'Blue', 'DEF-5678', '2HGFC2F59MH123456', 'Los Angeles'),

('BMW', '3 Series', 2024, 'PREMIUM', 120.00, 'AVAILABLE',
  ARRAY['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800'],
  ARRAY['Leather Seats', 'Navigation', 'Sunroof', 'Premium Sound'],
  5, 'AUTOMATIC', 'GASOLINE', 5800, 'Black', 'GHI-9012', '3MW5R1J04M8B12345', 'Beverly Hills'),

('Mercedes-Benz', 'E-Class', 2024, 'LUXURY', 175.00, 'AVAILABLE',
  ARRAY['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800'],
  ARRAY['Massage Seats', 'Ambient Lighting', 'Burmester Sound', 'Driver Assist'],
  5, 'AUTOMATIC', 'GASOLINE', 3200, 'White', 'JKL-3456', 'W1KZF8DB4MA123456', 'Beverly Hills'),

('Ford', 'Explorer', 2024, 'SUV', 95.00, 'AVAILABLE',
  ARRAY['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800'],
  ARRAY['Third Row Seating', '4WD', 'Towing Package', 'Roof Rails'],
  7, 'AUTOMATIC', 'GASOLINE', 15600, 'Red', 'MNO-7890', '1FM5K8GC2MGA12345', 'Santa Monica'),

('Tesla', 'Model 3', 2024, 'PREMIUM', 110.00, 'AVAILABLE',
  ARRAY['https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=800'],
  ARRAY['Autopilot', 'Premium Interior', 'Glass Roof', 'Supercharging'],
  5, 'AUTOMATIC', 'ELECTRIC', 9800, 'Red', 'PQR-1234', '5YJ3E1EA5MF123456', 'Hollywood'),

('Chevrolet', 'Suburban', 2024, 'VAN', 135.00, 'AVAILABLE',
  ARRAY['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800'],
  ARRAY['8 Passenger', 'Entertainment System', 'Cargo Space', 'Wi-Fi'],
  8, 'AUTOMATIC', 'GASOLINE', 22000, 'Black', 'STU-5678', '1GNSKJKC4MR123456', 'LAX Airport'),

('Porsche', '911', 2024, 'LUXURY', 350.00, 'AVAILABLE',
  ARRAY['https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800'],
  ARRAY['Sport Chrono', 'PASM', 'Sport Exhaust', 'Carbon Fiber'],
  2, 'AUTOMATIC', 'GASOLINE', 2100, 'Yellow', 'VWX-9012', 'WP0AB2A94MS123456', 'Beverly Hills');
```

---

## Phase 5: Auth Integration

### 5.1 Admin Auth Store

**File:** `apps/admin/src/stores/authStore.ts`

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'CUSTOMER' | 'SUPPORT' | 'MANAGER' | 'ADMIN'
  avatar_url?: string
}

interface AuthState {
  user: User | null
  profile: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  fetchProfile: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      initialize: async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          set({ user: session.user, isAuthenticated: true })
          await get().fetchProfile()
        }
        set({ isLoading: false })

        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            set({ user: session.user, isAuthenticated: true })
            await get().fetchProfile()
          } else {
            set({ user: null, profile: null, isAuthenticated: false })
          }
        })
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null })

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) {
          set({ isLoading: false, error: error.message })
          return false
        }

        // Fetch profile and check role
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (!profile || !['ADMIN', 'MANAGER'].includes(profile.role)) {
          await supabase.auth.signOut()
          set({
            isLoading: false,
            error: 'Access denied. Admin privileges required.'
          })
          return false
        }

        set({
          user: data.user,
          profile,
          isAuthenticated: true,
          isLoading: false
        })
        return true
      },

      logout: async () => {
        await supabase.auth.signOut()
        set({ user: null, profile: null, isAuthenticated: false })
      },

      fetchProfile: async () => {
        const { user } = get()
        if (!user) return

        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (data) {
          set({ profile: data })
        }
      }
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
```

### 5.2 Admin Login Page

**File:** `apps/admin/src/pages/LoginPage.tsx`

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Car, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading, error } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await login(email, password)
    if (success) {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl mb-4">
              <Car className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Sign in to manage your fleet</p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="admin@gemautorentals.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
```

---

## Phase 6: Data Layer Integration

### Query Patterns

**Fetch All Vehicles (Admin)**
```typescript
const { data, error } = await supabase
  .from('vehicles')
  .select('*')
  .order('created_at', { ascending: false })
```

**Fetch Available Vehicles (Customer)**
```typescript
const { data, error } = await supabase
  .from('vehicles')
  .select('*')
  .eq('status', 'AVAILABLE')
  .order('daily_rate', { ascending: true })
```

**Fetch Dashboard Stats**
```typescript
const [vehicles, bookings, customers, revenue] = await Promise.all([
  supabase.from('vehicles').select('*', { count: 'exact', head: true }),
  supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
  supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'CUSTOMER'),
  supabase.from('payments').select('amount').eq('status', 'SUCCEEDED')
])
```

**Create Booking**
```typescript
const { data, error } = await supabase
  .from('bookings')
  .insert({
    user_id: userId,
    vehicle_id: vehicleId,
    start_date: startDate,
    end_date: endDate,
    total_amount: totalAmount,
    daily_rate: dailyRate,
    pickup_location: pickupLocation,
    dropoff_location: dropoffLocation,
    extras: { insurance: true, gps: false }
  })
  .select()
  .single()
```

---

## Implementation Checklist (Ralph Loop)

### Step 1: Setup (Foundation)
- [ ] Install `@supabase/supabase-js` in both apps
- [ ] Create Supabase client files
- [ ] Add env variables to admin app
- [ ] Run database schema SQL in Supabase
- [ ] Run RLS policies SQL in Supabase
- [ ] Seed sample vehicles

### Step 2: Admin Auth
- [ ] Create admin auth store
- [ ] Create admin login page
- [ ] Add route protection to App.tsx
- [ ] Test admin login flow

### Step 3: Admin Data Pages
- [ ] Connect DashboardHome to Supabase
- [ ] Connect FleetManagement to Supabase
- [ ] Connect CustomersPage to Supabase
- [ ] Connect CustomerProfilePage to Supabase
- [ ] Connect BookingsCalendar to Supabase
- [ ] Connect PaymentsPage to Supabase

### Step 4: Customer Site Auth
- [ ] Update customer auth store for Supabase
- [ ] Wire login/register pages
- [ ] Add auth state to header

### Step 5: Customer Site Data
- [ ] Connect VehiclesPage to Supabase
- [ ] Connect VehicleDetailPage to Supabase
- [ ] Connect booking flow to Supabase

### Step 6: Testing & Verification
- [ ] Test admin login with created user
- [ ] Verify RLS policies work correctly
- [ ] Test CRUD operations on vehicles
- [ ] Test booking creation flow
- [ ] Test customer registration and login

---

## Test Credentials

Create an admin user in Supabase Auth Dashboard, then update their role:

```sql
UPDATE public.users
SET role = 'ADMIN'
WHERE email = 'admin@gemautorentals.com';
```

**Admin:** admin@gemautorentals.com / (password set in Supabase Auth)

---

## Files Summary

### New Files to Create
1. `apps/web/src/lib/supabase.ts`
2. `apps/admin/src/lib/supabase.ts`
3. `apps/admin/src/stores/authStore.ts`
4. `apps/admin/src/pages/LoginPage.tsx`
5. `apps/admin/.env`

### Files to Modify
1. `apps/admin/src/App.tsx` - Add login route, ProtectedRoute
2. `apps/admin/src/pages/DashboardHome.tsx` - Supabase queries
3. `apps/admin/src/pages/FleetManagement.tsx` - Supabase CRUD
4. `apps/admin/src/pages/CustomersPage.tsx` - Supabase queries
5. `apps/admin/src/pages/CustomerProfilePage.tsx` - Supabase queries
6. `apps/web/src/stores/authStore.ts` - Supabase Auth
7. `apps/web/src/pages/VehiclesPage.tsx` - Supabase queries
