'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const required = [
  'PHONE_SETUP_RU.txt', 'PROJECT_MAP_RU.txt', 'README_RU.txt', 'docs/AUDIT_RU.txt',
  'site/index.html', 'site/home.html', 'site/ad-form.html', 'site/free-issue.html',
  'site/search-issue.html', 'site/admin.html',
  'netlify/functions/api.js', 'netlify/functions/issue-ads.js',
  'apps_script/Code.gs', 'apps_script/Database.gs', 'apps_script/Ads.gs',
  'apps_script/IssuesPayments.gs', 'apps_script/Admin.gs', 'apps_script/appsscript.json',
  'netlify.toml', 'package.json', 'scripts/build-check.js'
];
function fail(message) { throw new Error(message); }
for (const file of required) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) fail('Не найден обязательный файл: ' + file);
  if (!fs.statSync(full).isFile() || fs.statSync(full).size < 20) fail('Файл отсутствует или пустой: ' + file);
}
// Compile every server-side JavaScript file without executing it.
for (const file of [
  'netlify/functions/api.js', 'netlify/functions/issue-ads.js',
  'apps_script/Code.gs', 'apps_script/Database.gs', 'apps_script/Ads.gs',
  'apps_script/IssuesPayments.gs', 'apps_script/Admin.gs'
]) new vm.Script(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
// Verify that the home-page navigation targets exist and are local sibling pages.
const indexHtml = fs.readFileSync(path.join(root, 'site/index.html'), 'utf8');
for (const target of ['./ad-form.html', './free-issue.html']) {
  if (!indexHtml.includes('href=\"' + target + '\"')) fail('На главной странице отсутствует ссылка: ' + target);
  if (!fs.existsSync(path.join(root, 'site', target.replace(/^\.\//, '')))) fail('Не найдена целевая страница: ' + target);
}
const homeHtml = fs.readFileSync(path.join(root, 'site/home.html'), 'utf8');
if (!homeHtml.includes('./index.html') || !homeHtml.includes('location.replace')) fail('home.html должен перенаправлять на основную страницу index.html.');
// Compile every inline browser script in all six pages.
const pages = ['index.html','home.html','ad-form.html','free-issue.html','search-issue.html','admin.html'];
for (const file of pages) {
  const html = fs.readFileSync(path.join(root, 'site', file), 'utf8');
  if (!/^<!doctype html>/i.test(html.trim())) fail('Некорректное начало HTML: site/' + file);
  const blocks = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  for (let i = 0; i < blocks.length; i++) {
    const attrs = blocks[i][1];
    if (/\bsrc\s*=/.test(attrs) || /type\s*=\s*["']application\/json/i.test(attrs)) continue;
    new vm.Script(blocks[i][2], { filename: file + ':inline-script-' + (i + 1) });
  }
}
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (pkg.scripts?.build !== 'node prepare-project.js && node scripts/build-check.js') fail('Неверная команда сборки package.json.');
if (Number(pkg.engines?.node?.replace(/\D/g, '') || 0) < 18) fail('Для Netlify требуется Node.js 18 или новее.');
const toml = fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8');
for (const line of ['command = "npm run build"', 'publish = "site"', 'functions = "netlify/functions"', 'node_bundler = "esbuild"']) {
  if (!toml.includes(line)) fail('В netlify.toml отсутствует настройка: ' + line);
}
const gas = fs.readFileSync(path.join(root, 'apps_script/Code.gs'), 'utf8');
const db = fs.readFileSync(path.join(root, 'apps_script/Database.gs'), 'utf8');
if (/INTERNAL_API_SECRET\s*=/.test(gas) || /setProperty\(['"]KUPI_API_SECRET['"]/.test(db)) fail('Найдено небезопасное встраивание/перезапись API-ключа.');
if (!/getProperty\(['"]KUPI_API_SECRET['"]\)/.test(gas)) fail('Нет проверки сохранённого API-ключа Apps Script.');
const actions = [...gas.matchAll(/case\s+'([^']+)'\s*:/g)].map(m => m[1]);
for (const action of ['formData','submitAd','uploadPhoto','searchAds','currentIssue','issueAds','purchaseRequest','feedback','adminStart','adminVerify','adminDashboard','adminDecision','adminGrant','adminCreateIssue','adminLogout']) {
  if (!actions.includes(action)) fail('В API Apps Script отсутствует действие: ' + action);
}
const api = fs.readFileSync(path.join(root, 'netlify/functions/api.js'), 'utf8');
if (!/exports\.handler\s*=\s*async/.test(api)) fail('Не найден обработчик Netlify Function api.');
if (!/process\.env\.KUPI_API_SECRET/.test(api)) fail('API не читает KUPI_API_SECRET из переменных Netlify.');
if (!/DEFAULT_GAS_URL/.test(api)) fail('Не задан резервный URL Apps Script.');
const issueFn = fs.readFileSync(path.join(root, 'netlify/functions/issue-ads.js'), 'utf8');
if (!/require\(['"]\.\/api['"]\)/.test(issueFn) || !/api\.handler/.test(issueFn)) fail('Endpoint issue-ads не подключён к API gateway.');
console.log('BUILD CHECK OK');
console.log('Плоский GitHub-комплект: структура проекта восстановлена перед проверкой.');
console.log('Проверено: 21 обязательный файл, 6 HTML-страниц, ссылки index.html на формы, перенаправление home.html, синтаксис 7 серверных JS-файлов, встроенные скрипты HTML, 15 API-действий, Netlify build/publish/functions и защита секрета.');
console.log('Важно: живые Google/Netlify интеграции этим локальным тестом не проверяются.');
