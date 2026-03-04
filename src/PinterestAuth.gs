/**
 * PinterestAuth.gs — OAuth2 authentication for Pinterest API v5.
 * Uses apps-script-oauth2 library. Pinterest requires Basic auth header for token exchange.
 */

function getPinterestOAuthService() {
  var clientId     = getPinterestClientId();
  var clientSecret = getPinterestClientSecret();

  return OAuth2.createService('Pinterest')
    .setAuthorizationBaseUrl(PINTEREST_AUTH_URL)
    .setTokenUrl(PINTEREST_TOKEN_URL)
    .setClientId(clientId)
    .setClientSecret(clientSecret)
    .setCallbackFunction('pinterestAuthCallback')
    .setPropertyStore(PropertiesService.getUserProperties())
    .setScope(PINTEREST_SCOPES)
    .setParam('response_type', 'code')
    .setTokenHeaders({
      'Authorization': 'Basic ' + Utilities.base64Encode(clientId + ':' + clientSecret)
    });
}

function pinterestAuthCallback(request) {
  var service = getPinterestOAuthService();
  var authorized = service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput(
      '<div style="font-family:sans-serif;padding:20px;text-align:center;">' +
      '<h2 style="color:#42B72A;">&#10003; Pinterest Connected!</h2>' +
      '<p>You can close this tab and return to Google Sheets.</p></div>'
    );
  }
  return HtmlService.createHtmlOutput(
    '<div style="font-family:sans-serif;padding:20px;text-align:center;">' +
    '<h2 style="color:#e74c3c;">Pinterest Authorization Denied</h2>' +
    '<p>Please try again from the sidebar.</p></div>'
  );
}

function getPinterestAccessToken() {
  var service = getPinterestOAuthService();
  if (service.hasAccess()) return service.getAccessToken();
  return null;
}

function getPinterestAuthStatus() {
  var clientId = getPinterestClientId();
  var clientSecret = getPinterestClientSecret();
  if (!clientId || !clientSecret) {
    return JSON.stringify({ status: 'no_credentials', message: 'Configure your Pinterest App credentials first.' });
  }
  var service = getPinterestOAuthService();
  if (service.hasAccess()) {
    return JSON.stringify({ status: 'connected', message: 'Connected to Pinterest.' });
  }
  return JSON.stringify({ status: 'disconnected', authUrl: service.getAuthorizationUrl(), message: 'Click below to connect.' });
}

function disconnectPinterest() {
  getPinterestOAuthService().reset();
  return JSON.stringify({ status: 'disconnected', message: 'Disconnected from Pinterest.' });
}

function savePinterestCredentials(clientId, clientSecret) {
  setPinterestCredentials(clientId.trim(), clientSecret.trim());
  return getPinterestAuthStatus();
}
