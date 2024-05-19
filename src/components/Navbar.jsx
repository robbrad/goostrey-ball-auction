import { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import { useNavigate, useLocation } from "react-router";
import { auth, signInWithEmailAndPassword } from "../firebase/config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ModalsContext } from "../contexts/ModalsProvider";
import { ModalTypes } from "../utils/modalTypes";

const Navbar = ({ admin }) => {
  const openModal = useContext(ModalsContext).openModal;
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authButtonText, setAuthButtonText] = useState("Sign up");
  const [adminButtonText, setAdminButtonText] = useState("Admin");
  const [loginError, setLoginError] = useState("");
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.displayName != null) {
        setUser(user);
        setAuthButtonText("Sign out");
      } else {
        setUser(null);
        setAuthButtonText("Sign up");
      }
    });

    // Clean up the onAuthStateChanged listener when the component unmounts
    return () => unsubscribe();
  }, []);

  const handleAdmin = () => {
    if (location.pathname.includes("admin")) {
      navigate(import.meta.env.BASE_URL);
      setAdminButtonText("Admin");
    } else {
      navigate(import.meta.env.BASE_URL + "admin");
      setAdminButtonText("Home");
    }
  };

  const handleAuth = () => {
    if (user) {
      signOut(auth)
        .then(() => {
          setUser(null);
          setAuthButtonText("Sign up");
        })
        .catch((error) => {
          console.error('Error signing out:', error);
        });
    } else {
      openModal(ModalTypes.SIGN_UP);
    }
  };

  const handleLogin = () => {
    // Open login modal, and handle login logic inside the modal component
    openModal(ModalTypes.LOGIN);
  };

  const handleForgotPassword = () => {
    openModal(ModalTypes.FORGOT_PASSWORD);
  };

  return (
    <nav className="navbar navbar-dark bg-primary">
      <div className="container-fluid">
        <div className="navbar-brand mb-0 h1 me-auto">
          <img
            src={import.meta.env.BASE_URL + "logo.png"}
            alt="Logo"
            width="30"
            height="24"
            className="d-inline-block align-text-top"
          />
          The Markatplace
        </div>
        <div className="row row-cols-auto">
          <div className="navbar-brand">{user ? `Hi ${user.displayName}` : ""}</div>
          {admin && (
            <button onClick={handleAdmin} className="btn btn-secondary me-2">{adminButtonText}</button>
          )}
          {user ? (
            <button onClick={handleAuth} className="btn btn-secondary me-2">{authButtonText}</button>
          ) : (
            <>
              <button onClick={handleLogin} className="btn btn-secondary me-2">Login</button>
              <button onClick={handleAuth} className="btn btn-secondary me-2">{authButtonText}</button>
              <button onClick={handleForgotPassword} className="btn btn-secondary me-2">Forgot Password</button>
            </>
          )}
        </div>
      </div>
      {loginError && <div className="alert alert-danger">{loginError}</div>}
    </nav>
  );
};

Navbar.propTypes = {
  admin: PropTypes.bool,
};

export default Navbar;
