const GAS_URL = process.env.GAS_WEB_APP_URL;
const API_SECRET = process.env.KUPI_API_SECRET;
exports.handler = async (event) => {
  const headers = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
  if (event.httpMethod === 'OPTIONS') return {statusCode:204,headers};
  try {
    if (!GAS_URL || !API_SECRET) throw new Error('Сервер ещё не настроен: задайте GAS_WEB_APP_URL и KUPI_API_SECRET в Netlify.');
    let body = {};
    if (event.httpMethod !== 'GET') body = JSON.parse(event.body || '{}');
    const action = body.action || event.queryStringParameters?.action || (event.path.includes('issue-ads') ? 'issueAds' : '');
    const payload = body.payload || (event.httpMethod === 'GET' ? event.queryStringParameters || {} : body);
    const response = await fetch(GAS_URL, {method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({secret:API_SECRET,action,payload})});
    const raw = await response.text();
    let result; try { result=JSON.parse(raw); } catch (_) { throw new Error('Google Apps Script вернул некорректный ответ. Проверьте URL развёртывания.'); }
    if (!result.ok) return {statusCode:400,headers,body:JSON.stringify({error:result.error || 'Ошибка backend'})};
    if (action === 'adminGrant' && result.data && result.data.access_url && !/^https?:\/\//i.test(result.data.access_url) && process.env.SITE_BASE_URL) result.data.access_url = process.env.SITE_BASE_URL.replace(/\/$/,'') + '/' + result.data.access_url.replace(/^\//,'');
    return {statusCode:200,headers,body:JSON.stringify(result.data)};
  } catch (e) { return {statusCode:500,headers,body:JSON.stringify({error:e.message || 'Ошибка сервера'})}; }
};
