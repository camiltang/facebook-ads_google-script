/**
 * ReportBuilder.gs — Orchestrates report generation: builds config,
 * determines sync vs async, flattens API response into tabular data.
 */

/**
 * Main entry: runs a report from sidebar-provided config and writes to a new sheet.
 * Supports single account (accountId) or multiple accounts (accountIds[]).
 * @param {Object} uiConfig {
 *   accountId|accountIds[], accountName|accounts[], level, datePreset, since, until,
 *   timeIncrement, selectedMetrics[], selectedBreakdowns[]
 * }
 * @return {string} JSON { success, sheetName, rowCount, message }
 */
function runReport(uiConfig) {
  try {
    var accounts = resolveMetaAccounts_(uiConfig);
    var allRows = [];
    var headers = buildHeaders_(uiConfig);

    // Prepend "Account Name" header when pulling multiple accounts
    if (accounts.length > 1) {
      headers = ['Account Name'].concat(headers);
    }

    accounts.forEach(function(acct) {
      var singleConfig = copyObj_(uiConfig);
      singleConfig.accountId = acct.id;
      singleConfig.accountName = acct.name;

      var apiConfig = buildApiConfig_(singleConfig);
      var rawRows = fetchInsightsSync(apiConfig);
      if (rawRows && rawRows.length > 0) {
        var rows = flattenRows_(rawRows, singleConfig);
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

    var dateLabel = uiConfig.datePreset || (uiConfig.since + ' to ' + uiConfig.until);
    var sheetLabel = accounts.length > 1 ? (accounts.length + ' accounts') : accounts[0].name;
    var sheetName = writeReportToSheet(headers, allRows, sheetLabel, dateLabel);

    return JSON.stringify({
      success: true,
      sheetName: sheetName,
      rowCount: allRows.length,
      message: 'Report created with ' + allRows.length + ' rows from ' + accounts.length + ' account(s).'
    });
  } catch (e) {
    return JSON.stringify({ success: false, message: e.message });
  }
}

/**
 * Resolves account list from uiConfig — supports single or multi-account.
 */
function resolveMetaAccounts_(uiConfig) {
  if (uiConfig.accountIds && uiConfig.accountIds.length > 0) {
    var accountsMap = {};
    (uiConfig.accounts || []).forEach(function(a) { accountsMap[a.id] = a.name; });
    return uiConfig.accountIds.map(function(id) {
      return { id: id, name: accountsMap[id] || id };
    });
  }
  return [{ id: uiConfig.accountId, name: uiConfig.accountName || 'Report' }];
}

function copyObj_(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Step A of a scheduled async report: request the report and store the run ID.
 * @param {string} configJson  Serialized uiConfig
 * @return {string} report_run_id
 */
function scheduledRequestReport(configJson) {
  var uiConfig = JSON.parse(configJson);
  var config   = buildApiConfig_(uiConfig);
  var runId    = requestAsyncReport(config);

  // Store run ID so Step B can pick it up
  var props = PropertiesService.getUserProperties();
  var pending = JSON.parse(props.getProperty('PENDING_ASYNC_REPORTS') || '{}');
  pending[runId] = configJson;
  props.setProperty('PENDING_ASYNC_REPORTS', JSON.stringify(pending));

  Logger.log('Async report requested: ' + runId);
  return runId;
}

/**
 * Step B of a scheduled async report: poll for completion, fetch results, write sheet.
 * Called by a time-based trigger ~1h after Step A.
 */
function scheduledImportReport() {
  var props   = PropertiesService.getUserProperties();
  var pending = JSON.parse(props.getProperty('PENDING_ASYNC_REPORTS') || '{}');
  var runIds  = Object.keys(pending);

  if (runIds.length === 0) {
    Logger.log('No pending async reports to import.');
    return;
  }

  runIds.forEach(function(runId) {
    try {
      var status = checkAsyncReportStatus(runId);

      if (status.async_status === 'Job Completed') {
        var uiConfig = JSON.parse(pending[runId]);
        var rawRows  = fetchAsyncReportResults(runId);
        var headers  = buildHeaders_(uiConfig);
        var rows     = flattenRows_(rawRows, uiConfig);

        if (rows.length > 0) {
          writeReportToSheet(headers, rows, uiConfig.accountName, uiConfig.datePreset);
        }
        delete pending[runId];
        Logger.log('Async report imported: ' + runId + ' (' + rows.length + ' rows)');
      } else if (status.async_status === 'Job Failed') {
        Logger.log('Async report failed: ' + runId);
        delete pending[runId];
      } else {
        Logger.log('Report ' + runId + ' still processing (' + status.async_percent_completion + '%)');
      }
    } catch (e) {
      Logger.log('Error importing report ' + runId + ': ' + e.message);
    }
  });

  props.setProperty('PENDING_ASYNC_REPORTS', JSON.stringify(pending));
}

// ── Private helpers ─────────────────────────────────────────────────────────

/**
 * Converts UI config into the shape expected by MetaApi functions.
 */
function buildApiConfig_(uiConfig) {
  // Separate API-level fields from action/action_value metrics
  var apiFields = [];
  var selectedMetrics = uiConfig.selectedMetrics || [];
  var needActions = false;
  var needActionValues = false;

  selectedMetrics.forEach(function(metricValue) {
    var catalogEntry = findCatalogEntry_(metricValue);
    if (!catalogEntry) return;

    if (catalogEntry.type === 'field') {
      apiFields.push(catalogEntry.value);
    } else if (catalogEntry.type === 'action') {
      needActions = true;
    } else if (catalogEntry.type === 'action_value') {
      needActionValues = true;
    }
  });

  // Always include actions/action_values if any action metrics are selected
  if (needActions && apiFields.indexOf('actions') === -1) {
    apiFields.push('actions');
  }
  if (needActionValues && apiFields.indexOf('action_values') === -1) {
    apiFields.push('action_values');
  }

  return {
    accountId:     uiConfig.accountId,
    fields:        apiFields,
    level:         uiConfig.level          || DEFAULT_LEVEL,
    datePreset:    uiConfig.datePreset     || DEFAULT_DATE_PRESET,
    since:         uiConfig.since          || null,
    until:         uiConfig.until          || null,
    timeIncrement: uiConfig.timeIncrement  || DEFAULT_TIME_INCREMENT,
    breakdowns:    uiConfig.selectedBreakdowns || []
  };
}

/**
 * Builds the header row for the output sheet.
 */
function buildHeaders_(uiConfig) {
  var headers = [];
  (uiConfig.selectedMetrics || []).forEach(function(metricValue) {
    var entry = findCatalogEntry_(metricValue);
    if (entry) {
      headers.push(entry.label);
    }
  });
  // Add breakdown columns
  (uiConfig.selectedBreakdowns || []).forEach(function(bv) {
    var bd = findBreakdownEntry_(bv);
    if (bd) headers.push(bd.label);
  });
  return headers;
}

/**
 * Flattens API response rows into 2D array matching headers.
 */
function flattenRows_(rawRows, uiConfig) {
  var selectedMetrics    = uiConfig.selectedMetrics || [];
  var selectedBreakdowns = uiConfig.selectedBreakdowns || [];

  return rawRows.map(function(row) {
    var cells = [];

    selectedMetrics.forEach(function(metricValue) {
      var entry = findCatalogEntry_(metricValue);
      if (!entry) { cells.push(''); return; }

      if (entry.type === 'field') {
        var val = row[entry.value];
        // Some fields return arrays of objects (e.g. outbound_clicks)
        if (Array.isArray(val)) {
          val = extractActionTotal_(val);
        }
        cells.push(val != null ? val : '');

      } else if (entry.type === 'action') {
        cells.push(extractActionValue_(row.actions, entry.value));

      } else if (entry.type === 'action_value') {
        var actionType = entry.value.replace(':value', '');
        cells.push(extractActionValue_(row.action_values, actionType));
      }
    });

    // Add breakdown values
    selectedBreakdowns.forEach(function(bv) {
      cells.push(row[bv] != null ? row[bv] : '');
    });

    return cells;
  });
}

/**
 * Extracts a specific action_type value from an actions[] array.
 */
function extractActionValue_(actionsArray, actionType) {
  if (!actionsArray || !Array.isArray(actionsArray)) return '';
  for (var i = 0; i < actionsArray.length; i++) {
    if (actionsArray[i].action_type === actionType) {
      return actionsArray[i].value || '';
    }
  }
  return '';
}

/**
 * For fields that return [{action_type, value}] arrays, sums all values.
 */
function extractActionTotal_(arr) {
  if (!arr || !Array.isArray(arr)) return '';
  var total = 0;
  arr.forEach(function(item) {
    total += parseFloat(item.value || 0);
  });
  return total;
}

/**
 * Finds a metric entry in the catalog by value.
 */
function findCatalogEntry_(metricValue) {
  for (var i = 0; i < METRICS_CATALOG.length; i++) {
    if (METRICS_CATALOG[i].value === metricValue) {
      return METRICS_CATALOG[i];
    }
  }
  return null;
}

/**
 * Finds a breakdown entry by value.
 */
function findBreakdownEntry_(breakdownValue) {
  for (var i = 0; i < AVAILABLE_BREAKDOWNS.length; i++) {
    if (AVAILABLE_BREAKDOWNS[i].value === breakdownValue) {
      return AVAILABLE_BREAKDOWNS[i];
    }
  }
  return null;
}
