export type ProductStatus = 'active' | 'verified' | 'rejected';

export interface Product {
  id: string; 
  barcode: string;
  productName: string;
  brand: string;
  manufacturer: string;
  originAddress: string; 
  registeredRegion: string; 
  weightSize?: string;
  category?: string;
  commonKnownAs?: string;
  serialNumber?: string;
  batchNumber?: string;
  sku?: string;
  manufacturingDate?: string;
  countryOfOrigin?: string;
  hash: string;
  salt: string; 
  exportTimestamp: string;
  status: ProductStatus;
}

export interface VerificationLog {
  id: string;
  productId: string;
  scannedBarcode: string;
  verificationTimestamp: string;
  isMatch: boolean;
  status: 'approved' | 'rejected';
  creatorUid: string;
}

export interface RegisteredUser {
  uid: string;
  fullName: string;
  email: string;
  regDate: string;
  role: 'officer' | 'admin';
}

export interface AuthLog {
  id: string;
  email: string;
  timestamp: string;
  status: 'success' | 'fail';
  reason?: string;
}
