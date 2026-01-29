import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from './stores/authStore';

// Eager load - needed immediately for auth flow
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';

// Lazy load all dashboard pages for code splitting
const DashboardHome = lazy(() => import('./pages/DashboardHome'));
const FleetManagement = lazy(() => import('./pages/FleetManagement'));
const AddVehiclePage = lazy(() => import('./pages/AddVehiclePage'));
const EditVehiclePage = lazy(() => import('./pages/EditVehiclePage'));
const BookingsPage = lazy(() => import('./pages/BookingsPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const CustomerProfilePage = lazy(() => import('./pages/CustomerProfilePage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const SecurityPage = lazy(() => import('./pages/SecurityPage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const TrashPage = lazy(() => import('./pages/TrashPage'));

// Page loader component for Suspense fallback
function PageLoader() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isInitialized } = useAuthStore();
  const location = useLocation();

  // Show loading spinner while checking auth state
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

// Public Route Component (redirects to dashboard if already authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isInitialized } = useAuthStore();

  // Show loading spinner while checking auth state
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { initialize, isInitialized } = useAuthStore();

  // Initialize auth on app load
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  return (
    <>
      <Routes>
        {/* Public Route - Login */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes - Dashboard */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Wrap lazy-loaded routes in Suspense */}
          <Route index element={<Suspense fallback={<PageLoader />}><DashboardHome /></Suspense>} />
          <Route path="fleet" element={<Suspense fallback={<PageLoader />}><FleetManagement /></Suspense>} />
          <Route path="fleet/new" element={<Suspense fallback={<PageLoader />}><AddVehiclePage /></Suspense>} />
          <Route path="fleet/:id" element={<Suspense fallback={<PageLoader />}><EditVehiclePage /></Suspense>} />
          <Route path="bookings" element={<Suspense fallback={<PageLoader />}><BookingsPage /></Suspense>} />
          <Route path="customers" element={<Suspense fallback={<PageLoader />}><CustomersPage /></Suspense>} />
          <Route path="customers/:id" element={<Suspense fallback={<PageLoader />}><CustomerProfilePage /></Suspense>} />
          <Route path="analytics" element={<Suspense fallback={<PageLoader />}><AnalyticsPage /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
          <Route path="messages" element={<Suspense fallback={<PageLoader />}><MessagesPage /></Suspense>} />
          <Route path="security" element={<Suspense fallback={<PageLoader />}><SecurityPage /></Suspense>} />
          <Route path="trash" element={<Suspense fallback={<PageLoader />}><TrashPage /></Suspense>} />
          <Route path="help" element={<Suspense fallback={<PageLoader />}><HelpPage /></Suspense>} />
        </Route>

        {/* Catch all - redirect to dashboard or login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" richColors />
    </>
  );
}

export default App;
