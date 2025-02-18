import React, { createContext, useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';




export const UserContext = createContext();

const SECRET_KEY = 'YIDASTUYQWJDQW87T6E56TYUI765rtfgxhjnbcajsuicanciaskloiaud'; // Replace this with a more secure key

const encryptData = (data) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
};

const decryptData = (data) => {
  const bytes = CryptoJS.AES.decrypt(data, SECRET_KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Load and decrypt user data from localStorage on initial state
    const storedUser = localStorage.getItem('user');
    return storedUser ? decryptData(storedUser) : null;
  });

  useEffect(() => {
    // Encrypt and save user data to localStorage on user state change
    if (user) {
      localStorage.setItem('user', encryptData(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
