/**
 * @fileOverview GS1 Prefix mapping utility to identify Registered Regions from barcodes.
 * Updated as per PRD requirements.
 */

export function resolveGS1Region(barcode: string): string {
  if (!barcode || barcode.length < 3) return "Unknown Region";

  const prefix = barcode.substring(0, 3);
  
  // Specific PRD Mappings
  if (prefix === '978') return "International (Books) 📚";
  if (prefix === '977') return "International (Serials) 📰";
  if (prefix === '890') return "India 🇮🇳";

  // Additional GS1 Regions
  const nPrefix = parseInt(prefix);
  if (nPrefix >= 0 && nPrefix <= 139) return "USA / Canada 🇺🇸";
  if (nPrefix >= 300 && nPrefix <= 379) return "France 🇫🇷";
  if (nPrefix >= 400 && nPrefix <= 440) return "Germany 🇩🇪";
  if (nPrefix >= 450 && nPrefix <= 499) return "Japan 🇯🇵";
  if (nPrefix >= 500 && nPrefix <= 509) return "United Kingdom 🇬🇧";
  if (nPrefix >= 690 && nPrefix <= 699) return "China 🇨🇳";
  if (nPrefix >= 600 && nPrefix <= 613) return "South Africa 🇿🇦";
  
  return `Region Prefix: ${prefix}`;
}
