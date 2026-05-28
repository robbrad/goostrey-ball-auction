import { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router";
import { ModalsContext } from "../contexts/ModalsProvider";
import { useAuth } from "../contexts/AuthProvider";
import { extractFirstName } from "../utils/formatString";
import { ModalTypes } from "../utils/modalTypes";

const Navbar = () => {
  const openModal = useContext(ModalsContext).openModal;
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, admin, signOutUser } = useAuth();

  // Determine effective role: use `role` from context, fall back to legacy `admin` boolean
  const effectiveRole = role || (admin ? "admin" : "");
  const hasAdminAccess = effectiveRole === "admin" || effectiveRole === "editor";

  const [adminButtonText, setAdminButtonText] = useState("Admin");

  const handleAdmin = () => {
    if (location.pathname.includes("admin")) {
      navigate(import.meta.env.BASE_URL);
      setAdminButtonText("Admin");
    } else {
      navigate(import.meta.env.BASE_URL + "admin");
      setAdminButtonText("Home");
    }
  };

  const handleMyBids = () => {
    navigate(import.meta.env.BASE_URL + "my-bids");
  };

  const handleSignOut = () => {
    signOutUser();
  };

  const handleLogin = () => {
    openModal(ModalTypes.LOGIN);
  };

  const handleSignUp = () => {
    openModal(ModalTypes.SIGN_UP);
  };

  const handleForgotPassword = () => {
    openModal(ModalTypes.FORGOT_PASSWORD);
  };

  return (
    <nav className="navbar navbar-dark bg-primary">
      <div className="container-fluid">
        <div className="navbar-brand mb-0 h1 me-auto">
          <img
            src={import.meta.env.BASE_URL + "logo.jpeg"}
            alt="Logo"
            width="30"
            height="24"
            className="d-inline-block align-text-top"
          />
          Goostrey PTA Ball Auction
        </div>
        <div className="row row-cols-auto">
          <div className="navbar-brand">
            {user ? `Hi ${extractFirstName(user.displayName)}` : ""}
          </div>
          {hasAdminAccess && (
            <button onClick={handleAdmin} className="btn btn-secondary me-2">
              {adminButtonText}
            </button>
          )}
          {user && (
            <button onClick={handleMyBids} className="btn btn-secondary me-2">
              My Bids
            </button>
          )}
          {user ? (
            <button onClick={handleSignOut} className="btn btn-secondary me-2">
              Sign out
            </button>
          ) : (
            <>
              <button onClick={handleLogin} className="btn btn-secondary me-2">
                Login
              </button>
              <button onClick={handleSignUp} className="btn btn-secondary me-2">
                Sign up
              </button>
              <button onClick={handleForgotPassword} className="btn btn-secondary me-2">
                Forgot Password
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
