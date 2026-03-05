/**
 * SheetWriter.gs — Creates new sheets and writes report data with formatting.
 * Shared by all platform report builders.
 */

// Header colors per platform
var PLATFORM_COLORS = {
  'Meta':     '#1877F2',
  'TikTok':   '#000000',
  'Snapchat': '#FFFC00',
  'Reddit':   '#FF4500',
  'Pinterest':'#E60023',
  'Merged':   '#6C3483'
};

/**
 * Writes report data to a new sheet in the active spreadsheet.
 * @param {string[]} headers     Column headers
 * @param {Array[]} rows         2D data array
 * @param {string} accountName   For naming the sheet
 * @param {string} dateLabel     For naming the sheet
 * @param {string} [platform]    Platform name (defaults to 'Meta')
 * @return {string} The created sheet name
 */
function writeReportToSheet(headers, rows, accountName, dateLabel, platform) {
  platform = platform || detectPlatformFromCaller_();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = buildSheetName_(accountName, dateLabel, platform);

  // If a sheet with this name exists, make it unique
  var existing = ss.getSheetByName(sheetName);
  if (existing) {
    var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HHmmss');
    sheetName = sheetName + ' ' + timestamp;
  }

  var sheet = ss.insertSheet(sheetName);

  // Write header row
  if (headers.length > 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  // Write data rows
  if (rows.length > 0 && rows[0].length > 0) {
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }

  // Format
  formatReportSheet_(sheet, headers.length, rows.length, platform);

  // Activate the new sheet
  ss.setActiveSheet(sheet);

  return sheetName;
}

// ── Formatting ──────────────────────────────────────────────────────────────

/**
 * Applies formatting to the report sheet.
 */
function formatReportSheet_(sheet, colCount, rowCount, platform) {
  if (colCount === 0) return;

  var headerColor = PLATFORM_COLORS[platform] || '#1877F2';
  var fontColor   = (platform === 'Snapchat') ? '#000000' : '#FFFFFF';

  var headerRange = sheet.getRange(1, 1, 1, colCount);
  headerRange
    .setBackground(headerColor)
    .setFontColor(fontColor)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  // Freeze header row
  sheet.setFrozenRows(1);

  // Auto-resize columns
  for (var c = 1; c <= colCount; c++) {
    sheet.autoResizeColumn(c);
  }

  // Alternate row colors for data
  if (rowCount > 0) {
    var dataRange = sheet.getRange(2, 1, rowCount, colCount);
    dataRange.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY);
  }

  // Add filter
  if (rowCount > 0) {
    sheet.getRange(1, 1, rowCount + 1, colCount).createFilter();
  }
}

/**
 * Builds a human-readable sheet name.
 */
function buildSheetName_(accountName, dateLabel, platform) {
  var prefix = platform || 'Meta';
  var name = (accountName || 'Report').substring(0, 20);
  var dateStr = dateLabel || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var sheetName = prefix + ' - ' + name + ' - ' + dateStr;
  return sheetName.substring(0, 100);
}

/**
 * Detects which platform is calling based on the call stack.
 * Fallback heuristic — callers should pass platform explicitly when possible.
 */
function detectPlatformFromCaller_() {
  try {
    throw new Error();
  } catch (e) {
    if (e.stack && e.stack.indexOf('TikTok') > -1) return 'TikTok';
  }
  return 'Meta';
}

// ── Multi-account helpers (shared) ──────────────────────────────────────────

/**
 * Resolves account list from uiConfig for Snapchat/Reddit/Pinterest.
 * Supports single (accountId) or multiple (accountIds[]) accounts.
 */
function resolveGenericAccounts_(uiConfig) {
  if (uiConfig.accountIds && uiConfig.accountIds.length > 0) {
    var accountsMap = {};
    (uiConfig.accounts || []).forEach(function(a) { accountsMap[a.id] = a.name; });
    return uiConfig.accountIds.map(function(id) {
      return { id: id, name: accountsMap[id] || id };
    });
  }
  return [{ id: uiConfig.accountId, name: uiConfig.accountName || 'Report' }];
}
