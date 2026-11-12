function db_(){return SpreadsheetApp.openById(CFG.SPREADSHEET_ID);}
function setupProject(){ return setupProject_(); }
function setupProject_(){
  const props=PropertiesService.getScriptProperties();
  if(!props.getProperty('KUPI_API_SECRET')) throw new Error('Не задан KUPI_API_SECRET в Script Properties. Добавьте сохранённый ключ в настройках проекта Apps Script. Существующие данные не изменены.');
  const ss=db_();
  const expected=[
    [CFG.SHEETS.ads,CFG.AD_HEADERS],
    [CFG.SHEETS.categories,['category_id','category_ru','category_kk','category_type','parent_category_id','parent_ru','parent_kk','active','sort_order','source_form_value','aliases']],
    [CFG.SHEETS.kinds,['kind_id','kind_ru','kind_kk','active','sort_order','source_form_value','aliases']],
    [CFG.SHEETS.regions,['region_id','region_ru','region_kk','active','sort_order','source_form_value','aliases']],
    [CFG.SHEETS.cities,['city_id','city_ru','city_kk','active','sort_order','source_form_value','aliases']],
    [CFG.SHEETS.settings,['key','value','description']],
    [CFG.SHEETS.statuses,['status','status_ru','status_kk','description']]
  ];
  const problems=[];
  expected.forEach(([name,headers])=>{const sh=ss.getSheetByName(name);if(!sh){problems.push('Нет листа '+name);return;}if(sh.getLastColumn()<headers.length){problems.push('Не хватает столбцов: '+name);return;}const got=sh.getRange(1,1,1,headers.length).getDisplayValues()[0];if(headers.some((v,i)=>got[i]!==v))problems.push('Не совпадают заголовки: '+name);});
  if(problems.length)throw new Error('Таблица не изменена. Исправьте несоответствия:\n'+problems.join('\n'));
  Object.keys(CFG.SUPPORT).forEach(k=>ensureSupportSheet_(ss, k==='issues'?'Выпуски':k==='payments'?'Платежи':k==='feedback'?'Отзывы':'Разрешения', CFG.SUPPORT[k]));
  ss.setSpreadsheetTimeZone(CFG.TIMEZONE);
  if(!props.getProperty('KUPI_DRIVE_FOLDER_ID')){const folder=DriveApp.createFolder('Купи-Продай Казахстан — фотографии объявлений');props.setProperty('KUPI_DRIVE_FOLDER_ID',folder.getId());}
  props.setProperty('KUPI_DATABASE_ID',CFG.SPREADSHEET_ID);
  const triggerStatus=installWeeklyTrigger_();
  return {message:'Подключение выполнено. Исходные 7 листов проверены; служебные листы проверены/созданы; папка фото готова; расписание: '+triggerStatus+'.',spreadsheet_url:ss.getUrl(),drive_folder_id:props.getProperty('KUPI_DRIVE_FOLDER_ID'),weekly_trigger:triggerStatus};
}
function ensureSupportSheet_(ss,name,headers){let sh=ss.getSheetByName(name);if(!sh)sh=ss.insertSheet(name);if(sh.getLastRow()===0)sh.appendRow(headers);else{const got=sh.getRange(1,1,1,headers.length).getDisplayValues()[0];if(headers.some((x,i)=>got[i]!==x))throw new Error('Неверные заголовки служебного листа '+name);}sh.setFrozenRows(1);return sh;}
function installWeeklyTrigger_(){const existing=ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='scheduledIssue');if(!existing)ScriptApp.newTrigger('scheduledIssue').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(6).nearMinute(0).inTimezone(CFG.TIMEZONE).create();return existing?'Уже установлен':'Установлен';}
function scheduledIssue(){createIssue_(false);}
function sheet_(name){const s=db_().getSheetByName(name);if(!s)throw new Error('Не найден лист '+name);return s;}
function rows_(name){const s=sheet_(name);if(s.getLastRow()<2)return [];const v=s.getRange(1,1,s.getLastRow(),s.getLastColumn()).getValues();const h=v.shift();return v.filter(r=>r.some(x=>x!==''&&x!==null)).map(r=>{const o={};h.forEach((k,i)=>o[k]=r[i]);return o;});}
