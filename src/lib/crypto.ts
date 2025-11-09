
"use client";

// --- Helper Functions for Web Crypto API ---

// Generate a key from a passphrase and salt
async function getKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.slice(0),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// Encrypt a string
export async function encryptText(text: string, passphrase: string) {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(passphrase, salt);

  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    new TextEncoder().encode(text)
  );

  return {
    encryptedText: Buffer.from(encryptedContent).toString("base64"),
    iv: Buffer.from(iv).toString("base64"),
    salt: Buffer.from(salt).toString("base64"),
  };
}

// Decrypt a string
export async function decryptText(
  encryptedTextBase64: string,
  passphrase: string,
  ivBase64: string,
  saltBase64: string
): Promise<string> {
  const salt = Uint8Array.from(Buffer.from(saltBase64, "base64"));
  const iv = Uint8Array.from(Buffer.from(ivBase64, "base64"));
  const key = await getKey(passphrase, salt);

  const encryptedContent = Uint8Array.from(
    Buffer.from(encryptedTextBase64, "base64")
  );

  const decryptedContent = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encryptedContent
  );

  return new TextDecoder().decode(decryptedContent);
}

// Encrypt binary data with a derived key
export async function encryptData(
  data: Buffer,
  derivedKey: Buffer
): Promise<{ encrypted: Buffer; iv: Buffer }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Convert Buffers to Uint8Array for Web Crypto API
  const dataUint8 = new Uint8Array(data);
  const keyUint8 = new Uint8Array(derivedKey);
  
  // Import the derived key
  const key = await crypto.subtle.importKey(
    'raw',
    keyUint8,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    dataUint8
  );

  return {
    encrypted: Buffer.from(encrypted),
    iv: Buffer.from(iv),
  };
}

// Decrypt binary data with a derived key
export async function decryptData(
  encryptedData: Buffer,
  derivedKey: Buffer,
  iv: Buffer
): Promise<Buffer> {
  // Convert Buffers to Uint8Array for Web Crypto API
  const encryptedUint8 = new Uint8Array(encryptedData);
  const keyUint8 = new Uint8Array(derivedKey);
  const ivUint8 = new Uint8Array(iv);
  
  // Import the derived key
  const key = await crypto.subtle.importKey(
    'raw',
    keyUint8,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivUint8 },
    key,
    encryptedUint8
  );

  return Buffer.from(decrypted);
}
