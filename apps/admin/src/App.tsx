import { lazy, Suspense, useEffect, Component, ReactNode } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useAuthStore } from './stores/authStore';

// Eager load - needed immediately for auth flow
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';

// Error boundary for lazy-loaded components
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class LazyLoadErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-amber-500" />
            <h2 className="mb-2 text-lg font-semibold text-gray-900">Failed to load page</h2>
            <p className="mb-4 text-sm text-gray-500">
              There was a problem loading this page. Please try again.
            </p>
            <button
              onClick={this.handleRetry}
              className="bg-primary text-primary-foreground hover:bg-primary-dark rounded-lg px-4 py-2 font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <Loader2 className="text-primary-ink mx-auto mb-2 h-8 w-8 animate-spin" />
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="text-primary-ink mx-auto mb-4 h-10 w-10 animate-spin" />
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="text-primary-ink mx-auto mb-4 h-10 w-10 animate-spin" />
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
          {/* Wrap lazy-loaded routes in Suspense with Error Boundary */}
          <Route
            index
            element={
              <LazyLoadErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <DashboardHome />
                </Suspense>
              </LazyLoadErrorBoundary>
            }
          />
          <Route
            path="fleet"
            element={
              <LazyLoadErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <FleetManagement />
                </Suspense>
              </LazyLoadErrorBoundary>
            }
          />
          <Route
            path="fleet/new"
            element={
              <LazyLoadErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <AddVehiclePage />
                </Suspense>
              </LazyLoadErrorBoundary>
            }
          />
          <Route
            path="fleet/:id"
            element={
              <LazyLoadErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <EditVehiclePage />
                </Suspense>
              </LazyLoadErrorBoundary>
            }
          />
          <Route
            path="bookings"
            element={
              <LazyLoadErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <BookingsPage />
                </Suspense>
              </LazyLoadErrorBoundary>
            }
          />
          <Route
            path="customers"
            element={
              <LazyLoadErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <CustomersPage />
                </Suspense>
              </LazyLoadErrorBoundary>
            }
          />
          <Route
            path="customers/:id"
            element={
              <LazyLoadErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <CustomerProfilePage />
                </Suspense>
              </LazyLoadErrorBoundary>
            }
          />
          <Route
            path="analytics"
            element={
              <LazyLoadErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <AnalyticsPage />
                </Suspense>
              </LazyLoadErrorBoundary>
            }
          />
          <Route
            path="settings"
            element={
              <LazyLoadErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <SettingsPage />
                </Suspense>
              </LazyLoadErrorBoundary>
            }
          />
          <Route
            path="messages"
            element={
              <LazyLoadErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <MessagesPage />
                </Suspense>
              </LazyLoadErrorBoundary>
            }
          />
          <Route
            path="security"
            element={
              <LazyLoadErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <SecurityPage />
                </Suspense>
              </LazyLoadErrorBoundary>
            }
          />
          <Route
            path="trash"
            element={
              <LazyLoadErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <TrashPage />
                </Suspense>
              </LazyLoadErrorBoundary>
            }
          />
          <Route
            path="help"
            element={
              <LazyLoadErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <HelpPage />
                </Suspense>
              </LazyLoadErrorBoundary>
            }
          />
        </Route>

        {/* Catch all - redirect to dashboard or login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" richColors />
    </>
  );
}

export default App;
