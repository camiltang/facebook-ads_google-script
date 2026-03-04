/**
 * Auth.gs — OAuth2 authentication for Meta (Facebook) Marketing API.
 * Uses the apps-script-oauth2 library: https://github.com/googleworkspace/apps-script-oauth2
 */

/**
 * Creates and returns the OAuth2 service for Meta.
 */
function getMetaOAuthService() {
  var clientId     = getMetaClientId();
  var clientSecret = getMetaClientSecret();

  return OAuth2.createService('Meta')
    .setAuthorizationBaseUrl('https://www.facebook.com/dialog/oauth')
    .setTokenUrl('https://graph.facebook.com/' + META_API_VERSION + '/oauth/access_token')
    .setClientId(clientId)
    .setClientSecret(clientSecret)
    .setCallbackFunction('authCallback')
    .setPropertyStore(PropertiesService.getUserProperties())
    .setScope(META_SCOPES)
    .setParam('response_type', 'code');
}

/**
 * OAuth2 callback handler — called by Google after Meta redirects back.
 */
function authCallback(request) {
  var service = getMetaOAuthService();
  var authorized = service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput(
      '<div style="font-family:sans-serif;padding:20px;text-align:center;">' +
      '<h2 style="color:#42B72A;">&#10003; Authorization Successful</h2>' +
      '<p>You can close this tab and return to Google Sheets.</p>' +
      '</div>'
    );
  }
  return HtmlService.createHtmlOutput(
    '<div style="font-family:sans-serif;padding:20px;text-align:center;">' +
    '<h2 style="color:#e74c3c;">Authorization Denied</h2>' +
    '<p>Please try again from the sidebar.</p>' +
    '</div>'
  );
}

/**
 * Returns the current access token or null if not authenticated.
 */
function getMetaAccessToken() {
  var service = getMetaOAuthService();
  if (service.hasAccess()) {
    return service.getAccessToken();
  }
  return null;
}

/**
 * Returns auth status and login URL for the sidebar.
 */
function getAuthStatus() {
  var clientId = getMetaClientId();
  var clientSecret = getMetaClientSecret();

  if (!clientId || !clientSecret) {
    return JSON.stringify({
      status: 'no_credentials',
      message: 'Please configure your Meta App credentials first.'
    });
  }

  var service = getMetaOAuthService();
  if (service.hasAccess()) {
    return JSON.stringify({
      status: 'connected',
      message: 'Connected to Meta.'
    });
  }

  return JSON.stringify({
    status: 'disconnected',
    authUrl: service.getAuthorizationUrl(),
    message: 'Click below to connect your Meta account.'
  });
}

/**
 * Disconnects the current Meta OAuth session.
 */
function disconnectMeta() {
  var service = getMetaOAuthService();
  service.reset();
  return JSON.stringify({ status: 'disconnected', message: 'Disconnected from Meta.' });
}

/**
 * Returns the OAuth redirect URI so the user can configure their Meta App.
 */
function getRedirectUri() {
  return OAuth2.getRedirectUri();
}

/**
 * Saves Meta App credentials and returns new auth status.
 */
function saveMetaCredentials(clientId, clientSecret) {
  setMetaCredentials(clientId.trim(), clientSecret.trim());
  return getAuthStatus();
}
