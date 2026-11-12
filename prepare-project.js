'use strict';
const fs = require('fs');
const path = require('path');
const root = __dirname;
const files = [
  {"flat": "DEPLOY_NETLIFY_RU.txt", "target": "DEPLOY_NETLIFY_RU.txt"},
  {"flat": "GITHUB_FILES_LIST_RU.txt", "target": "GITHUB_FILES_LIST_RU.txt"},
  {"flat": "GITHUB_UPLOAD_RU.txt", "target": "GITHUB_UPLOAD_RU.txt"},
  {"flat": "PHONE_SETUP_RU.txt", "target": "PHONE_SETUP_RU.txt"},
  {"flat": "PROJECT_MAP_RU.txt", "target": "PROJECT_MAP_RU.txt"},
  {"flat": "README_RU.txt", "target": "README_RU.txt"},
  {"flat": "apps_script__Admin.gs", "target": "apps_script/Admin.gs"},
  {"flat": "apps_script__Ads.gs", "target": "apps_script/Ads.gs"},
  {"flat": "apps_script__Code.gs", "target": "apps_script/Code.gs"},
  {"flat": "apps_script__Database.gs", "target": "apps_script/Database.gs"},
  {"flat": "apps_script__IssuesPayments.gs", "target": "apps_script/IssuesPayments.gs"},
  {"flat": "apps_script__appsscript.json", "target": "apps_script/appsscript.json"},
  {"flat": "docs__AUDIT_RU.txt", "target": "docs/AUDIT_RU.txt"},
  {"flat": "netlify__functions__api.js", "target": "netlify/functions/api.js"},
  {"flat": "netlify__functions__issue-ads.js", "target": "netlify/functions/issue-ads.js"},
  {"flat": "scripts__build-check.js", "target": "scripts/build-check.js"},
  {"flat": "site__ad-form.html", "target": "site/ad-form.html"},
  {"flat": "site__admin.html", "target": "site/admin.html"},
  {"flat": "site__free-issue.html", "target": "site/free-issue.html"},
  {"flat": "site__home.html", "target": "site/home.html"},
  {"flat": "site__index.html", "target": "site/index.html"},
  {"flat": "site__search-issue.html", "target": "site/search-issue.html"},
];
for (const item of files) {
  const source = path.join(root, item.flat);
  const target = path.join(root, item.target);
  if (!fs.existsSync(source)) throw new Error('Не найден файл комплекта: ' + item.flat);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (path.resolve(source) !== path.resolve(target)) fs.copyFileSync(source, target);
}
console.log('PROJECT STRUCTURE RESTORED: ' + files.length + ' files');
