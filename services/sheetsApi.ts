
import { GOOGLE_CONFIG } from '../config';

type RowData = Record<string, any>;

/**
 * Envia uma linha para uma sheet do Google Sheets via Apps Script Web App.
 * Usa mode: 'no-cors' para evitar problemas de preflight em ambientes restritos.
 */
export async function postToSheets(
  sheetName: string,
  data: RowData
): Promise<{ success: boolean }> {
  if (!GOOGLE_CONFIG.SHEETS_WEBAPP_URL) {
    console.warn('⚠️ SHEETS_WEBAPP_URL não definido. Ignorando sincronização de escrita.');
    return { success: true };
  }

  try {
    const payload = { sheetName, data };
    const payloadString = JSON.stringify(payload);

    // POST "cego" (no-cors) para evitar erros de pré-verificação do browser
    await fetch(GOOGLE_CONFIG.SHEETS_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors', 
      headers: { 'Content-Type': 'text/plain' },
      body: payloadString,
    });

    return { success: true };
  } catch (error) {
    console.error(`❌ Falha ao enviar para sheet "${sheetName}":`, error);
    return { success: false };
  }
}

/**
 * Lê linhas de uma sheet do Google Sheets.
 * Nota: Esta função pode falhar se o Apps Script não permitir CORS do domínio atual.
 */
export async function fetchSheetRows(
  sheetName: 'Clients' | 'Proposals' | 'ProposalLines'
): Promise<RowData[]> {
  if (!GOOGLE_CONFIG.SHEETS_WEBAPP_URL) {
    return [];
  }

  // Adicionamos um timestamp para evitar caching agressivo do browser
  const url = `${GOOGLE_CONFIG.SHEETS_WEBAPP_URL}?sheet=${encodeURIComponent(sheetName)}&t=${Date.now()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      return [];
    }

    const json = await response.json();

    if (json && json.ok && Array.isArray(json.rows)) {
      return json.rows;
    }

    return [];
  } catch (error) {
    // Se for um "Failed to fetch" (erro de rede/CORS), apenas reportamos e devolvemos vazio
    console.debug(`ℹ️ Conexão à sheet "${sheetName}" indisponível (CORS ou Offline).`);
    return [];
  }
}
