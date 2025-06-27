// app/components/Login.tsx

import React from 'react';

const Login: React.FC = () => {
  return (
    <div className="login-container">
      <h1>Login Page</h1>
      <div className="login-buttons">
        <a href="http://localhost:5000/api/auth/google">
          <button>Login with Google</button>
        </a>
        <br />
        <a href="http://localhost:5000/api/auth/github">
          <button>Login with GitHub</button>
        </a>
      </div>
    </div>
  );
};

export default Login;
