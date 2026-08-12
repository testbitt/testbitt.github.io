/**
 * Kamu Kamu Standard Libary (KSL) V3.4 - Google Sheets backend
 * Supports: Quiz Results (50 questions), Holding Time, Production Recipes, Beverage Recipes.
 */
const CONFIG = {
  RESULTS_SHEET: 'Results',
  HOLDING_SHEET: 'HoldingTime',
  PRODUCTION_SHEET: 'ProductionRecipes',
  DRINK_SHEET: 'BeverageRecipes',
  LOG_SHEET: 'SyncLog',
  SHARED_KEY: ''
};

const HOLDING_HEADERS = ['ลำดับ','ชื่อวัตถุดิบ','สถานะ','อายุการจัดเก็บ','อุณหภูมิ/สถานที่จัดเก็บ','อุปกรณ์ที่จัดเก็บ','ลักษณะตามมาตรฐาน','หมายเหตุ','Synced At'];
const PRODUCTION_HEADERS = ['page','recipe_name_th','recipe_name_en','variant','ingredients','temperature_c','boil_time_min','soak_time_min','yield_amount','yield_unit','serving_info','shelf_life','storage_condition','method','notes','Synced At'];
const DRINK_HEADERS = ['Category','Menu','Variant','Step_No','Component_Type','Ingredient','Quantity','Unit','Price_Baht','Instructions','Notes','Source_Page','Synced At'];
const RESULT_HEADERS = ['Timestamp','Employee ID','Name','Branch','Position','Course Scope','Score','Total','Percent','Passed','Pass Score','Duration Sec','Certificate ID','App'];

function setupSheets() {
  const ss = SpreadsheetApp.getActive();
  ensureSheet_(ss, CONFIG.RESULTS_SHEET, RESULT_HEADERS);
  ensureSheet_(ss, CONFIG.HOLDING_SHEET, HOLDING_HEADERS);
  ensureSheet_(ss, CONFIG.PRODUCTION_SHEET, PRODUCTION_HEADERS);
  ensureSheet_(ss, CONFIG.DRINK_SHEET, DRINK_HEADERS);
  ensureSheet_(ss, CONFIG.LOG_SHEET, ['Timestamp','Action','Rows','Status','Message']);
  return 'Kamu Kamu Standard Libary Google Sheets backend ready';
}

function doGet() {
  return json_({ok:true,app:'KSL-V3.4',time:new Date().toISOString()});
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    setupSheets();
    const body = parseBody_(e);
    verifyKey_(body.key || '');
    const action = String(body.action || '');
    if (action === 'saveResult') return json_(saveResult_(body.result || {}));
    if (action === 'syncHoldingTime') return json_(replaceSheet_(CONFIG.HOLDING_SHEET, HOLDING_HEADERS, body.rows || [], body.updatedAt || '', 'syncHoldingTime'));
    if (action === 'syncProductionRecipes') return json_(replaceSheet_(CONFIG.PRODUCTION_SHEET, PRODUCTION_HEADERS, body.rows || [], body.updatedAt || '', 'syncProductionRecipes'));
    if (action === 'syncDrinkRecipes') return json_(replaceSheet_(CONFIG.DRINK_SHEET, DRINK_HEADERS, body.rows || [], body.updatedAt || '', 'syncDrinkRecipes'));
    throw new Error('Unknown action: ' + action);
  } catch (err) {
    log_('error',0,'ERROR',String(err && err.message || err));
    return json_({ok:false,error:String(err && err.message || err)});
  } finally {
    lock.releaseLock();
  }
}

function saveResult_(r) {
  const sh = SpreadsheetApp.getActive().getSheetByName(CONFIG.RESULTS_SHEET);
  sh.appendRow([
    r.when || new Date().toISOString(),
    safe_(r.employeeId), safe_(r.name), safe_(r.branch), safe_(r.position),
    safe_(r.courseScope || 'all'),
    Number(r.score || 0), Number(r.total || 50), Number(r.pct || 0), r.passed === true,
    Number(r.passScore || 80), Number(r.durationSec || 0), safe_(r.id), 'KSL-V3.4'
  ]);
  log_('saveResult',1,'OK',safe_(r.id));
  return {ok:true,action:'saveResult'};
}

function replaceSheet_(sheetName, headers, rows, updatedAt, action) {
  if (!Array.isArray(rows)) throw new Error('rows must be an array');
  const sh = SpreadsheetApp.getActive().getSheetByName(sheetName);
  sh.clearContents();
  sh.getRange(1,1,1,headers.length).setValues([headers]);
  sh.setFrozenRows(1);
  sh.getRange(1,1,1,headers.length).setFontWeight('bold');
  const dataHeaders = headers.slice(0,-1);
  if (rows.length) {
    const stamp = updatedAt || new Date().toISOString();
    const values = rows.map(r => dataHeaders.map(h => safe_(r[h])).concat(stamp));
    sh.getRange(2,1,values.length,headers.length).setValues(values);
  }
  log_(action,rows.length,'OK',updatedAt || '');
  return {ok:true,action:action,rows:rows.length};
}

function ensureSheet_(ss,name,headers){
  let sh=ss.getSheetByName(name);
  if(!sh) sh=ss.insertSheet(name);
  if(sh.getLastRow()===0){
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    sh.setFrozenRows(1);
    sh.getRange(1,1,1,headers.length).setFontWeight('bold');
  }
  return sh;
}

function parseBody_(e){
  const raw=e&&e.postData&&e.postData.contents?e.postData.contents:(e&&e.parameter&&e.parameter.payload?e.parameter.payload:'{}');
  try{return JSON.parse(raw)}catch(_){throw new Error('Invalid JSON payload')}
}
function verifyKey_(key){if(CONFIG.SHARED_KEY && String(key)!==String(CONFIG.SHARED_KEY)) throw new Error('Invalid Sync Key')}
function safe_(v){return v===null||v===undefined?'':String(v)}
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)}
function log_(action,rows,status,message){const sh=SpreadsheetApp.getActive().getSheetByName(CONFIG.LOG_SHEET);if(sh)sh.appendRow([new Date().toISOString(),action,rows,status,message])}
