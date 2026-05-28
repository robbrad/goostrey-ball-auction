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
import { ModalsProvider } from "./contexts/ModalsProvider";
import Navbar from "./components/Navbar";
import { SignUpModal, LoginModal, ForgotPasswordModal } from "./components/Modal";
import HomePage from "./pages/Home";
import AdminPage from "./pages/Admin";
import Footer from "./components/Footer";

function ProtectedRoute({ children }) {
  const { admin } = useAuth();
  return admin ? children : <Navigate to={import.meta.env.BASE_URL} />;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node,
};

const Providers = ({ children }) => {
  const demo = false;
  return (
    <AuthProvider>
      <ItemsProvider demo={demo}>
        <ModalsProvider>{children}</ModalsProvider>
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
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
      <Footer />
    </Providers>
  );
}

export default App;
