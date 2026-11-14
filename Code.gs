/** КУПИ-ПРОДАЙ — КАЗАХСТАН | API gateway v2.5. */

const CFG = {
  SPREADSHEET_ID: '105prY1F1rOHPGdI2fqthkCAAqNKc6G79',
  ADMIN_EMAIL: 'veelts139@gmail.com',
  TIMEZONE: 'Asia/Almaty',
  PRICE_KZT: 500,
  MAX_PHOTOS: 5,
  MAX_PHOTO_BYTES: 5 * 1024 * 1024,
  AD_HEADERS: ['ad_id','created_at','updated_at','status','issue_id','contact_name','phone','whatsapp','kind_id','kind','kind_ru','kind_kk','category_id','category','category_ru','category_kk','category_type','parent_category_id','title','description','price','price_condition','currency','region_id','region','region_ru','region_kk','city_id','city','city_ru','city_kk','district','language_submitted','consent','consent_at','photo_count','photo_urls','moderator_note','moderated_by','moderated_at','published_at','rejection_reason','source','duplicate_key','contract_version'],
  SHEETS: {ads:'Объявления',categories:'Справочник категорий',kinds:'Справочник типов',regions:'Справочник регионов',cities:'Справочник городов',settings:'Настройки',statuses:'Справочник статусов'},
  SUPPORT: {issues:['issue_id','issue_number','issue_date','published_at','status','ad_count','promo_count','promo_visible','created_at'],payments:['request_id','created_at','issue_id','issue_number','buyer_name','buyer_email','buyer_phone','amount','status','payment_reference','admin_note','access_token','access_expires_at','granted_at'],feedback:['feedback_id','created_at','name','contact','kind','message','status'],permissions:['ad_id','contact_publication_consent','recorded_at']}
};
function doGet(){return ContentService.createTextOutput(JSON.stringify({ok:true,service:'Kupi-Prodai Kazakhstan API',version:'2.5',health:'ok'})).setMimeType(ContentService.MimeType.JSON);}
function doPost(e){try{const body=JSON.parse((e&&e.postData&&e.postData.contents)||'{}');assertSharedSecret_(body.secret);const result=route_(body.action,body.payload||{});return ContentService.createTextOutput(JSON.stringify({ok:true,data:result})).setMimeType(ContentService.MimeType.JSON);}catch(err){return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(err&&err.message||err)})).setMimeType(ContentService.MimeType.JSON);}}
function assertSharedSecret_(secret){const expected=PropertiesService.getScriptProperties().getProperty('KUPI_API_SECRET');if(!expected||!secret||!constantTimeEqual_(String(secret),String(expected)))throw new Error('API access denied. Проверьте серверные настройки.');}
function constantTimeEqual_(a,b){if(a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0;}
function route_(action,p){switch(action){case 'setup':return setupProject_();case 'formData':return getFormData_();case 'submitAd':return submitAd_(p);case 'uploadPhoto':return {url:uploadPhoto_(p.file)};case 'searchAds':return searchAds_(p);case 'currentIssue':return currentIssue_();case 'issueAds':return issueAds_(p);case 'purchaseRequest':return purchaseRequest_(p);case 'feedback':return saveFeedback_(p);case 'adminStart':return adminStart_(p);case 'adminVerify':return adminVerify_(p);case 'adminDashboard':requireAdmin_(p.session);return adminDashboard_();case 'adminDecision':requireAdmin_(p.session);return adminDecision_(p);case 'adminGrant':requireAdmin_(p.session);return adminGrant_(p);case 'adminCreateIssue':requireAdmin_(p.session);return createIssue_(true);case 'adminLogout':CacheService.getScriptCache().remove('ADM_'+String(p.session||''));return {logged_out:true};default:throw new Error('Неизвестная операция: '+action);}}
function authorizeEmailService(){MailApp.getRemainingDailyQuota();return 'Почтовый сервис авторизован.';}
