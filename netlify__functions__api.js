// Netlify -> Google Apps Script gateway. Never put the shared secret in source code.
const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbwl10nzNjv54g_9_WWn9zn09vjw7-M-XNYsfZ9-7MaBi9ld5bD9AlpeTOOlE9XJGro4/exec';
const GAS_URL = String(process.env.GAS_WEB_APP_URL || DEFAULT_GAS_URL).trim();
const API_SECRET = String(process.env.KUPI_API_SECRET || '').trim();

function json(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    },
    body: JSON.stringify(data)
  };
}

function siteBase(event) {
  if (process.env.SITE_BASE_URL) return String(process.env.SITE_BASE_URL).replace(/\/$/, '');
  const headers = event.headers || {};
  const host = headers['x-forwarded-host'] || headers.host || '';
  const proto = headers['x-forwarded-proto'] || 'https';
  return host ? `${proto}://${host}` : '';
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(204, {});
  const query = event.queryStringParameters || {};
  const requestedAction = query.action || '';

  // Safe connection check. Reports configuration state only; never returns the secret.
  if (event.httpMethod === 'GET' && requestedAction === 'health') {
    let gas = { ok: false };
    try {
      const response = await fetch(GAS_URL, { method: 'GET', redirect: 'follow' });
      const raw = await response.text();
      let parsed;
      try { parsed = JSON.parse(raw); } catch (_) { throw new Error('Ответ Apps Script не является JSON'); }
      gas = { ok: response.ok && parsed.ok === true, service: parsed.service || '', version: parsed.version || '', health: parsed.health || '' };
    } catch (error) {
      gas = { ok: false, error: error.message || 'Не удалось связаться с Apps Script' };
    }
    const configured = Boolean(API_SECRET);
    const ok = gas.ok && configured;
    return json(ok ? 200 : 503, {
      ok,
      netlify: { function: 'api', secret_configured: configured, gas_url_configured: Boolean(GAS_URL) },
      google_apps_script: gas,
      next_step: !configured ? 'Добавьте KUPI_API_SECRET в переменные окружения Netlify.' : (!gas.ok ? 'Проверьте адрес и публикацию Web App Google Apps Script.' : '')
    });
  }

  try {
    if (!GAS_URL) return json(503, { error: 'Не задан адрес Google Apps Script.' });
    if (!API_SECRET) return json(503, { error: 'Не задан KUPI_API_SECRET в переменных окружения Netlify.' });
    let body = {};
    if (event.httpMethod !== 'GET') {
      try { body = JSON.parse(event.body || '{}'); }
      catch (_) { return json(400, { error: 'Некорректный JSON запроса.' }); }
    }
    const action = body.action || requestedAction || (String(event.path || '').includes('issue-ads') ? 'issueAds' : '');
    if (!action) return json(400, { error: 'Не указано действие API.' });
    const payload = body.payload || (event.httpMethod === 'GET' ? query : body);
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ secret: API_SECRET, action, payload })
    });
    const raw = await response.text();
    let result;
    try { result = JSON.parse(raw); }
    catch (_) { return json(502, { error: 'Google Apps Script вернул некорректный ответ. Проверьте URL Web App.' }); }
    if (!result.ok) return json(400, { error: result.error || 'Ошибка Google Apps Script.' });
    if (action === 'adminGrant' && result.data && result.data.access_url && !/^https?:\/\//i.test(result.data.access_url)) {
      const base = siteBase(event);
      if (base) result.data.access_url = base + '/' + result.data.access_url.replace(/^\//, '');
    }
    return json(200, result.data);
  } catch (error) {
    return json(502, { error: error.message || 'Ошибка связи с сервером.' });
  }
};
