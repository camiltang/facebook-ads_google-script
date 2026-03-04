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
    .addItem('Run Last Report', 'rerunLastReport')
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
    .setWidth(320);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Re-runs the last report configuration (stored in user properties).
 */
function rerunLastReport() {
  var props = PropertiesService.getUserProperties();
  var lastConfig = props.getProperty('LAST_REPORT_CONFIG');
  if (!lastConfig) {
    SpreadsheetApp.getUi().alert('No previous report found. Use the sidebar to configure a report.');
    return;
  }
  var result = JSON.parse(runReport(JSON.parse(lastConfig)));
  SpreadsheetApp.getUi().alert(result.message);
}

/**
 * Called from the sidebar to run a report and store the config for re-runs.
 */
function runReportFromSidebar(uiConfigJson) {
  var uiConfig = JSON.parse(uiConfigJson);
  // Store for re-run
  PropertiesService.getUserProperties().setProperty('LAST_REPORT_CONFIG', uiConfigJson);
  return runReport(uiConfig);
}
