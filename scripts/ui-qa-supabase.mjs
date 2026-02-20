import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const baseUrl = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const runAt = new Date().toISOString();
const email = `qa.supabase.${Date.now()}@example.test`;
const password = 'Qa123456!';
const evidence = [];

const log = (step, ok, details = '') => {
  evidence.push({ step, ok, details });
  console.log(`${ok ? '✅' : '❌'} ${step}${details ? ` — ${details}` : ''}`);
};

const writeNotes = async () => {
  const lines = [];
  lines.push('# QA Supabase Notes');
  lines.push('');
  lines.push(`- Date: ${runAt}`);
  lines.push('- Mode: SUPABASE (`VITE_BACKEND_MODE=supabase`)');
  lines.push(`- Base URL: ${baseUrl}`);
  lines.push(`- Test email: ${email}`);
  lines.push('');
  lines.push('## Results');
  for (const item of evidence) {
    lines.push(`- ${item.ok ? 'PASS' : 'FAIL'}: ${item.step}${item.details ? ` — ${item.details}` : ''}`);
  }
  lines.push('');
  const fails = evidence.filter((e) => !e.ok);
  lines.push('## Issues');
  if (fails.length === 0) lines.push('- None found in this run.');
  for (const f of fails) lines.push(`- ${f.step}: ${f.details || 'No details.'}`);
  lines.push('');

  await fs.writeFile('QA_SUPABASE_NOTES.md', `${lines.join('\n')}\n`, 'utf8');
};

const timeout = { timeout: 20000 };

const run = async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${baseUrl}/#/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.getByRole('button', { name: /Não tens conta\? Regista-te/i }).click();

    await page.getByPlaceholder('João').fill('QA');
    await page.getByPlaceholder('Silva').fill('Supabase');
    await page.getByPlaceholder('nome@empresa.com').fill(email);
    await page.locator('input[type="password"]').nth(0).fill(password);
    await page.locator('input[type="password"]').nth(1).fill(password);
    await page.getByRole('button', { name: /Criar Conta/i }).click();

    const redirected = await Promise.race([
      page.waitForURL(/#\/$/, timeout).then(() => 'dashboard').catch(() => null),
      page.getByText('Conta Criada!').waitFor(timeout).then(() => 'confirm').catch(() => null),
    ]);

    if (redirected === 'confirm') {
      log('AUTH: signup flow', false, 'Email confirmation required; could not continue automated authenticated flow.');
      await writeNotes();
      await context.close();
      await browser.close();
      return;
    }

    if (redirected !== 'dashboard') {
      throw new Error('Signup did not reach dashboard and no confirmation prompt was detected.');
    }

    log('AUTH: signup + dashboard redirect', true);

    await page.goto(`${baseUrl}/#/clients/new`, { waitUntil: 'domcontentloaded' });
    await page.getByPlaceholder('e.g. Acme Corp').fill('QA Supabase Industries');
    await page.getByPlaceholder('e.g. John Doe').fill('QA Contact');
    await page.getByPlaceholder('john@acme.com').fill(`qa+${Date.now()}@supabase.local`);
    await page.getByPlaceholder('+1 234 567 890').fill('+351900000001');
    await page.getByRole('button', { name: /Save Client/i }).click();

    await page.waitForURL(/#\/client\//, timeout);
    const clientId = page.url().split('/#/client/')[1];
    log('CLIENTS: create + detail navigation', true, `client_id=${clientId}`);

    await page.goto(`${baseUrl}/#/create?clientId=${clientId}`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[placeholder*="Q1 Server Upgrade"]').fill('QA Supabase Proposal');
    await page.getByText('Powder Polymer Preparation System').first().click();
    await page.getByRole('heading', { name: 'Configure Item' }).waitFor(timeout);
    await page.getByRole('button', { name: 'Add Item to Proposal' }).click();
    await page.getByText('Items (1)').waitFor(timeout);
    await page.getByRole('button', { name: 'Create Document' }).click();
    await page.waitForURL(/#\/proposal\/.+\/document/, timeout);

    const proposalId = page.url().match(/#\/proposal\/(.+)\/document/)?.[1] || '';
    log('PROPOSALS: create + add configurable line + document redirect', true, `proposal_id=${proposalId}`);

    await page.goto(`${baseUrl}/#/proposal/${proposalId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=ID:', timeout);
    log('PIPELINE: proposal detail opens', true);
  } catch (error) {
    log('SUPABASE UI QA run', false, error?.message || String(error));
  } finally {
    await writeNotes();
    await context.close();
    await browser.close();
  }
};

run().catch(async (err) => {
  log('SUPABASE QA bootstrap', false, err?.message || String(err));
  await writeNotes();
  process.exitCode = 1;
});
