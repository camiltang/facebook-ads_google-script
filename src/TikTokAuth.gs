/**
 * TikTokAuth.gs — OAuth authentication for TikTok Business API.
 *
 * TikTok uses a custom auth flow (not standard OAuth2 library):
 *  1. Redirect user to TikTok auth page with app_id & redirect_uri
 *  2. TikTok redirects back with auth_code
 *  3. Exchange auth_code for access_token via POST
 *  4. Access tokens do NOT expire for the Marketing API (unless revoked)
 */

/**
 * Builds the TikTok authorization URL.
 */
function getTikTokAuthUrl() {
  var appId = getTikTokAppId();
  if (!appId) return '';

  var redirectUri = ScriptApp.getService().getUrl();
  return TIKTOK_AUTH_URL
    + '?app_id=' + encodeURIComponent(appId)
    + '&redirect_uri=' + encodeURIComponent(redirectUri)
    + '&state=tiktok_auth';
}

/**
 * Web app doGet handler — catches the TikTok OAuth callback.
 * TikTok redirects to this script's URL with ?auth_code=...
 */
function doGet(e) {
  if (e && e.parameter && e.parameter.auth_code) {
    return handleTikTokCallback_(e.parameter.auth_code);
  }
  // Default: show sidebar
  return HtmlService.createHtmlOutput('<p>Social Ads Reporter — use from Google Sheets.</p>');
}

/**
 * Exchanges auth_code for access_token and stores it.
 */
function handleTikTokCallback_(authCode) {
  var appId     = getTikTokAppId();
  var appSecret = getTikTokAppSecret();

  var url = TIKTOK_API_BASE + '/oauth2/access_token/';
  var payload = {
    app_id: appId,
    secret: appSecret,
    auth_code: authCode
  };

  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  var result = JSON.parse(response.getContentText());

  if (result.code === 0 && result.data && result.data.access_token) {
    var props = PropertiesService.getUserProperties();
    props.setProperty('TIKTOK_ACCESS_TOKEN', result.data.access_token);

    // Store advertiser IDs from the auth response
    if (result.data.advertiser_ids) {
      props.setProperty('TIKTOK_ADVERTISER_IDS', JSON.stringify(result.data.advertiser_ids));
    }

    return HtmlService.createHtmlOutput(
      '<div style="font-family:sans-serif;padding:20px;text-align:center;">' +
      '<h2 style="color:#42B72A;">&#10003; TikTok Connected!</h2>' +
      '<p>You can close this tab and return to Google Sheets.</p>' +
      '</div>'
    );
  }

  return HtmlService.createHtmlOutput(
    '<div style="font-family:sans-serif;padding:20px;text-align:center;">' +
    '<h2 style="color:#e74c3c;">TikTok Authorization Failed</h2>' +
    '<p>' + (result.message || 'Unknown error') + '</p>' +
    '</div>'
  );
}

/**
 * Manual token exchange — user pastes auth_code from URL into sidebar.
 * (Fallback if doGet redirect doesn't work in add-on context.)
 */
function exchangeTikTokAuthCode(authCode) {
  var appId     = getTikTokAppId();
  var appSecret = getTikTokAppSecret();

  if (!appId || !appSecret) {
    return JSON.stringify({ success: false, message: 'TikTok App credentials not configured.' });
  }

  var url = TIKTOK_API_BASE + '/oauth2/access_token/';
  var payload = {
    app_id: appId,
    secret: appSecret,
    auth_code: authCode.trim()
  };

  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  var result = JSON.parse(response.getContentText());

  if (result.code === 0 && result.data && result.data.access_token) {
    var props = PropertiesService.getUserProperties();
    props.setProperty('TIKTOK_ACCESS_TOKEN', result.data.access_token);
    if (result.data.advertiser_ids) {
      props.setProperty('TIKTOK_ADVERTISER_IDS', JSON.stringify(result.data.advertiser_ids));
    }
    return JSON.stringify({ success: true, message: 'TikTok connected successfully.' });
  }

  return JSON.stringify({
    success: false,
    message: 'Token exchange failed: ' + (result.message || JSON.stringify(result))
  });
}

/**
 * Returns TikTok auth status for the sidebar.
 */
function getTikTokAuthStatus() {
  var appId     = getTikTokAppId();
  var appSecret = getTikTokAppSecret();

  if (!appId || !appSecret) {
    return JSON.stringify({
      status: 'no_credentials',
      message: 'Please configure your TikTok App credentials first.'
    });
  }

  var token = getTikTokAccessToken();
  if (token) {
    return JSON.stringify({ status: 'connected', message: 'Connected to TikTok.' });
  }

  return JSON.stringify({
    status: 'disconnected',
    authUrl: getTikTokAuthUrl(),
    message: 'Click below to connect your TikTok Ads account.'
  });
}

/**
 * Disconnects TikTok by clearing stored tokens.
 */
function disconnectTikTok() {
  var props = PropertiesService.getUserProperties();
  props.deleteProperty('TIKTOK_ACCESS_TOKEN');
  props.deleteProperty('TIKTOK_ADVERTISER_IDS');
  return JSON.stringify({ status: 'disconnected', message: 'Disconnected from TikTok.' });
}

/**
 * Saves TikTok App credentials and returns updated auth status.
 */
function saveTikTokCredentials(appId, appSecret) {
  setTikTokCredentials(appId.trim(), appSecret.trim());
  return getTikTokAuthStatus();
}
