/**
 * RedditAuth.gs — OAuth2 authentication for Reddit Ads API.
 * Uses apps-script-oauth2 library. Refresh tokens are permanent until revoked.
 */

function getRedditOAuthService() {
  var clientId     = getRedditClientId();
  var clientSecret = getRedditClientSecret();

  return OAuth2.createService('Reddit')
    .setAuthorizationBaseUrl(REDDIT_AUTH_URL)
    .setTokenUrl(REDDIT_TOKEN_URL)
    .setClientId(clientId)
    .setClientSecret(clientSecret)
    .setCallbackFunction('redditAuthCallback')
    .setPropertyStore(PropertiesService.getUserProperties())
    .setScope(REDDIT_SCOPES)
    .setParam('response_type', 'code')
    .setParam('duration', 'permanent')
    .setTokenHeaders({
      'Authorization': 'Basic ' + Utilities.base64Encode(clientId + ':' + clientSecret)
    });
}

function redditAuthCallback(request) {
  var service = getRedditOAuthService();
  var authorized = service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput(
      '<div style="font-family:sans-serif;padding:20px;text-align:center;">' +
      '<h2 style="color:#42B72A;">&#10003; Reddit Connected!</h2>' +
      '<p>You can close this tab and return to Google Sheets.</p></div>'
    );
  }
  return HtmlService.createHtmlOutput(
    '<div style="font-family:sans-serif;padding:20px;text-align:center;">' +
    '<h2 style="color:#e74c3c;">Reddit Authorization Denied</h2>' +
    '<p>Please try again from the sidebar.</p></div>'
  );
}

function getRedditAccessToken() {
  var service = getRedditOAuthService();
  if (service.hasAccess()) return service.getAccessToken();
  return null;
}

function getRedditAuthStatus() {
  var clientId = getRedditClientId();
  var clientSecret = getRedditClientSecret();
  if (!clientId || !clientSecret) {
    return JSON.stringify({ status: 'no_credentials', message: 'Configure your Reddit App credentials first.' });
  }
  var service = getRedditOAuthService();
  if (service.hasAccess()) {
    return JSON.stringify({ status: 'connected', message: 'Connected to Reddit Ads.' });
  }
  return JSON.stringify({ status: 'disconnected', authUrl: service.getAuthorizationUrl(), message: 'Click below to connect.' });
}

function disconnectReddit() {
  getRedditOAuthService().reset();
  return JSON.stringify({ status: 'disconnected', message: 'Disconnected from Reddit.' });
}

function saveRedditCredentials(clientId, clientSecret) {
  setRedditCredentials(clientId.trim(), clientSecret.trim());
  return getRedditAuthStatus();
}
