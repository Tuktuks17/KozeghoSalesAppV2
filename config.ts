export const GOOGLE_CONFIG = {
  // Google Apps Script Web App URLs
  GENERATE_DOC_WEBAPP_URL: import.meta.env.VITE_GENERATE_DOC_WEBAPP_URL || '',
  SEND_EMAIL_WEBAPP_URL: import.meta.env.VITE_SEND_EMAIL_WEBAPP_URL || '',

  // Sheets API bridge (explicit opt-in only)
  SHEETS_WEBAPP_URL: import.meta.env.VITE_SHEETS_API_URL || '',

  // Optional document/sheets metadata
  PROPOSALS_SHEET_ID: import.meta.env.VITE_PROPOSALS_SHEET_ID || '',
  PROPOSALS_SHEET_NAME: import.meta.env.VITE_PROPOSALS_SHEET_NAME || 'Proposals_DB',
  TEMPLATE_DOC_ID: import.meta.env.VITE_TEMPLATE_DOC_ID || '',
  OUTPUT_FOLDER_ID: import.meta.env.VITE_OUTPUT_FOLDER_ID || '',
};
