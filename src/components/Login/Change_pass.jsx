import React, { useState } from 'react';
import { baseURL } from "../../config.js";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
function ChangePass() {
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const navigate = useNavigate();
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setPasswordMismatch(true);
      return;
    } else {
      setPasswordMismatch(false);
    }

    try {
      const response = await fetch(`${baseURL}backend/change-password.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, newPassword }),
      });
      const result = await response.json();
      if (result.success) {
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem('user');
        toast.success("Password Changed !");
      
        // Add Tailwind CSS classes to the body or a container element
        document.body.classList.add('cursor-wait', 'pointer-events-none');
      
        setTimeout(() => {
          document.body.classList.remove('cursor-wait', 'pointer-events-none');
          window.location.href = "/login";
        }, 3000); // 3000 milliseconds = 3 seconds
      } else {
        alert(result.message || 'Error changing password.');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center bg-second">
      <form onSubmit={handleSubmit} className="bg-box p-6 text-sm rounded-3xl shadow-lg w-full max-w-sm">
        <h2 className="text-2xl mb-4">Change Password</h2>
        <div className="mb-4">
          <label className="block text-prime">Username</label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-prime">New Password</label>
          <input
            type="password"
            className="w-full px-3 py-2 border rounded"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-prime font-medium">Confirm Password</label>
          <input
            type="password"
            className="w-full px-3 py-2 border rounded"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        {passwordMismatch && (
          <p className="text-red-500 mb-4">Passwords do not match. Please try again.</p>
        )}
        <button type="submit" className="w-1/2 ml-20 bg-blue-500 hover:shadow-md hover:shadow-flo text-white py-2 rounded">Submit</button>
      </form>
    </div>
  );
}

export default ChangePass;
