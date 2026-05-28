import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthProvider";
import { sortUsers, filterUsers, formatUserCount } from "../utils/userManagement";

/**
 * Formats a Firestore Timestamp or date value to a readable string.
 * Returns "—" if no timestamp is available.
 */
function formatRegistered(timestamp) {
  if (!timestamp) return "—";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function UserManagementPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusMessage, setStatusMessage] = useState(null);
  const [updatingUid, setUpdatingUid] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ firstName: "", surname: "", email: "" });

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
      setUsers((prev) =>
        prev.map((u) => (u.uid === targetUid ? { ...u, role: previousRole } : u))
      );
      setStatusMessage({ text: "Failed to update role. Please try again.", type: "danger" });
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setUpdatingUid(null);
    }
  };

  const handleEditClick = (u) => {
    setEditingUser(u.uid);
    // Populate with existing values, falling back to splitting 'name' for legacy users
    let firstName = u.firstName || "";
    let surname = u.surname || "";
    if (!firstName && !surname && u.name) {
      const parts = u.name.split(" ");
      firstName = parts[0] || "";
      surname = parts.slice(1).join(" ") || "";
    }
    setEditForm({
      firstName,
      surname,
      email: u.email || "",
    });
  };

  const handleEditSave = async (targetUid) => {
    setStatusMessage(null);
    try {
      const userDocRef = doc(db, "users", targetUid);
      const updates = {
        firstName: editForm.firstName.trim(),
        surname: editForm.surname.trim(),
        email: editForm.email.trim(),
        name: `${editForm.firstName.trim()} ${editForm.surname.trim()}`.trim(),
      };
      await updateDoc(userDocRef, updates);
      setUsers((prev) =>
        prev.map((u) => (u.uid === targetUid ? { ...u, ...updates } : u))
      );
      setEditingUser(null);
      setStatusMessage({ text: "User updated successfully.", type: "success" });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err) {
      setStatusMessage({ text: "Failed to update user. Please try again.", type: "danger" });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleEditCancel = () => {
    setEditingUser(null);
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

          <div className="table-responsive">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>UID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Registered</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isCurrentUser = user && u.uid === user.uid;
                const isUpdating = updatingUid === u.uid;
                const isEditing = editingUser === u.uid;
                return (
                  <tr key={u.uid}>
                    <td><small className="text-muted font-monospace">{u.uid.slice(0, 8)}...</small></td>
                    <td>
                      {isEditing ? (
                        <div className="d-flex gap-1">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="First name"
                            value={editForm.firstName}
                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                          />
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Surname"
                            value={editForm.surname}
                            onChange={(e) => setEditForm({ ...editForm, surname: e.target.value })}
                          />
                        </div>
                      ) : (
                        u.surname || u.firstName
                          ? `${u.surname || ""}${u.surname && u.firstName ? ", " : ""}${u.firstName || ""}`
                          : u.name || "Unknown"
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="email"
                          className="form-control form-control-sm"
                          placeholder="Email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        />
                      ) : (
                        u.email
                      )}
                    </td>
                    <td>{formatRegistered(u.createdAt)}</td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={u.role || ""}
                        disabled={isCurrentUser || isUpdating}
                        aria-disabled={isCurrentUser ? "true" : undefined}
                        aria-label={`Role for ${u.firstName || u.name || u.uid}`}
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
                    <td>
                      {isEditing ? (
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-success" onClick={() => handleEditSave(u.uid)}>Save</button>
                          <button className="btn btn-sm btn-secondary" onClick={handleEditCancel}>Cancel</button>
                        </div>
                      ) : (
                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditClick(u)}>Edit</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </>
      )}
    </div>
  );
}
