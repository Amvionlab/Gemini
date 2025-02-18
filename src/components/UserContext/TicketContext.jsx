import React, { createContext, useState, useContext, useEffect } from 'react';
import CryptoJS from 'crypto-js';

const TicketContext = createContext();

const SECRET_KEY = 'your-secret-key'; // Replace with a secure key

const encrypt = (text) => {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

const decrypt = (cipherText) => {
  const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const TicketProvider = ({ children }) => {
  const [ticketId, setTicketId] = useState(() => {
    // Load ticketId from localStorage if available
    const savedTicketId = localStorage.getItem('ticketId');
    return savedTicketId ? decrypt(savedTicketId) : null;
  });

  useEffect(() => {
    if (ticketId !== null) {
      // Save ticketId to localStorage when it changes
      localStorage.setItem('ticketId', encrypt(ticketId));
    } else {
      // Remove ticketId from localStorage when it's null
      localStorage.removeItem('ticketId');
    }
  }, [ticketId]);

  return (
    <TicketContext.Provider value={{ ticketId, setTicketId }}>
      {children}
    </TicketContext.Provider>
  );
};

export const useTicketContext = () => useContext(TicketContext);
