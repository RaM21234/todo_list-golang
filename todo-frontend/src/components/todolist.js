import React, { useState, useEffect } from "react";
import Todo from "./todo";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import { ToastContainer, toast } from "react-toastify";
import OTPModal from "./otpmodal";

const Todolist = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false); // Optional: loader
  const [error, setError] = useState(null); // Optional: error handling

  const [showModal, setShowModal] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Modal state
  const [editing, setEditing] = useState(null); // { id, tag, description }
  const [editTag, setEditTag] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [verified, setVerified] = useState(false);

  const navigate = useNavigate();

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("jwt");
      const email = jwtDecode(token).email;

      const response = await fetch(`http://localhost:8000/todos/${email}`);

      if (!response.ok) {
        throw new Error("Failed to fetch todos");
      }

      const data = await response.json();
      setTodos(data);
      console.log("todo", data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("jwt");
    var decoded = jwtDecode(token);
    setVerified(decoded.verified);

    fetchTodos();
  }, []);

  const handleAddTodo = async () => {
    const token = localStorage.getItem("jwt");
    const email = jwtDecode(token).email;

    const newTodo = {
      user: email,
      date: new Date().toISOString().split("T")[0],
      tag: newTag,
      description: newDescription,
    };

    try {
      const response = await fetch("http://localhost:8000/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTodo),
      });

      if (!response.ok) {
        throw new Error("Failed to add todo");
      }

      setShowModal(false);
      setNewTag("");
      setNewDescription("");

      fetchTodos();
    } catch (err) {
      console.error("Error:", err);
      alert("Error saving todo");
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/todos/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete todo");
      }
      console.log(`Todo with id ${id} deleted`);
      fetchTodos();
    } catch (error) {
      console.error("Error deleting todo:", error);
      alert("Error deleting todo");
    }
  };

  const handleUpdateTodo = async (id, updatedData) => {
    try {
      const response = await fetch(`http://localhost:8000/todos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        throw new Error("Failed to update todo");
      }

      const updatedTodo = await response.json();
      fetchTodos();
      console.log("Updated Todo:", updatedTodo);
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update todo");
    }
  };

  const openEditModal = (todo) => {
    setEditing(todo);
    setEditTag(todo.tag);
    setEditDescription(todo.description);
  };

  const saveEdit = () => {
    handleUpdateTodo(editing.id, {
      tag: editTag,
      description: editDescription,
    });
    setEditing(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    navigate("/login", { replace: true });
  };

  const verifyAccount = async () => {
    const token = localStorage.getItem("jwt");

    if (!token) {
      console.error("No JWT token found.");
      return;
    }

    const { email } = jwtDecode(token);
    console.log("Email to verify:", email);

    try {
      const res = await fetch("http://localhost:8000/request-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Verification code sent—check your email");
        setModalOpen(true);
      } else {
        toast.error("Failed to send verification code");
      }
    } catch (err) {
      toast.error("Network error sending verification code");
    }
  };

  const verifyOTP = async (code) => {
    const token = localStorage.getItem("jwt");
    const { email } = jwtDecode(token);
    try {
      const res = await fetch("http://localhost:8000/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      if (res.ok) {
        const res = await fetch("http://localhost:8000/verify-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (res.ok) {
          toast.success("Email verified successfully!");
        } else {
          toast.error("Failed to verify email try again after sometime!");
        }
        setModalOpen(false);
      } else {
        const data = await res.json();
        toast.error(data.error || "Invalid or expired OTP");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error verifying OTP");
    }
  };

  return (
    <>
      <ToastContainer position="top-center" />

      <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-black">Todo List</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(true)}
                className="text-black border border-black hover:bg-black hover:text-white px-4 py-2 rounded-md text-sm"
              >
                + Add Todo
              </button>
              <button
                onClick={handleLogout}
                className="text-black border border-black hover:bg-black hover:text-white px-4 py-2 rounded-md text-sm"
              >
                Logout
              </button>
              <button
                onClick={verifyAccount}
                className={`text-black border border-black
                   ${verified == true ? " bg-green-300" : " bg-red-400"} 
                   hover:text-white px-4 py-2 rounded-md text-sm`}
                disabled={verified}
              >
                Verify Account
              </button>
            </div>
          </div>

          {/* Todo List */}
          <Todo
            todos={todos}
            onDelete={handleDeleteTodo}
            onEdit={(id) => {
              const todo = todos.find((t) => t.id === id);
              openEditModal(todo);
            }}
          />

          {/* Add Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg border border-gray-200">
                <h2 className="text-xl font-semibold text-black mb-4">
                  Add New Todo
                </h2>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Tag
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-black focus:border-black"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-black focus:border-black"
                    rows="3"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-black text-black rounded hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTodo}
                    className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          <OTPModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onVerify={verifyOTP}
          />

          {/* Edit Modal */}
          {editing && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
                <h2 className="text-xl font-semibold text-black mb-4">
                  Edit Todo
                </h2>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Tag
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-black focus:border-black"
                    value={editTag}
                    onChange={(e) => setEditTag(e.target.value)}
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-black focus:border-black"
                    rows="3"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setEditing(null)}
                    className="px-4 py-2 border border-black text-black rounded hover:bg-gray-100"
                  >
                    Close
                  </button>
                  <button
                    onClick={saveEdit}
                    className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Todolist;
