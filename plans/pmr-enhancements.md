# Implementation Plan: PMR Form Enhancements (Uploads & QR Scan)

## 1. Overview
Enhance the PMR form to support:
- QR code scanning for device identification.
- File uploads for maintenance activity photos (max 3MB).
- File uploads for fuel receipts (max 3MB).

## 2. Backend Changes
- **Database Schema:** Add columns to `pmr_reports` table:
    - `maintenance_photo` (VARCHAR/TEXT)
    - `fuel_receipt` (VARCHAR/TEXT)
- **API Controllers:** 
    - Use `multer` for multipart/form-data handling.
    - Implement file size validation (max 3MB).
    - Store files in `uploads/` directory and save file paths in the database.
    - Update `createPmrReport` controller to handle file paths.

## 3. Frontend Changes
- **FormPMR.jsx:**
    - Integrate a QR Scanner library (e.g., `react-qr-reader`).
    - Add file input components for "Maintenance Photo" and "Fuel Receipt" with validation.
    - Update state to manage files and scan results.
    - Use `FormData` to send files to the backend.

## 4. Implementation Steps
1.  **Backend:**
    - Run SQL migration for `pmr_reports` table.
    - Install `multer` and configure file upload storage/validation.
    - Update `createPmrReport` in `inventoryController.js`.
2.  **Frontend:**
    - Install necessary npm packages (`react-qr-reader`, etc.).
    - Update `FormPMR.jsx` UI and state logic.
    - Update `createPmrReport` service call to use `FormData`.
3.  **Validation & Testing:**
    - Validate file sizes (3MB) and types on the frontend.
    - Verify file upload and saving of paths.
    - Test QR scanner integration and PMR report creation.

## 5. Verification
- Confirm QR scanner successfully identifies devices.
- Verify file uploads work and images are saved correctly.
- Ensure report submission includes images and device info.
