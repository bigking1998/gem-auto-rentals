import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import PageLoader from './components/ui/PageLoader';

// Eager load the home page for fast initial load
import HomePage from './pages/HomePage';

// Lazy load other pages for code splitting
const VehiclesPage = lazy(() => import('./pages/VehiclesPage'));
const VehicleDetailPage = lazy(() => import('./pages/VehicleDetailPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const BookingConfirmationPage = lazy(() => import('./pages/BookingConfirmationPage'));

// Auth pages - lazy loaded
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));

// Dashboard pages - lazy loaded
const DashboardLayout = lazy(() => import('./components/dashboard/DashboardLayout'));
const MyBookingsPage = lazy(() => import('./pages/dashboard/MyBookingsPage'));
const ProfilePage = lazy(() => import('./pages/dashboard/ProfilePage'));
const DocumentsPage = lazy(() => import('./pages/dashboard/DocumentsPage'));
const PaymentMethodsPage = lazy(() => import('./pages/dashboard/PaymentMethodsPage'));

function App() {
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
          <Route path="/booking/:vehicleId" element={<BookingPage />} />
          <Route path="/booking/confirmation" element={<BookingConfirmationPage />} />

          {/* Auth Routes */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

          {/* Customer Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard/bookings" replace />} />
            <Route path="bookings" element={<MyBookingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="payments" element={<PaymentMethodsPage />} />
          </Route>
        </Routes>
      </Suspense>
      <Toaster position="top-right" richColors />
    </>
  );
}

export default App;
