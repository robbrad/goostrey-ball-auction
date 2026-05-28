import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthProvider";
import { sortUsers, filterUsers, roleDisplayLabel, formatUserCount } from "../utils/userManagement";

export default function UserManagementPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusMessage, setStatusMessage] = useState(null);
  const [updatingUid, setUpdatingUid] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const userDocs = querySnapshot.docs.map((docSnap) => ({
        uid: docSnap.id,
        ...docSnap.data(),
      }));
      setUsers(userDocs);
    } catch (err) {
      setError("Could not load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (targetUid, newRole, previousRole) => {
    setUpdatingUid(targetUid);
    setStatusMessage(null);
    try {
      const userDocRef = doc(db, "users", targetUid);
      await updateDoc(userDocRef, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.uid === targetUid ? { ...u, role: newRole } : u))
      );
      setStatusMessage({ text: `Role updated successfully.`, type: "success" });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err) {
      // Revert the selector by restoring previous role in state
      setUsers((prev) =>
        prev.map((u) => (u.uid === targetUid ? { ...u, role: previousRole } : u))
      );
      setStatusMessage({ text: "Failed to update role. Please try again.", type: "danger" });
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setUpdatingUid(null);
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <button className="btn btn-primary" onClick={fetchUsers}>
          Retry
        </button>
      </div>
    );
  }

  const filtered = filterUsers(sortUsers(users), searchText);

  return (
    <div className="container mt-4">
      <h1>User Management</h1>

      {statusMessage && (
        <div className={`alert alert-${statusMessage.type}`} role="alert">
          {statusMessage.text}
        </div>
      )}

      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <>
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Search users..."
              aria-label="Search users"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <p>{formatUserCount(filtered.length, users.length)}</p>

          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isCurrentUser = user && u.uid === user.uid;
                const isUpdating = updatingUid === u.uid;
                return (
                  <tr key={u.uid}>
                    <td>{u.surname}, {u.firstName}</td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        className="form-select"
                        value={u.role || ""}
                        disabled={isCurrentUser || isUpdating}
                        aria-disabled={isCurrentUser ? "true" : undefined}
                        aria-label={`Role for ${u.firstName} ${u.surname}`}
                        onChange={(e) =>
                          handleRoleChange(u.uid, e.target.value, u.role || "")
                        }
                      >
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="">User</option>
                      </select>
                      {isCurrentUser && (
                        <small className="text-muted">You cannot change your own role</small>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
