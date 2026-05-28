import { useEffect, useState, createContext, useContext } from "react";
import PropTypes from "prop-types";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { resolveRole } from "../utils/roleResolution";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.displayName) {
        console.debug(`Signed-in: name=${firebaseUser.displayName}, uid=${firebaseUser.uid}`);
        setUser(firebaseUser);

        // Resolve user role from Firestore document
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(userDocRef);
          const userDoc = docSnap.exists() ? docSnap.data() : {};
          const resolvedRole = resolveRole(userDoc);
          console.debug(`User role resolved: ${resolvedRole}`);
          setRole(resolvedRole);
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole("");
        }
      } else {
        setUser(null);
        setRole("");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign-out error:", error);
      alert("Sign-out was unsuccessful");
    }
  };

  // Backward-compatible admin getter: true for admin or editor roles (grants access to admin page)
  const admin = role === "admin" || role === "editor";

  return (
    <AuthContext.Provider value={{ user, role, admin, loading, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
