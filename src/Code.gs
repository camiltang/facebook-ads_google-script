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
    .addItem('Re-run Last Snapchat Report', 'rerunLastSnapReport')
    .addItem('Re-run Last Reddit Report', 'rerunLastRedditReport')
    .addItem('Re-run Last Pinterest Report', 'rerunLastPinterestReport')
    .addSeparator()
    .addItem('Merge Cross-Platform Data', 'showSidebar')
    .addToUi();
}

function onInstall(e) { onOpen(e); }
function onHomepage(e) { showSidebar(); }

function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('ui/Sidebar')
    .setTitle('Social Ads Reporter')
    .setWidth(340);
  SpreadsheetApp.getUi().showSidebar(html);
}

// ── Re-run shortcuts ────────────────────────────────────────────────────────

function rerunLastMetaReport() {
  rerunReport_('LAST_REPORT_CONFIG', 'Meta', runReport);
}
function rerunLastTikTokReport() {
  rerunReport_('LAST_TIKTOK_REPORT_CONFIG', 'TikTok', runTikTokReport);
}
function rerunLastSnapReport() {
  rerunReport_('LAST_SNAP_REPORT_CONFIG', 'Snapchat', runSnapchatReport);
}
function rerunLastRedditReport() {
  rerunReport_('LAST_REDDIT_REPORT_CONFIG', 'Reddit', runRedditReport);
}
function rerunLastPinterestReport() {
  rerunReport_('LAST_PINTEREST_REPORT_CONFIG', 'Pinterest', runPinterestReport);
}

function rerunReport_(propKey, platformName, reportFn) {
  var lastConfig = PropertiesService.getUserProperties().getProperty(propKey);
  if (!lastConfig) {
    SpreadsheetApp.getUi().alert('No previous ' + platformName + ' report found. Use the sidebar to configure one.');
    return;
  }
  var result = JSON.parse(reportFn(JSON.parse(lastConfig)));
  SpreadsheetApp.getUi().alert(result.message);
}

// ── Sidebar entry points ────────────────────────────────────────────────────

function runReportFromSidebar(uiConfigJson) {
  var uiConfig = JSON.parse(uiConfigJson);
  PropertiesService.getUserProperties().setProperty('LAST_REPORT_CONFIG', uiConfigJson);
  return runReport(uiConfig);
}
