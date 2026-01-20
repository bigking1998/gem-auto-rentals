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
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

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
DROP POLICY IF EXISTS "Vehicles are publicly viewable" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can insert vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can update vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can delete vehicles" ON public.vehicles;

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
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own pending bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update any booking" ON public.bookings;

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
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;

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
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can upload own documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can update documents" ON public.documents;

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
DROP POLICY IF EXISTS "Reviews are publicly viewable" ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;

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
DROP POLICY IF EXISTS "Admins can manage maintenance" ON public.maintenance_records;

-- Admins only for maintenance records
CREATE POLICY "Admins can manage maintenance" ON public.maintenance_records
  FOR ALL USING (is_admin_or_manager());
