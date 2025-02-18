// encrypt.js

import { baseURL } from './config.js';
const generateRandomKeyClient = (length = 16) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
  let key = '';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  for (let i = 0; i < length; i++) {
    key += charset[array[i] % charset.length];
  }

  return key;
};




const xorEncrypt = (data, key) => {
  let encrypted = '';
  for (let i = 0; i < data.length; i++) {
    encrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(encrypted);
};

export const sendData = async (email, password) => {
  const key = generateRandomKeyClient(32);
  const encryptedEmail = xorEncrypt(email, key);
  const encryptedPassword = xorEncrypt(password, key);
  try {
    const response = await fetch(`${baseURL}/backend/access.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ encryptedEmail, encryptedPassword, key }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending data:', error);
    throw error;
  }
};
