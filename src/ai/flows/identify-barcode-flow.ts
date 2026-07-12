
'use server';
/**
 * @fileOverview High-fidelity AI flow to identify exact product details from barcodes/QR labels.
 * Optimized for retail products (UPC/EAN) and hardware assets.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const IdentifyBarcodeInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a product label, barcode, or QR code. Can be a retail product (UPC/EAN) or hardware asset."
    ),
});

const IdentifyBarcodeOutputSchema = z.object({
  barcode: z.string().describe('The primary ID, UPC, EAN, QR data, or Service Tag extracted.'),
  productName: z.string().describe('The specific product name (e.g., Britannia Good Day Cashew Biscuit).'),
  brand: z.string().describe('The brand name (e.g., Britannia, 3M, Dell).'),
  manufacturer: z.string().optional().describe('The company that manufactured the product.'),
  weightSize: z.string().optional().describe('The weight or size of the product.'),
  category: z.string().optional().describe('The product category.'),
  commonKnownAs: z.string().optional().describe('How the product is commonly known.'),
  serialNumber: z.string().optional().describe('The unique Serial Number.'),
  sku: z.string().optional().describe('The SKU or Part Number.'),
  batchNumber: z.string().optional().describe('The production batch or lot number.'),
  manufacturingDate: z.string().optional().describe('Manufacturing date (YYYY-MM-DD).'),
  countryOfOrigin: z.string().optional().describe('Country of manufacture or origin.'),
  originAddress: z.string().optional().describe('The full physical manufacturing address or publisher office location.'),
});

export type IdentifyBarcodeOutput = z.infer<typeof IdentifyBarcodeOutputSchema>;

/**
 * Result wrapper for the identifyBarcode action to prevent hard crashes.
 */
export type IdentifyBarcodeResponse = {
  success: boolean;
  data?: IdentifyBarcodeOutput;
  error?: string;
};

export async function identifyBarcode(input: { photoDataUri: string }): Promise<IdentifyBarcodeResponse> {
  try {
    const result = await identifyBarcodeFlow(input);
    return { success: true, data: result };
  } catch (err: any) {
    console.error('ID-TRACE extraction error:', err);
    return { 
      success: false, 
      error: err.message || 'ID-TRACE: Extraction layer encountered an unexpected error.' 
    };
  }
}

const identifyBarcodeFlow = ai.defineFlow(
  {
    name: 'identifyBarcodeFlow',
    inputSchema: IdentifyBarcodeInputSchema,
    outputSchema: IdentifyBarcodeOutputSchema,
  },
  async (input) => {
    let attempts = 0;
    const maxRetries = 3;

    while (attempts <= maxRetries) {
      try {
        const { output } = await ai.generate({
          prompt: [
            { media: { url: input.photoDataUri } },
            { text: `YOU ARE A HIGH-SPEED IDENTITY SPECIALIST FOR ID-TRACE.
              Analyze the image for any Barcode (UPC, EAN) or QR code and accompanying text.
              
              TASK: Extract EXACT metadata for the Global Identity Registry.
              
              GUIDELINES:
              1. Barcode/QR: Extract the string value.
              2. Product Details: Identify the EXACT product name, brand, and manufacturer.
              3. Origin Trace: Research and provide the FULL physical manufacturing address or corporate office address for the manufacturer. This is critical.
              4. Knowledge Retrieval: For retail codes (UPC/EAN), use your internal database to provide Weight/Size, Category, and Country of Origin.
              
              CRITICAL: Return specific details for registration/verification.` },
          ],
          output: { schema: IdentifyBarcodeOutputSchema },
        });

        if (!output) {
          throw new Error('Exact Detail Extraction failed. Ensure the label is clear.');
        }

        return output;
      } catch (err: any) {
        const isQuotaError = err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
        
        if (isQuotaError && attempts < maxRetries) {
          attempts++;
          const delay = attempts * 5000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        if (isQuotaError) {
          throw new Error('ID-TRACE: AI layer is busy. Please wait 15-30 seconds before next scan.');
        }

        throw err;
      }
    }

    throw new Error('Extraction failed after multiple attempts.');
  }
);
