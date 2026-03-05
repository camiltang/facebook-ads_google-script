/**
 * SnapchatReportBuilder.gs — Orchestrates Snapchat report generation.
 */

function runSnapchatReport(uiConfig) {
  try {
    var accounts = resolveGenericAccounts_(uiConfig);
    var startTime = toSnapTimestamp_(uiConfig.startDate);
    var endTime   = toSnapTimestamp_(uiConfig.endDate, true);
    var allRows = [];

    var sampleConfig = {
      level:       uiConfig.dataLevel || 'campaigns',
      fields:      uiConfig.selectedMetrics || ['impressions', 'spend'],
      granularity: uiConfig.granularity || 'DAY',
      startTime:   startTime,
      endTime:     endTime,
      breakdown:   (uiConfig.selectedDimensions && uiConfig.selectedDimensions[0]) || ''
    };
    var headers = buildSnapHeaders_(uiConfig, sampleConfig);
    if (accounts.length > 1) headers = ['Account Name'].concat(headers);

    accounts.forEach(function(acct) {
      var config = {
        accountId:   acct.id,
        level:       sampleConfig.level,
        fields:      sampleConfig.fields,
        granularity: sampleConfig.granularity,
        startTime:   startTime,
        endTime:     endTime,
        breakdown:   sampleConfig.breakdown
      };
      var rawStats = fetchSnapStats(config);
      if (rawStats && rawStats.length > 0) {
        var rows = flattenSnapRows_(rawStats, uiConfig, config);
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
    var sheetName = writeReportToSheet(headers, allRows, sheetLabel, dateLabel, 'Snapchat');

    return JSON.stringify({
      success: true, sheetName: sheetName, rowCount: allRows.length,
      message: 'Report created with ' + allRows.length + ' rows from ' + accounts.length + ' account(s).'
    });
  } catch (e) {
    return JSON.stringify({ success: false, message: e.message });
  }
}

function runSnapchatReportFromSidebar(uiConfigJson) {
  var uiConfig = JSON.parse(uiConfigJson);
  PropertiesService.getUserProperties().setProperty('LAST_SNAP_REPORT_CONFIG', uiConfigJson);
  return runSnapchatReport(uiConfig);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildSnapHeaders_(uiConfig, config) {
  var headers = [];
  if (config.granularity === 'DAY') headers.push('Date');
  if (config.breakdown) {
    var dim = findSnapDimension_(config.breakdown);
    headers.push(dim ? dim.label : config.breakdown);
  }
  headers.push('Entity ID');

  (uiConfig.selectedMetrics || []).forEach(function(m) {
    var entry = findSnapMetric_(m);
    headers.push(entry ? entry.label : m);
  });
  return headers;
}

function flattenSnapRows_(rawStats, uiConfig, config) {
  var rows = [];
  var metrics = uiConfig.selectedMetrics || [];

  rawStats.forEach(function(statWrapper) {
    var stat = statWrapper.timeseries_stat || statWrapper.total_stat || statWrapper;
    var entityId = stat.id || '';
    var timeseries = stat.timeseries || [];
    var breakdown = stat.dimension_value || '';

    if (config.granularity === 'TOTAL' || config.granularity === 'LIFETIME') {
      // Single row per entity
      var row = [];
      if (config.breakdown) row.push(breakdown);
      row.push(entityId);
      var totalStats = stat.stats || {};
      metrics.forEach(function(m) { row.push(totalStats[m] != null ? totalStats[m] : ''); });
      rows.push(row);
    } else {
      // One row per day
      timeseries.forEach(function(ts) {
        var row = [];
        row.push(ts.start_time ? ts.start_time.substring(0, 10) : '');
        if (config.breakdown) row.push(breakdown);
        row.push(entityId);
        var dayStats = ts.stats || {};
        metrics.forEach(function(m) { row.push(dayStats[m] != null ? dayStats[m] : ''); });
        rows.push(row);
      });
    }
  });

  return rows;
}

function toSnapTimestamp_(dateStr, endOfDay) {
  // Snap API requires ISO 8601 with timezone: 2024-01-15T00:00:00.000-08:00
  // Simplify to UTC
  if (!dateStr) return '';
  var time = endOfDay ? 'T23:59:59.000Z' : 'T00:00:00.000Z';
  return dateStr + time;
}

function findSnapMetric_(value) {
  for (var i = 0; i < SNAP_METRICS_CATALOG.length; i++) {
    if (SNAP_METRICS_CATALOG[i].value === value) return SNAP_METRICS_CATALOG[i];
  }
  return null;
}

function findSnapDimension_(value) {
  for (var i = 0; i < SNAP_DIMENSIONS.length; i++) {
    if (SNAP_DIMENSIONS[i].value === value) return SNAP_DIMENSIONS[i];
  }
  return null;
}
