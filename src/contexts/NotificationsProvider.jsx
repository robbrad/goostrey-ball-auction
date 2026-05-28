import { createContext, useContext, useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { ItemsContext } from "./ItemsProvider";
import { useAuth } from "./AuthProvider";
import { detectOutbids } from "../utils/outbidDetection";

export const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const { items, previousItems } = useContext(ItemsContext);
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user || !previousItems || previousItems.length === 0) return;

    const newNotifications = detectOutbids(previousItems, items, user.uid);
    if (newNotifications.length > 0) {
      setNotifications((prev) => [...prev, ...newNotifications]);
    }
  }, [items, previousItems, user]);

  const dismiss = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationsContext.Provider value={{ notifications, dismiss }}>
      {children}
    </NotificationsContext.Provider>
  );
};

NotificationsProvider.propTypes = {
  children: PropTypes.node,
};
