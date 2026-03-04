/**
 * RedditApi.gs — Reddit Ads API v3 calls for account listing and reporting.
 * Base: https://ads-api.reddit.com/api/v3
 */

/**
 * Fetches ad accounts the user has access to.
 * Returns JSON: [{ id, name }]
 */
function fetchRedditAdAccounts() {
  var token = getRedditAccessToken();
  if (!token) throw new Error('Not authenticated with Reddit.');

  var url = REDDIT_API_BASE + '/me/accounts';
  var response = UrlFetchApp.fetch(url, {
    headers: {
      'Authorization': 'Bearer ' + token,
      'User-Agent': 'SocialAdsReporter/1.0'
    },
    muteHttpExceptions: true
  });
  var result = JSON.parse(response.getContentText());

  if (!result.data) {
    throw new Error('Reddit API error: ' + (result.message || response.getContentText()));
  }

  return JSON.stringify((result.data || []).map(function(a) {
    return { id: a.id, name: a.name || ('Account ' + a.id) };
  }));
}

/**
 * Fetches reporting data for a given account and level.
 * @param {Object} config {
 *   accountId, level, metrics[], startDate, endDate, granularity, breakdown
 * }
 * @return {Object[]}
 */
function fetchRedditReport(config) {
  var token = getRedditAccessToken();
  if (!token) throw new Error('Not authenticated with Reddit.');

  var level = config.level || 'campaign';
  var url = REDDIT_API_BASE + '/accounts/' + config.accountId + '/reports/' + level;

  var params = [
    'starts=' + encodeURIComponent(config.startDate),
    'ends=' + encodeURIComponent(config.endDate),
    'granularity=' + (config.granularity || 'DAY')
  ];

  if (config.breakdown) {
    params.push('breakdown=' + encodeURIComponent(config.breakdown));
  }

  url += '?' + params.join('&');

  var response = UrlFetchApp.fetch(url, {
    headers: {
      'Authorization': 'Bearer ' + token,
      'User-Agent': 'SocialAdsReporter/1.0'
    },
    muteHttpExceptions: true
  });

  var result = JSON.parse(response.getContentText());
  if (!result.data) {
    throw new Error('Reddit report error: ' + (result.message || response.getContentText()));
  }

  return result.data || [];
}
