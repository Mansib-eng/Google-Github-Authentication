// app/components/Dashboard.tsx

"use client"; // Add this line to mark the file as a client component

import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface User {
  displayName: string;
  email: string;
  profilePic: string;
}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Fetch the authenticated user data
    axios
      .get('http://localhost:5000/api/auth/user')
      .then((response) => setUser(response.data))
      .catch((error) => console.log(error));
  }, []);

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      {user ? (
        <div>
          <h2>Welcome {user.displayName}</h2>
          <img src={user.profilePic} alt="User Profile" />
          <p>Email: {user.email}</p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
      <button onClick={() => (window.location.href = 'http://localhost:5000/api/auth/logout')}>
        Logout
      </button>
    </div>
  );
};

export default Dashboard;
