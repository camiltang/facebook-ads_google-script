/**
 * PinterestApi.gs — Pinterest API v5 calls for ad accounts and analytics.
 * Base: https://api.pinterest.com/v5
 */

/**
 * Fetches ad accounts the user has access to.
 * Returns JSON: [{ id, name, currency, country }]
 */
function fetchPinterestAdAccounts() {
  var token = getPinterestAccessToken();
  if (!token) throw new Error('Not authenticated with Pinterest.');

  var url = PINTEREST_API_BASE + '/ad_accounts?page_size=100';
  var accounts = [];

  while (url) {
    var response = UrlFetchApp.fetch(url, {
      headers: { 'Authorization': 'Bearer ' + token },
      muteHttpExceptions: true
    });
    var result = JSON.parse(response.getContentText());

    if (result.code) {
      throw new Error('Pinterest API error: ' + (result.message || 'Unknown'));
    }

    (result.items || []).forEach(function(a) {
      accounts.push({
        id: a.id,
        name: a.name || ('Account ' + a.id),
        currency: a.currency || '',
        country: a.country || ''
      });
    });

    url = result.bookmark ? (PINTEREST_API_BASE + '/ad_accounts?page_size=100&bookmark=' + encodeURIComponent(result.bookmark)) : null;
  }

  return JSON.stringify(accounts);
}

/**
 * Fetches ad account level analytics.
 * @param {Object} config {
 *   accountId, columns[], startDate, endDate, granularity, level
 * }
 * @return {Object[]} array of row objects
 */
function fetchPinterestAnalytics(config) {
  var token = getPinterestAccessToken();
  if (!token) throw new Error('Not authenticated with Pinterest.');

  // Determine endpoint based on level
  var endpoint;
  switch (config.level) {
    case 'CAMPAIGN':
      endpoint = '/ad_accounts/' + config.accountId + '/campaigns/analytics';
      break;
    case 'AD_GROUP':
      endpoint = '/ad_accounts/' + config.accountId + '/ad_groups/analytics';
      break;
    case 'PIN_PROMOTION':
      endpoint = '/ad_accounts/' + config.accountId + '/ads/analytics';
      break;
    default:
      endpoint = '/ad_accounts/' + config.accountId + '/analytics';
  }

  var params = [
    'start_date=' + config.startDate,
    'end_date=' + config.endDate,
    'columns=' + encodeURIComponent((config.columns || ['SPEND_IN_DOLLAR', 'PAID_IMPRESSION']).join(',')),
    'granularity=' + (config.granularity || 'DAY')
  ];

  // For campaign/ad_group/ad level, we need entity IDs — first fetch them
  if (config.level && config.level !== 'ACCOUNT') {
    var entityIds = fetchPinterestEntityIds_(config.accountId, config.level, token);
    if (entityIds.length === 0) return [];
    // Pinterest analytics requires specific entity IDs
    var levelParam = config.level === 'CAMPAIGN' ? 'campaign_ids' :
                     config.level === 'AD_GROUP' ? 'ad_group_ids' : 'ad_ids';
    params.push(levelParam + '=' + encodeURIComponent(entityIds.join(',')));
  }

  var url = PINTEREST_API_BASE + endpoint + '?' + params.join('&');

  var response = UrlFetchApp.fetch(url, {
    headers: { 'Authorization': 'Bearer ' + token },
    muteHttpExceptions: true
  });
  var result = JSON.parse(response.getContentText());

  if (result.code) {
    throw new Error('Pinterest analytics error: ' + (result.message || 'Unknown'));
  }

  return Array.isArray(result) ? result : (result.items || []);
}

/**
 * Fetches targeting analytics (for dimension breakdowns).
 */
function fetchPinterestTargetingAnalytics(config) {
  var token = getPinterestAccessToken();
  if (!token) throw new Error('Not authenticated with Pinterest.');

  var url = PINTEREST_API_BASE + '/ad_accounts/' + config.accountId + '/targeting_analytics';
  var params = [
    'start_date=' + config.startDate,
    'end_date=' + config.endDate,
    'columns=' + encodeURIComponent((config.columns || ['SPEND_IN_DOLLAR']).join(',')),
    'granularity=' + (config.granularity || 'DAY'),
    'targeting_types=' + encodeURIComponent(config.targetingType || 'GENDER')
  ];

  url += '?' + params.join('&');

  var response = UrlFetchApp.fetch(url, {
    headers: { 'Authorization': 'Bearer ' + token },
    muteHttpExceptions: true
  });
  return JSON.parse(response.getContentText());
}

// ── Private helpers ─────────────────────────────────────────────────────────

function fetchPinterestEntityIds_(accountId, level, token) {
  var endpoint;
  switch (level) {
    case 'CAMPAIGN':      endpoint = '/ad_accounts/' + accountId + '/campaigns'; break;
    case 'AD_GROUP':      endpoint = '/ad_accounts/' + accountId + '/ad_groups'; break;
    case 'PIN_PROMOTION': endpoint = '/ad_accounts/' + accountId + '/ads'; break;
    default: return [];
  }

  var url = PINTEREST_API_BASE + endpoint + '?page_size=100';
  var response = UrlFetchApp.fetch(url, {
    headers: { 'Authorization': 'Bearer ' + token },
    muteHttpExceptions: true
  });
  var result = JSON.parse(response.getContentText());

  return (result.items || []).map(function(item) { return item.id; });
}
