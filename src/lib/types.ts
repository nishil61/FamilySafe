
export type Note = {
  id: string;
  userId: string;
  title: string;
  encryptedContent: string;
  iv: string;
  salt: string;
  decryptedContent?: string;
};

export type VaultItem = {
  id: string;
  userId: string;
  name: string;
  type: "pin" | "password" | "card" | "atm" | "other";
  encryptedContent: string;
  iv: string;
  salt: string;
  createdAt?: Date;
};

export type Document = {
  id: string;
  userId: string;
  name: string;
  fileName: string;
  docType: "aadhar" | "pan" | "passport" | "drivers_license" | "custom";
  customLabel?: string;
  encryptedFileData: string;
  iv: string;
  salt: string;
  notes?: string;
  expiryDate?: string | null;
  uploadedAt: string;
  mimeType: string;
  size: number;
};
