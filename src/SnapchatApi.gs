/**
 * SnapchatApi.gs — Snapchat Marketing API calls for ad accounts and stats.
 * Base: https://adsapi.snapchat.com/v1
 */

/**
 * Fetches organizations, then ad accounts within them.
 * Returns JSON: [{ id, name, organization_id, currency, timezone }]
 */
function fetchSnapAdAccounts() {
  var token = getSnapAccessToken();
  if (!token) throw new Error('Not authenticated with Snapchat.');

  // First get organizations
  var orgsUrl = SNAP_API_BASE + '/me/organizations';
  var orgsResp = UrlFetchApp.fetch(orgsUrl, {
    headers: { 'Authorization': 'Bearer ' + token },
    muteHttpExceptions: true
  });
  var orgsResult = JSON.parse(orgsResp.getContentText());
  if (orgsResult.request_status !== 'SUCCESS') {
    throw new Error('Snap API error: ' + (orgsResult.debug_message || 'Unknown'));
  }

  var accounts = [];
  var orgs = orgsResult.organizations || [];
  orgs.forEach(function(orgWrapper) {
    var org = orgWrapper.organization;
    // Get ad accounts for each org
    var acctUrl = SNAP_API_BASE + '/organizations/' + org.id + '/adaccounts';
    var acctResp = UrlFetchApp.fetch(acctUrl, {
      headers: { 'Authorization': 'Bearer ' + token },
      muteHttpExceptions: true
    });
    var acctResult = JSON.parse(acctResp.getContentText());
    if (acctResult.request_status === 'SUCCESS') {
      (acctResult.adaccounts || []).forEach(function(wrapper) {
        var a = wrapper.adaccount;
        if (a.status === 'ACTIVE') {
          accounts.push({
            id: a.id,
            name: a.name,
            organization_id: org.id,
            currency: a.currency,
            timezone: a.timezone
          });
        }
      });
    }
  });

  return JSON.stringify(accounts);
}

/**
 * Fetches stats for a given entity level.
 * @param {Object} config {
 *   accountId, level ('campaigns'|'adsquads'|'ads'|'adaccounts'),
 *   fields[], granularity, startTime (ISO), endTime (ISO), breakdown
 * }
 * @return {Object[]} array of stat timeseries objects
 */
function fetchSnapStats(config) {
  var token = getSnapAccessToken();
  if (!token) throw new Error('Not authenticated with Snapchat.');

  var url = SNAP_API_BASE + '/adaccounts/' + config.accountId + '/stats';
  var params = [
    'granularity=' + (config.granularity || 'DAY'),
    'fields=' + encodeURIComponent((config.fields || ['impressions', 'spend']).join(',')),
    'start_time=' + encodeURIComponent(config.startTime),
    'end_time=' + encodeURIComponent(config.endTime)
  ];

  if (config.breakdown) {
    params.push('report_dimension=' + encodeURIComponent(config.breakdown));
  }

  url += '?' + params.join('&');

  var response = UrlFetchApp.fetch(url, {
    headers: { 'Authorization': 'Bearer ' + token },
    muteHttpExceptions: true
  });
  var result = JSON.parse(response.getContentText());

  if (result.request_status !== 'SUCCESS') {
    throw new Error('Snap stats error: ' + (result.debug_message || 'Unknown'));
  }

  return result.timeseries_stats || result.total_stats || [];
}

/**
 * Fetches entity metadata (campaigns, ad squads, ads) for name resolution.
 */
function fetchSnapEntities(accountId, level) {
  var token = getSnapAccessToken();
  if (!token) throw new Error('Not authenticated with Snapchat.');

  var url = SNAP_API_BASE + '/adaccounts/' + accountId + '/' + level;
  var response = UrlFetchApp.fetch(url, {
    headers: { 'Authorization': 'Bearer ' + token },
    muteHttpExceptions: true
  });
  var result = JSON.parse(response.getContentText());
  if (result.request_status !== 'SUCCESS') return {};

  var map = {};
  var key = level.replace(/s$/, ''); // campaigns -> campaign
  (result[level] || []).forEach(function(wrapper) {
    var entity = wrapper[key];
    if (entity) map[entity.id] = entity.name;
  });
  return map;
}
