'use server';

import { Product, RegisterProductPayload, VerifyProductPayload } from '@/lib/types';
import { generateProductHash } from '@/lib/hash-utils';

// Simulated database
let productsDb: Product[] = [];

export async function registerProduct(payload: RegisterProductPayload) {
  const timestamp = new Date().toISOString();
  const hashId = generateProductHash(
    payload.barcode,
    payload.serialNumber,
    payload.batchNumber,
    timestamp
  );

  const newProduct: Product = {
    id: crypto.randomUUID(),
    ...payload,
    hashId,
    exportTimestamp: timestamp,
    status: 'active',
  };

  productsDb.push(newProduct);
  
  // Return a clean object for the client
  return {
    success: true,
    product: newProduct,
  };
}

export async function verifyProduct(payload: VerifyProductPayload) {
  // Simulate database search
  const product = productsDb.find(p => p.barcode === payload.barcode);

  if (!product) {
    return {
      status: 'rejected',
      message: 'Product not found in global registry.',
    };
  }

  if (product.hashId === payload.hashId) {
    product.status = 'verified';
    return {
      status: 'verified',
      message: 'Product authenticity confirmed.',
      product: product,
    };
  }

  return {
    status: 'rejected',
    message: 'Hash mismatch! Potential counterfeit detected.',
  };
}

export async function getRecentProducts() {
  return productsDb.slice(-5).reverse();
}