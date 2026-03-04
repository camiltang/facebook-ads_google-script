/**
 * TikTokApi.gs — TikTok Business API calls for ad account listing and reporting.
 * Endpoint: /report/integrated/get/
 */

// ── Advertiser (Ad Account) listing ─────────────────────────────────────────

/**
 * Fetches advertiser accounts the user has access to.
 * Returns JSON array: [{ advertiser_id, advertiser_name }]
 */
function fetchTikTokAdvertisers() {
  var token   = getTikTokAccessToken();
  var appId   = getTikTokAppId();
  var secret  = getTikTokAppSecret();
  if (!token) throw new Error('Not authenticated with TikTok.');

  var url = TIKTOK_API_BASE + '/oauth2/advertiser/get/'
    + '?app_id='       + encodeURIComponent(appId)
    + '&secret='       + encodeURIComponent(secret)
    + '&access_token=' + encodeURIComponent(token);

  var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  var result   = JSON.parse(response.getContentText());

  if (result.code !== 0) {
    throw new Error('TikTok API error: ' + (result.message || 'Unknown'));
  }

  var advertisers = (result.data && result.data.list) || [];
  return JSON.stringify(advertisers.map(function(a) {
    return {
      advertiser_id:   String(a.advertiser_id),
      advertiser_name: a.advertiser_name || ('Account ' + a.advertiser_id)
    };
  }));
}

// ── Synchronous Reporting ───────────────────────────────────────────────────

/**
 * Fetches a synchronous report from TikTok.
 * @param {Object} config {
 *   advertiserId, metrics[], dimensions[], dataLevel,
 *   startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), reportType
 * }
 * @return {Object[]} Array of row objects { metrics: {...}, dimensions: {...} }
 */
function fetchTikTokReport(config) {
  var token = getTikTokAccessToken();
  if (!token) throw new Error('Not authenticated with TikTok.');

  var url = TIKTOK_API_BASE + '/report/integrated/get/';

  var body = {
    advertiser_id: config.advertiserId,
    report_type:   config.reportType || 'BASIC',
    data_level:    config.dataLevel  || 'AUCTION_CAMPAIGN',
    dimensions:    config.dimensions || ['campaign_id', 'stat_time_day'],
    metrics:       config.metrics    || ['spend', 'impressions', 'clicks'],
    start_date:    config.startDate,
    end_date:      config.endDate,
    page:          1,
    page_size:     1000
  };

  // For AUDIENCE report type, filtering may be needed
  if (config.filtering) {
    body.filtering = config.filtering;
  }

  var allRows = [];
  var hasMore = true;

  while (hasMore) {
    var response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: { 'Access-Token': token },
      payload: JSON.stringify(body),
      contentType: 'application/json',
      muteHttpExceptions: true
    });

    // TikTok GET with body isn't standard — use query params approach
    var result = tiktokReportRequest_(url, body, token);

    if (result.code !== 0) {
      throw new Error('TikTok report error: ' + (result.message || 'Unknown'));
    }

    var pageData = (result.data && result.data.list) || [];
    allRows = allRows.concat(pageData);

    var pageInfo = result.data && result.data.page_info;
    if (pageInfo && pageInfo.page < Math.ceil(pageInfo.total_number / pageInfo.page_size)) {
      body.page = pageInfo.page + 1;
    } else {
      hasMore = false;
    }
  }

  return allRows;
}

// ── Async Reporting ─────────────────────────────────────────────────────────

/**
 * Creates an async report task.
 * @param {Object} config  same shape as fetchTikTokReport
 * @return {string} task_id
 */
function createTikTokAsyncReport(config) {
  var token = getTikTokAccessToken();
  if (!token) throw new Error('Not authenticated with TikTok.');

  var url = TIKTOK_API_BASE + '/report/task/create/';

  var body = {
    advertiser_id: config.advertiserId,
    report_type:   config.reportType || 'BASIC',
    data_level:    config.dataLevel  || 'AUCTION_CAMPAIGN',
    dimensions:    config.dimensions || ['campaign_id', 'stat_time_day'],
    metrics:       config.metrics    || ['spend', 'impressions', 'clicks'],
    start_date:    config.startDate,
    end_date:      config.endDate
  };

  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    headers: { 'Access-Token': token },
    contentType: 'application/json',
    payload: JSON.stringify(body),
    muteHttpExceptions: true
  });

  var result = JSON.parse(response.getContentText());
  if (result.code !== 0) {
    throw new Error('TikTok async task error: ' + (result.message || 'Unknown'));
  }

  return result.data.task_id;
}

/**
 * Checks status of an async report task.
 * @param {string} taskId
 * @param {string} advertiserId
 * @return {Object} { task_id, status, ... }
 */
function checkTikTokAsyncStatus(taskId, advertiserId) {
  var token = getTikTokAccessToken();
  if (!token) throw new Error('Not authenticated with TikTok.');

  var url = TIKTOK_API_BASE + '/report/task/check/'
    + '?advertiser_id=' + encodeURIComponent(advertiserId)
    + '&task_id=' + encodeURIComponent(taskId);

  var response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { 'Access-Token': token },
    muteHttpExceptions: true
  });

  var result = JSON.parse(response.getContentText());
  if (result.code !== 0) {
    throw new Error('TikTok task check error: ' + (result.message || 'Unknown'));
  }

  return result.data;
}

// ── Private helpers ─────────────────────────────────────────────────────────

/**
 * TikTok's integrated report endpoint accepts GET with JSON body,
 * but UrlFetchApp doesn't support GET+body. Use POST or query-string workaround.
 */
function tiktokReportRequest_(url, body, token) {
  // TikTok actually accepts this as a GET with JSON body via their SDK,
  // but for Apps Script we use the POST method which also works.
  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    headers: { 'Access-Token': token },
    contentType: 'application/json',
    payload: JSON.stringify(body),
    muteHttpExceptions: true
  });

  return JSON.parse(response.getContentText());
}
