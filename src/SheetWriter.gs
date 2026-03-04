/**
 * SheetWriter.gs — Creates new sheets and writes report data with formatting.
 */

/**
 * Writes report data to a new sheet in the active spreadsheet.
 * @param {string[]} headers  Column headers
 * @param {Array[]} rows      2D data array
 * @param {string} accountName  For naming the sheet
 * @param {string} dateLabel    For naming the sheet
 * @return {string} The created sheet name
 */
function writeReportToSheet(headers, rows, accountName, dateLabel) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = buildSheetName_(accountName, dateLabel);

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
  formatReportSheet_(sheet, headers.length, rows.length);

  // Activate the new sheet
  ss.setActiveSheet(sheet);

  return sheetName;
}

// ── Formatting ──────────────────────────────────────────────────────────────

/**
 * Applies formatting to the report sheet.
 */
function formatReportSheet_(sheet, colCount, rowCount) {
  if (colCount === 0) return;

  var headerRange = sheet.getRange(1, 1, 1, colCount);

  // Header style
  headerRange
    .setBackground('#1877F2')
    .setFontColor('#FFFFFF')
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
function buildSheetName_(accountName, dateLabel) {
  var name = (accountName || 'Report').substring(0, 20);
  var dateStr = dateLabel || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var sheetName = 'Meta - ' + name + ' - ' + dateStr;
  // Sheet names max 100 chars
  return sheetName.substring(0, 100);
}
