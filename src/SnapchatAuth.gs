/**
 * SnapchatAuth.gs — OAuth2 authentication for Snapchat Marketing API.
 * Uses the apps-script-oauth2 library (same as Meta).
 * Tokens expire in 30 min; refresh tokens are long-lived.
 */

function getSnapOAuthService() {
  var clientId     = getSnapClientId();
  var clientSecret = getSnapClientSecret();

  return OAuth2.createService('Snapchat')
    .setAuthorizationBaseUrl(SNAP_AUTH_URL)
    .setTokenUrl(SNAP_TOKEN_URL)
    .setClientId(clientId)
    .setClientSecret(clientSecret)
    .setCallbackFunction('snapAuthCallback')
    .setPropertyStore(PropertiesService.getUserProperties())
    .setScope(SNAP_SCOPES)
    .setParam('response_type', 'code');
}

function snapAuthCallback(request) {
  var service = getSnapOAuthService();
  var authorized = service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput(
      '<div style="font-family:sans-serif;padding:20px;text-align:center;">' +
      '<h2 style="color:#42B72A;">&#10003; Snapchat Connected!</h2>' +
      '<p>You can close this tab and return to Google Sheets.</p></div>'
    );
  }
  return HtmlService.createHtmlOutput(
    '<div style="font-family:sans-serif;padding:20px;text-align:center;">' +
    '<h2 style="color:#e74c3c;">Snapchat Authorization Denied</h2>' +
    '<p>Please try again from the sidebar.</p></div>'
  );
}

function getSnapAccessToken() {
  var service = getSnapOAuthService();
  if (service.hasAccess()) return service.getAccessToken();
  return null;
}

function getSnapAuthStatus() {
  var clientId = getSnapClientId();
  var clientSecret = getSnapClientSecret();
  if (!clientId || !clientSecret) {
    return JSON.stringify({ status: 'no_credentials', message: 'Configure your Snapchat App credentials first.' });
  }
  var service = getSnapOAuthService();
  if (service.hasAccess()) {
    return JSON.stringify({ status: 'connected', message: 'Connected to Snapchat.' });
  }
  return JSON.stringify({ status: 'disconnected', authUrl: service.getAuthorizationUrl(), message: 'Click below to connect.' });
}

function disconnectSnapchat() {
  getSnapOAuthService().reset();
  return JSON.stringify({ status: 'disconnected', message: 'Disconnected from Snapchat.' });
}

function saveSnapCredentials(clientId, clientSecret) {
  setSnapCredentials(clientId.trim(), clientSecret.trim());
  return getSnapAuthStatus();
}
