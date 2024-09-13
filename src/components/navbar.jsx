import React from "react";
import "../navbar.css"; 

function Navbar() {
  return (
    <nav className="nav">
      <a href="#" className="nav__brand">
        <img
          src="/image.jpg" 
          alt="Logo"
          className="logo"
        />
        <span className="nav__title">QTODO</span>
      </a>
    </nav>
  );
}

export default Navbar;
