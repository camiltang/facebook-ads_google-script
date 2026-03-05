/**
 * RedditReportBuilder.gs — Orchestrates Reddit Ads report generation.
 */

function runRedditReport(uiConfig) {
  try {
    var accounts = resolveGenericAccounts_(uiConfig);
    var allRows = [];

    var sampleConfig = {
      level:       uiConfig.dataLevel || 'campaign',
      metrics:     uiConfig.selectedMetrics || ['impressions', 'spend', 'clicks'],
      startDate:   uiConfig.startDate,
      endDate:     uiConfig.endDate,
      granularity: uiConfig.granularity || 'DAY',
      breakdown:   (uiConfig.selectedDimensions && uiConfig.selectedDimensions[0]) || ''
    };
    var headers = buildRedditHeaders_(uiConfig, sampleConfig);
    if (accounts.length > 1) headers = ['Account Name'].concat(headers);

    accounts.forEach(function(acct) {
      var config = {
        accountId:   acct.id,
        level:       sampleConfig.level,
        metrics:     sampleConfig.metrics,
        startDate:   sampleConfig.startDate,
        endDate:     sampleConfig.endDate,
        granularity: sampleConfig.granularity,
        breakdown:   sampleConfig.breakdown
      };
      var rawRows = fetchRedditReport(config);
      if (rawRows && rawRows.length > 0) {
        var rows = flattenRedditRows_(rawRows, uiConfig, config);
        if (accounts.length > 1) {
          rows = rows.map(function(row) { return [acct.name].concat(row); });
        }
        allRows = allRows.concat(rows);
      }
    });

    if (allRows.length === 0) {
      return JSON.stringify({ success: true, sheetName: null, rowCount: 0,
        message: 'No data returned for the selected criteria.' });
    }

    var dateLabel = uiConfig.startDate + ' to ' + uiConfig.endDate;
    var sheetLabel = accounts.length > 1 ? (accounts.length + ' accounts') : accounts[0].name;
    var sheetName = writeReportToSheet(headers, allRows, sheetLabel, dateLabel, 'Reddit');

    return JSON.stringify({
      success: true, sheetName: sheetName, rowCount: allRows.length,
      message: 'Report created with ' + allRows.length + ' rows from ' + accounts.length + ' account(s).'
    });
  } catch (e) {
    return JSON.stringify({ success: false, message: e.message });
  }
}

function runRedditReportFromSidebar(uiConfigJson) {
  var uiConfig = JSON.parse(uiConfigJson);
  PropertiesService.getUserProperties().setProperty('LAST_REDDIT_REPORT_CONFIG', uiConfigJson);
  return runRedditReport(uiConfig);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildRedditHeaders_(uiConfig, config) {
  var headers = [];
  if (config.granularity === 'DAY') headers.push('Date');
  if (config.breakdown) {
    var dim = findRedditDimension_(config.breakdown);
    headers.push(dim ? dim.label : config.breakdown);
  }
  // Entity ID columns based on level
  headers.push(capitalizeFirst_(config.level) + ' ID');

  (uiConfig.selectedMetrics || []).forEach(function(m) {
    var entry = findRedditMetric_(m);
    headers.push(entry ? entry.label : m);
  });
  return headers;
}

function flattenRedditRows_(rawRows, uiConfig, config) {
  var rows = [];
  var metrics = uiConfig.selectedMetrics || [];

  rawRows.forEach(function(row) {
    var cells = [];
    if (config.granularity === 'DAY' && row.date) {
      cells.push(row.date);
    }
    if (config.breakdown && row.breakdown_value) {
      cells.push(row.breakdown_value);
    }
    cells.push(row.id || row.campaign_id || row.adgroup_id || row.ad_id || '');

    metrics.forEach(function(m) {
      cells.push(row[m] != null ? row[m] : '');
    });

    rows.push(cells);
  });

  return rows;
}

function findRedditMetric_(value) {
  for (var i = 0; i < REDDIT_METRICS_CATALOG.length; i++) {
    if (REDDIT_METRICS_CATALOG[i].value === value) return REDDIT_METRICS_CATALOG[i];
  }
  return null;
}

function findRedditDimension_(value) {
  for (var i = 0; i < REDDIT_DIMENSIONS.length; i++) {
    if (REDDIT_DIMENSIONS[i].value === value) return REDDIT_DIMENSIONS[i];
  }
  return null;
}

function capitalizeFirst_(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
