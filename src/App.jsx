import { lazy, Suspense } from "react";
import PropTypes from "prop-types";
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { AuthProvider, useAuth } from "./contexts/AuthProvider";
import { ItemsProvider } from "./contexts/ItemsProvider";
import { NotificationsProvider } from "./contexts/NotificationsProvider";
import { ModalsProvider } from "./contexts/ModalsProvider";
import Navbar from "./components/Navbar";
import { SignUpModal, LoginModal, ForgotPasswordModal } from "./components/Modal";
import HomePage from "./pages/Home";
import AdminPage from "./pages/Admin";
import Footer from "./components/Footer";
import ToastNotification from "./components/ToastNotification";

const MyBidsPage = lazy(() => import("./pages/MyBids"));
const UserManagementPage = lazy(() => import("./pages/UserManagement"));

function ProtectedRoute({ children, roles }) {
  const { user, role, admin } = useAuth();

  // If roles prop is provided, check if user's role is in the allowed roles
  if (roles) {
    // Use `role` from context (set by task 5.1), fall back to legacy `admin` boolean
    const effectiveRole = role || (admin ? "admin" : "");
    return roles.includes(effectiveRole)
      ? children
      : <Navigate to={import.meta.env.BASE_URL} />;
  }

  // If no roles prop, just check that the user is authenticated
  return user ? children : <Navigate to={import.meta.env.BASE_URL} />;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node,
  roles: PropTypes.arrayOf(PropTypes.string),
};

const Providers = ({ children }) => {
  const demo = false;
  return (
    <AuthProvider>
      <ItemsProvider demo={demo}>
        <NotificationsProvider>
          <ModalsProvider>{children}</ModalsProvider>
        </NotificationsProvider>
      </ItemsProvider>
    </AuthProvider>
  );
};

Providers.propTypes = {
  children: PropTypes.node,
};

function App() {
  return (
    <Providers>
      <Router>
        <Navbar />
        <LoginModal />
        <SignUpModal />
        <ForgotPasswordModal />
        <Routes>
          <Route path={import.meta.env.BASE_URL} Component={HomePage} />
          <Route
            exact
            path={import.meta.env.BASE_URL + "admin"}
            element={
              <ProtectedRoute roles={["admin", "editor"]}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={import.meta.env.BASE_URL + "users"}
            element={
              <ProtectedRoute roles={["admin"]}>
                <Suspense fallback={<div className="container mt-4">Loading...</div>}>
                  <UserManagementPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path={import.meta.env.BASE_URL + "my-bids"}
            element={
              <ProtectedRoute>
                <Suspense fallback={<div className="container mt-4">Loading...</div>}>
                  <MyBidsPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
      <ToastNotification />
      <Footer />
    </Providers>
  );
}

export default App;
