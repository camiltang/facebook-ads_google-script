/**
 * Code.gs — Entry point for the Social Ads Reporter Google Sheets Add-On.
 * Provides menu creation and sidebar launching.
 */

/**
 * Runs when the spreadsheet is opened. Creates the add-on menu.
 */
function onOpen(e) {
  SpreadsheetApp.getUi()
    .createAddonMenu()
    .addItem('Open Sidebar', 'showSidebar')
    .addSeparator()
    .addItem('Re-run Last Meta Report', 'rerunLastMetaReport')
    .addItem('Re-run Last TikTok Report', 'rerunLastTikTokReport')
    .addToUi();
}

/**
 * Runs when the add-on is installed.
 */
function onInstall(e) {
  onOpen(e);
}

/**
 * Add-on homepage trigger (for card-based add-ons).
 */
function onHomepage(e) {
  showSidebar();
}

/**
 * Opens the main sidebar UI.
 */
function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('ui/Sidebar')
    .setTitle('Social Ads Reporter')
    .setWidth(340);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Re-runs the last Meta report.
 */
function rerunLastMetaReport() {
  var props = PropertiesService.getUserProperties();
  var lastConfig = props.getProperty('LAST_REPORT_CONFIG');
  if (!lastConfig) {
    SpreadsheetApp.getUi().alert('No previous Meta report found. Use the sidebar to configure one.');
    return;
  }
  var result = JSON.parse(runReport(JSON.parse(lastConfig)));
  SpreadsheetApp.getUi().alert(result.message);
}

/**
 * Re-runs the last TikTok report.
 */
function rerunLastTikTokReport() {
  var props = PropertiesService.getUserProperties();
  var lastConfig = props.getProperty('LAST_TIKTOK_REPORT_CONFIG');
  if (!lastConfig) {
    SpreadsheetApp.getUi().alert('No previous TikTok report found. Use the sidebar to configure one.');
    return;
  }
  var result = JSON.parse(runTikTokReport(JSON.parse(lastConfig)));
  SpreadsheetApp.getUi().alert(result.message);
}

/**
 * Called from the sidebar to run a Meta report and store config for re-runs.
 */
function runReportFromSidebar(uiConfigJson) {
  var uiConfig = JSON.parse(uiConfigJson);
  PropertiesService.getUserProperties().setProperty('LAST_REPORT_CONFIG', uiConfigJson);
  return runReport(uiConfig);
}
