// app/layout.tsx

import React from 'react';
import './styles.css'; // Import global CSS

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <head>
        <title>My Auth Testing App</title>
      </head>
      <body>
        <header>
          <nav>
            {/* You can add a basic header with navigation here if needed */}
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/login">Login</a></li>
              <li><a href="/dashboard">Dashboard</a></li>
            </ul>
          </nav>
        </header>
        {children} {/* This renders the content of each page */}
      </body>
    </html>
  );
};

export default Layout;
