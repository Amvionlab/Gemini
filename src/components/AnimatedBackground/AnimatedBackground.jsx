import React from 'react';
import './AnimatedBackground.css';

const AnimatedBackground = ({ children }) => (
  <div className="area">
    <ul className="circles">
      <li></li>
      <li></li>
      <li></li>
      <li></li>
      <li></li>
      <li></li>
      <li></li>
      <li></li>
      <li></li>
      <li></li>
      <li></li>
      <li></li>
      <li></li>
      <li></li>
      <li></li>

    </ul>
    {children}
  </div>
);

export default AnimatedBackground;
