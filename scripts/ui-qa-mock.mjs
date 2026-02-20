import { chromium } from 'playwright';

const baseUrl = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const runAt = new Date().toISOString();
const evidence = [];

const log = (step, ok, details = '') => {
  evidence.push({ step, ok, details });
  console.log(`${ok ? '✅' : '❌'} ${step}${details ? ` — ${details}` : ''}`);
};

const appendNotes = async () => {
  const lines = [];
  lines.push('# QA Notes');
  lines.push('');
  lines.push(`- Date: ${runAt}`);
  lines.push('- Mode: MOCK (`VITE_BACKEND_MODE=mock`)');
  lines.push(`- Base URL: ${baseUrl}`);
  lines.push('');
  lines.push('## Results');
  for (const item of evidence) {
    lines.push(`- ${item.ok ? 'PASS' : 'FAIL'}: ${item.step}${item.details ? ` — ${item.details}` : ''}`);
  }
  lines.push('');

  const failures = evidence.filter((e) => !e.ok);
  if (failures.length) {
    lines.push('## Issues');
    for (const failure of failures) {
      lines.push(`- ${failure.step}: ${failure.details || 'No details.'}`);
    }
  } else {
    lines.push('## Issues');
    lines.push('- None found in this mock run.');
  }
  lines.push('');

  await import('node:fs/promises').then((fs) =>
    fs.writeFile('QA_NOTES.md', `${lines.join('\n')}\n`, 'utf8')
  );
};

const timeout = { timeout: 15000 };

const run = async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${baseUrl}/#/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForSelector('input[type="email"]', timeout);

    await page.fill('input[type="email"]', 'qa.mock@kozegho.com');
    await page.fill('input[type="password"]', '123456');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL(/#\/$/, timeout);
    await page.waitForSelector('text=Hello,', timeout);
    log('AUTH: login and dashboard redirect', true);

    // CLIENTS: create
    await page.goto(`${baseUrl}/#/clients/new`, { waitUntil: 'domcontentloaded' });
    await page.getByPlaceholder('e.g. Acme Corp').fill('QA Mock Industries');
    await page.getByPlaceholder('e.g. John Doe').fill('QA Contact');
    await page.getByPlaceholder('john@acme.com').fill(`qa+${Date.now()}@mock.local`);
    await page.getByPlaceholder('+1 234 567 890').fill('+351900000000');
    await page.getByRole('button', { name: /Save Client/i }).click();
    await page.waitForURL(/#\/client\//, timeout);

    const clientUrl = page.url();
    const clientId = clientUrl.split('/#/client/')[1];
    await page.waitForSelector('text=QA Mock Industries', timeout);
    log('CLIENTS: create + detail navigation', true, `client_id=${clientId}`);

    // PROPOSAL: create with one configured line
    await page.goto(`${baseUrl}/#/create?clientId=${clientId}`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[placeholder*=\"Q1 Server Upgrade\"]').fill('QA Proposal Happy Path');
    await page.getByText('Powder Polymer Preparation System').first().click();
    await page.getByRole('heading', { name: 'Configure Item' }).waitFor(timeout);
    await page.getByRole('button', { name: 'Add Item to Proposal' }).click();
    await page.getByText('Items (1)').waitFor(timeout);
    await page.getByRole('button', { name: 'Create Document' }).click();
    await page.waitForURL(/#\/proposal\/.+\/document/, timeout);

    const docUrl = page.url();
    const proposalId = docUrl.match(/#\/proposal\/(.+)\/document/)?.[1] || '';
    log('PROPOSALS: create + add configurable line + document redirect', true, `proposal_id=${proposalId}`);

    // DOCUMENT: preview + AI fallback
    await page.getByText('Document Preview').waitFor(timeout);
    await page.getByRole('button', { name: /Send Email/i }).click();
    await page.getByRole('button', { name: /Escrever com IA/i }).click();
    const body = page.locator('textarea').nth(0);
    await body.waitFor(timeout);
    const bodyValue = await body.inputValue();
    const fallbackOk = /Please find attached proposal|Dear/.test(bodyValue);
    log('DOCUMENT: AI fallback without key', fallbackOk, fallbackOk ? 'fallback template generated' : 'fallback text missing');
    await page.getByRole('button', { name: 'Cancelar' }).click();

    // STATUS: attempt status transitions from detail
    await page.goto(`${baseUrl}/#/proposal/${proposalId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=ID:', timeout);
    const statusControls = await page.locator('button:has-text("Approve Internally"), button:has-text("Send by Email"), button:has-text("Won"), button:has-text("Lost")').count();
    if (statusControls > 0) {
      log('PIPELINE: status transition controls available', true, `controls=${statusControls}`);
    } else {
      log('PIPELINE: status transition controls available', false, 'No status transition controls visible for current proposal state (Draft/Doc Generated).');
    }

  } catch (error) {
    log('UI QA run', false, error?.message || String(error));
  } finally {
    await appendNotes();
    await context.close();
    await browser.close();
  }
};

run().catch(async (err) => {
  log('UI QA bootstrap', false, err?.message || String(err));
  await appendNotes();
  process.exitCode = 1;
});
