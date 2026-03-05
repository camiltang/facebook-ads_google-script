/**
 * PinterestReportBuilder.gs — Orchestrates Pinterest Ads report generation.
 */

function runPinterestReport(uiConfig) {
  try {
    var accounts = resolveGenericAccounts_(uiConfig);
    var allRows = [];

    var sampleConfig = {
      level:       uiConfig.dataLevel || 'CAMPAIGN',
      columns:     uiConfig.selectedMetrics || ['SPEND_IN_DOLLAR', 'PAID_IMPRESSION', 'TOTAL_CLICKTHROUGH'],
      startDate:   uiConfig.startDate,
      endDate:     uiConfig.endDate,
      granularity: uiConfig.granularity || 'DAY'
    };
    var headers = buildPinterestHeaders_(uiConfig, sampleConfig);
    if (accounts.length > 1) headers = ['Account Name'].concat(headers);

    accounts.forEach(function(acct) {
      var config = {
        accountId:   acct.id,
        level:       sampleConfig.level,
        columns:     sampleConfig.columns,
        startDate:   sampleConfig.startDate,
        endDate:     sampleConfig.endDate,
        granularity: sampleConfig.granularity
      };
      var rawRows = fetchPinterestAnalytics(config);
      if (rawRows && rawRows.length > 0) {
        var rows = flattenPinterestRows_(rawRows, uiConfig, config);
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
    var sheetName = writeReportToSheet(headers, allRows, sheetLabel, dateLabel, 'Pinterest');

    return JSON.stringify({
      success: true, sheetName: sheetName, rowCount: allRows.length,
      message: 'Report created with ' + allRows.length + ' rows from ' + accounts.length + ' account(s).'
    });
  } catch (e) {
    return JSON.stringify({ success: false, message: e.message });
  }
}

function runPinterestReportFromSidebar(uiConfigJson) {
  var uiConfig = JSON.parse(uiConfigJson);
  PropertiesService.getUserProperties().setProperty('LAST_PINTEREST_REPORT_CONFIG', uiConfigJson);
  return runPinterestReport(uiConfig);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildPinterestHeaders_(uiConfig, config) {
  var headers = [];
  if (config.granularity === 'DAY') headers.push('Date');

  // Add entity ID column
  var levelLabel = config.level === 'CAMPAIGN' ? 'Campaign' :
                   config.level === 'AD_GROUP' ? 'Ad Group' : 'Ad';
  headers.push(levelLabel + ' ID');

  (uiConfig.selectedMetrics || []).forEach(function(m) {
    var entry = findPinterestMetric_(m);
    headers.push(entry ? entry.label : m);
  });
  return headers;
}

function flattenPinterestRows_(rawRows, uiConfig, config) {
  var rows = [];
  var metrics = uiConfig.selectedMetrics || [];

  rawRows.forEach(function(entity) {
    // Pinterest returns { AD_ID/CAMPAIGN_ID: "123", DATE: "2024-01-15", metric1: val, ... }
    // or for TOTAL granularity, a single object per entity
    if (Array.isArray(entity)) {
      // Nested array (entity -> daily rows)
      entity.forEach(function(row) {
        rows.push(buildPinterestRow_(row, metrics, config));
      });
    } else {
      rows.push(buildPinterestRow_(entity, metrics, config));
    }
  });

  return rows;
}

function buildPinterestRow_(row, metrics, config) {
  var cells = [];
  if (config.granularity === 'DAY') {
    cells.push(row.DATE || '');
  }

  // Entity ID
  var entityId = row.CAMPAIGN_ID || row.AD_GROUP_ID || row.AD_ID || row.PIN_PROMOTION_ID || '';
  cells.push(entityId);

  metrics.forEach(function(m) {
    cells.push(row[m] != null ? row[m] : '');
  });

  return cells;
}

function findPinterestMetric_(value) {
  for (var i = 0; i < PINTEREST_METRICS_CATALOG.length; i++) {
    if (PINTEREST_METRICS_CATALOG[i].value === value) return PINTEREST_METRICS_CATALOG[i];
  }
  return null;
}
