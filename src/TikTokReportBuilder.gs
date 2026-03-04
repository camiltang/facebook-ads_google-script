/**
 * TikTokReportBuilder.gs — Orchestrates TikTok report generation:
 * builds API config, flattens response, delegates to SheetWriter.
 */

/**
 * Main entry: runs a TikTok report from sidebar config.
 * @param {Object} uiConfig {
 *   advertiserId, advertiserName, dataLevel,
 *   startDate, endDate, selectedMetrics[], selectedDimensions[]
 * }
 * @return {string} JSON { success, sheetName, rowCount, message }
 */
function runTikTokReport(uiConfig) {
  try {
    var config = buildTikTokApiConfig_(uiConfig);
    var rawRows = fetchTikTokReport(config);

    if (!rawRows || rawRows.length === 0) {
      return JSON.stringify({ success: true, sheetName: null, rowCount: 0,
        message: 'No data returned for the selected criteria.' });
    }

    var headers = buildTikTokHeaders_(uiConfig);
    var rows    = flattenTikTokRows_(rawRows, uiConfig);
    var sheetName = writeReportToSheet(headers, rows, uiConfig.advertiserName, uiConfig.startDate + ' to ' + uiConfig.endDate, 'TikTok');

    return JSON.stringify({
      success: true,
      sheetName: sheetName,
      rowCount: rows.length,
      message: 'Report created with ' + rows.length + ' rows.'
    });
  } catch (e) {
    return JSON.stringify({ success: false, message: e.message });
  }
}

/**
 * Step A for scheduled async TikTok reports.
 */
function scheduledTikTokRequestReport(configJson) {
  var uiConfig = JSON.parse(configJson);
  var config   = buildTikTokApiConfig_(uiConfig);
  var taskId   = createTikTokAsyncReport(config);

  var props = PropertiesService.getUserProperties();
  var pending = JSON.parse(props.getProperty('PENDING_TIKTOK_REPORTS') || '{}');
  pending[taskId] = configJson;
  props.setProperty('PENDING_TIKTOK_REPORTS', JSON.stringify(pending));

  Logger.log('TikTok async report requested: ' + taskId);
  return taskId;
}

/**
 * Step B for scheduled async TikTok reports.
 */
function scheduledTikTokImportReport() {
  var props   = PropertiesService.getUserProperties();
  var pending = JSON.parse(props.getProperty('PENDING_TIKTOK_REPORTS') || '{}');
  var taskIds = Object.keys(pending);

  if (taskIds.length === 0) {
    Logger.log('No pending TikTok async reports.');
    return;
  }

  taskIds.forEach(function(taskId) {
    try {
      var uiConfig = JSON.parse(pending[taskId]);
      var status = checkTikTokAsyncStatus(taskId, uiConfig.advertiserId);

      if (status.status === 'COMPLETED' || status.status === 'SUCCESS') {
        // For async, re-fetch using sync endpoint with same params
        // (TikTok async tasks produce downloadable files, but sync is simpler here)
        var config  = buildTikTokApiConfig_(uiConfig);
        var rawRows = fetchTikTokReport(config);
        var headers = buildTikTokHeaders_(uiConfig);
        var rows    = flattenTikTokRows_(rawRows, uiConfig);

        if (rows.length > 0) {
          writeReportToSheet(headers, rows, uiConfig.advertiserName, uiConfig.startDate, 'TikTok');
        }
        delete pending[taskId];
        Logger.log('TikTok report imported: ' + taskId + ' (' + rows.length + ' rows)');
      } else if (status.status === 'FAILED') {
        Logger.log('TikTok async report failed: ' + taskId);
        delete pending[taskId];
      } else {
        Logger.log('TikTok report ' + taskId + ' still processing.');
      }
    } catch (e) {
      Logger.log('Error importing TikTok report ' + taskId + ': ' + e.message);
    }
  });

  props.setProperty('PENDING_TIKTOK_REPORTS', JSON.stringify(pending));
}

/**
 * Called from sidebar to run and store config for re-runs.
 */
function runTikTokReportFromSidebar(uiConfigJson) {
  var uiConfig = JSON.parse(uiConfigJson);
  PropertiesService.getUserProperties().setProperty('LAST_TIKTOK_REPORT_CONFIG', uiConfigJson);
  return runTikTokReport(uiConfig);
}

// ── Private helpers ─────────────────────────────────────────────────────────

function buildTikTokApiConfig_(uiConfig) {
  // Separate dimension values from metric values
  var dimensions = (uiConfig.selectedDimensions || ['stat_time_day']).slice();
  var metrics    = [];

  // Auto-add the ID dimension matching the data level
  var levelDimMap = {
    'AUCTION_CAMPAIGN':   'campaign_id',
    'AUCTION_ADGROUP':    'adgroup_id',
    'AUCTION_AD':         'ad_id',
    'AUCTION_ADVERTISER': 'advertiser_id'
  };
  var idDim = levelDimMap[uiConfig.dataLevel || 'AUCTION_CAMPAIGN'];
  if (idDim && dimensions.indexOf(idDim) === -1) {
    dimensions.push(idDim);
  }

  (uiConfig.selectedMetrics || []).forEach(function(m) {
    metrics.push(m);
  });

  return {
    advertiserId: uiConfig.advertiserId,
    dataLevel:    uiConfig.dataLevel   || 'AUCTION_CAMPAIGN',
    reportType:   'BASIC',
    dimensions:   dimensions,
    metrics:      metrics,
    startDate:    uiConfig.startDate,
    endDate:      uiConfig.endDate
  };
}

function buildTikTokHeaders_(uiConfig) {
  var headers = [];

  // Dimension headers
  (uiConfig.selectedDimensions || ['stat_time_day']).forEach(function(dimValue) {
    var entry = findTikTokDimension_(dimValue);
    headers.push(entry ? entry.label : dimValue);
  });

  // Auto-added ID dimension
  var levelDimMap = {
    'AUCTION_CAMPAIGN':   'campaign_id',
    'AUCTION_ADGROUP':    'adgroup_id',
    'AUCTION_AD':         'ad_id',
    'AUCTION_ADVERTISER': 'advertiser_id'
  };
  var idDim = levelDimMap[uiConfig.dataLevel || 'AUCTION_CAMPAIGN'];
  var selectedDims = uiConfig.selectedDimensions || ['stat_time_day'];
  if (idDim && selectedDims.indexOf(idDim) === -1) {
    var entry = findTikTokDimension_(idDim);
    headers.push(entry ? entry.label : idDim);
  }

  // Metric headers
  (uiConfig.selectedMetrics || []).forEach(function(metricValue) {
    var entry = findTikTokMetric_(metricValue);
    headers.push(entry ? entry.label : metricValue);
  });

  return headers;
}

function flattenTikTokRows_(rawRows, uiConfig) {
  var selectedDims = (uiConfig.selectedDimensions || ['stat_time_day']).slice();

  var levelDimMap = {
    'AUCTION_CAMPAIGN':   'campaign_id',
    'AUCTION_ADGROUP':    'adgroup_id',
    'AUCTION_AD':         'ad_id',
    'AUCTION_ADVERTISER': 'advertiser_id'
  };
  var idDim = levelDimMap[uiConfig.dataLevel || 'AUCTION_CAMPAIGN'];
  if (idDim && selectedDims.indexOf(idDim) === -1) {
    selectedDims.push(idDim);
  }

  var selectedMetrics = uiConfig.selectedMetrics || [];

  return rawRows.map(function(row) {
    var cells = [];
    var dims    = row.dimensions || {};
    var metrics = row.metrics || {};

    // Dimension values
    selectedDims.forEach(function(d) {
      cells.push(dims[d] != null ? dims[d] : '');
    });

    // Metric values
    selectedMetrics.forEach(function(m) {
      cells.push(metrics[m] != null ? metrics[m] : '');
    });

    return cells;
  });
}

function findTikTokMetric_(value) {
  for (var i = 0; i < TIKTOK_METRICS_CATALOG.length; i++) {
    if (TIKTOK_METRICS_CATALOG[i].value === value) return TIKTOK_METRICS_CATALOG[i];
  }
  return null;
}

function findTikTokDimension_(value) {
  for (var i = 0; i < TIKTOK_DIMENSIONS.length; i++) {
    if (TIKTOK_DIMENSIONS[i].value === value) return TIKTOK_DIMENSIONS[i];
  }
  return null;
}
