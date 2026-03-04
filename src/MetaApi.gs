/**
 * MetaApi.gs — Facebook Marketing API calls for the Social Ads Reporter.
 * Handles: ad account listing, synchronous & asynchronous insight requests.
 */

// ── Ad Account listing ──────────────────────────────────────────────────────

/**
 * Fetches all ad accounts the authenticated user has access to.
 * Returns JSON array: [{ id, name, account_id, currency, timezone_name }]
 */
function fetchAdAccounts() {
  var token = getMetaAccessToken();
  if (!token) throw new Error('Not authenticated. Please connect to Meta first.');

  var accounts = [];
  var url = META_GRAPH_URL + '/me/adaccounts'
    + '?fields=name,account_id,currency,timezone_name,account_status'
    + '&limit=100'
    + '&access_token=' + token;

  while (url) {
    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var result   = JSON.parse(response.getContentText());

    if (result.error) {
      throw new Error('Meta API error: ' + result.error.message);
    }

    (result.data || []).forEach(function(acct) {
      // Only include active accounts (status 1)
      if (acct.account_status === 1) {
        accounts.push({
          id:            acct.id,           // "act_123456"
          name:          acct.name,
          account_id:    acct.account_id,   // "123456"
          currency:      acct.currency,
          timezone_name: acct.timezone_name
        });
      }
    });

    url = (result.paging && result.paging.next) ? result.paging.next : null;
  }

  return JSON.stringify(accounts);
}

// ── Synchronous Insights ────────────────────────────────────────────────────

/**
 * Fetches insights synchronously (for small queries).
 * @param {Object} config  { accountId, fields[], level, datePreset, since, until, timeIncrement, breakdowns[], limit }
 * @return {Object[]} rows of data
 */
function fetchInsightsSync(config) {
  var token = getMetaAccessToken();
  if (!token) throw new Error('Not authenticated.');

  var params = buildInsightsParams_(config, token);
  var url    = META_GRAPH_URL + '/' + config.accountId + '/insights?' + params;

  var allRows = [];
  while (url) {
    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var result   = JSON.parse(response.getContentText());

    if (result.error) {
      throw new Error('Insights API error: ' + result.error.message);
    }

    allRows = allRows.concat(result.data || []);
    url = (result.paging && result.paging.next) ? result.paging.next : null;
  }

  return allRows;
}

// ── Asynchronous Insights ───────────────────────────────────────────────────

/**
 * Requests an async report and returns the report_run_id.
 * @param {Object} config  same shape as fetchInsightsSync
 * @return {string} report_run_id
 */
function requestAsyncReport(config) {
  var token  = getMetaAccessToken();
  if (!token) throw new Error('Not authenticated.');

  var url = META_GRAPH_URL + '/' + config.accountId + '/insights';

  var payload = {
    level:          config.level          || DEFAULT_LEVEL,
    fields:         (config.fields || []).join(','),
    time_increment: config.timeIncrement  || DEFAULT_TIME_INCREMENT,
    access_token:   token,
    limit:          '1000'
  };

  if (config.datePreset && config.datePreset !== 'custom') {
    payload.date_preset = config.datePreset;
  } else if (config.since && config.until) {
    payload.time_range = JSON.stringify({ since: config.since, until: config.until });
  }

  if (config.breakdowns && config.breakdowns.length > 0) {
    payload.breakdowns = config.breakdowns.join(',');
  }

  var options = {
    method: 'post',
    payload: payload,
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  var result   = JSON.parse(response.getContentText());

  if (result.error) {
    throw new Error('Async report error: ' + result.error.message);
  }

  return result.report_run_id;
}

/**
 * Checks the status of an async report run.
 * @param {string} reportRunId
 * @return {Object} { id, async_status, async_percent_completion, ... }
 */
function checkAsyncReportStatus(reportRunId) {
  var token = getMetaAccessToken();
  if (!token) throw new Error('Not authenticated.');

  var url = META_GRAPH_URL + '/' + reportRunId
    + '?access_token=' + token;

  var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  var result   = JSON.parse(response.getContentText());

  if (result.error) {
    throw new Error('Report status error: ' + result.error.message);
  }

  return result;
}

/**
 * Fetches the results of a completed async report.
 * @param {string} reportRunId
 * @return {Object[]} rows of insight data
 */
function fetchAsyncReportResults(reportRunId) {
  var token = getMetaAccessToken();
  if (!token) throw new Error('Not authenticated.');

  var url = META_GRAPH_URL + '/' + reportRunId + '/insights'
    + '?limit=1000'
    + '&access_token=' + token;

  var allRows = [];
  while (url) {
    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var result   = JSON.parse(response.getContentText());

    if (result.error) {
      throw new Error('Fetch results error: ' + result.error.message);
    }

    allRows = allRows.concat(result.data || []);
    url = (result.paging && result.paging.next) ? result.paging.next : null;
  }

  return allRows;
}

// ── Private helpers ─────────────────────────────────────────────────────────

/**
 * Builds URL query string for a synchronous insights call.
 */
function buildInsightsParams_(config, token) {
  var parts = [
    'level='          + encodeURIComponent(config.level || DEFAULT_LEVEL),
    'fields='         + encodeURIComponent((config.fields || []).join(',')),
    'time_increment=' + encodeURIComponent(config.timeIncrement || DEFAULT_TIME_INCREMENT),
    'access_token='   + encodeURIComponent(token),
    'limit='          + (config.limit || '500')
  ];

  if (config.datePreset && config.datePreset !== 'custom') {
    parts.push('date_preset=' + encodeURIComponent(config.datePreset));
  } else if (config.since && config.until) {
    parts.push('time_range=' + encodeURIComponent(
      JSON.stringify({ since: config.since, until: config.until })
    ));
  }

  if (config.breakdowns && config.breakdowns.length > 0) {
    parts.push('breakdowns=' + encodeURIComponent(config.breakdowns.join(',')));
  }

  return parts.join('&');
}
