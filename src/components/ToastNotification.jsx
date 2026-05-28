import { useContext, useEffect, useRef } from "react";
import { NotificationsContext } from "../contexts/NotificationsProvider";

const ToastNotification = () => {
  const { notifications, dismiss } = useContext(NotificationsContext);
  const timersRef = useRef({});

  useEffect(() => {
    notifications.forEach((notification) => {
      if (!timersRef.current[notification.id]) {
        timersRef.current[notification.id] = setTimeout(() => {
          dismiss(notification.id);
          delete timersRef.current[notification.id];
        }, 5000);
      }
    });

    return () => {
      Object.keys(timersRef.current).forEach((id) => {
        const stillExists = notifications.some((n) => n.id === id);
        if (!stillExists) {
          clearTimeout(timersRef.current[id]);
          delete timersRef.current[id];
        }
      });
    };
  }, [notifications, dismiss]);

  if (notifications.length === 0) return null;

  return (
    <div
      className="toast-container position-fixed top-0 end-0 p-3"
      style={{ zIndex: 1080 }}
    >
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="toast show"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="toast-header">
            <strong className="me-auto">Outbid</strong>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() => dismiss(notification.id)}
            />
          </div>
          <div className="toast-body">
            You&apos;ve been outbid on {notification.itemTitle}
            <br />
            New highest bid: {notification.currency}
            {notification.newHighestBid}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastNotification;
