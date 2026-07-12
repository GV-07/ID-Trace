# **App Name**: Global Product Authenticity System

## Core Features:

- Product Data Registration: Allows export users (manufacturer, QC, export officer) to capture product details (name, SKU, batch, dates, serial) via manual input or scanning, generates a cryptographically secure SHA256 hash ID, and stores product information and hash in the database.
- Barcode/QR Scanning Interface: Provides a user interface compatible with mobile and handheld scanners for both 1D barcodes and QR codes, enabling efficient data input for registration and verification processes.
- Secure Hash Generation: Automatically generates a unique SHA256 hash ID for each product unit based on ProductID, SerialNumber, BatchNumber, a server-side SecretKey, and a Timestamp, ensuring cryptographic security and preventing prediction or duplication.
- Centralized Product Database: Manages storage of all registered product details and their unique hash IDs within a structured database (as defined by the Export Database Schema), serving as the single source of truth for authenticity verification.
- Product Authenticity Verification: Enables import users (customs, warehouse staff, retailers) to scan product barcodes to retrieve product ID and hash ID, query the database, and compare the scanned hash against the stored hash in real-time.
- Authenticity Decision Logic: Processes the comparison result, displaying an immediate 'Verified' status if hashes match, or a 'Rejected' status with counterfeit flagging if they do not match, fulfilling the core anti-counterfeit purpose.
- API Endpoints: Exposes two primary authenticated API endpoints: '/api/v1/products/register' for adding new products on the export side, and '/api/v1/products/verify' for checking authenticity on the import side.

## Style Guidelines:

- The chosen color scheme is light, reflecting clarity and professionalism. The primary color is a strong, trustworthy blue (#2E5DB8), representing stability and global presence. The background is a very light, almost white, cool-toned gray (#F0F2F4), providing a clean canvas. An accent color, a vibrant cyan (#52CAE0), is used for highlights and interactive elements to provide clear contrast and draw attention to critical information.
- Both headlines and body text will use 'Inter', a grotesque-style sans-serif font. Its modern, machined, and objective look is well-suited for a system focused on precise data verification and security.
- Clear, minimalist line icons should be utilized throughout the application. Focus on universal symbols for security (lock, shield), verification (checkmark, 'X' for rejection), data entry (barcode, QR code), and global processes. Icons should communicate status and action efficiently without unnecessary embellishment.
- The layout will be clean, structured, and highly data-driven. Information should be presented in distinct, logical sections for export registration and import verification flows. A responsive design will ensure usability across various devices, prioritizing clarity and ease of navigation for different user roles and environments.
- Animations will be subtle and functional, serving primarily to provide immediate user feedback. Quick transitions and visual cues for successful scans, data submissions, and status updates (e.g., product verified/rejected) will enhance user experience without causing distractions.