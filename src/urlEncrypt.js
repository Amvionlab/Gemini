// utils/urlEncrypt.js

const generateRandomKeyClient = (length = 16) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  const array = new Uint32Array(length);
  window.crypto.getRandomValues(array);

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

const xorDecrypt = (encryptedData, key) => {
  const data = atob(encryptedData);
  let decrypted = '';
  for (let i = 0; i < data.length; i++) {
    decrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return decrypted;
};

export const encryptURL = (data) => {
  const key = generateRandomKeyClient(32);
  const encryptedData = xorEncrypt(data, key);
  return { encryptedData, key };
};

export const decryptURL = (encryptedData, key) => {
  return xorDecrypt(encryptedData, key);
};
