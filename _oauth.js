/*
 * Facebook OAuth 2.0 guides:
 * https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow
 * https://developers.facebook.com/apps/
 */


/**
 * Authorizes and makes a request to the Facebook API.
 */
function run() {
  var service = getService();
  if (service.hasAccess()) {
    var token = PropertiesService.getUserProperties().getProperty('oauth2.Facebook'); 
    token = JSON.parse(token);
    return token.access_token;
  } else {
    var authorizationUrl = service.getAuthorizationUrl();
    prompt_withURL('Open the following URL and re-run the script', authorizationUrl)
  }
}

/**
 * Reset the authorization state, so that it can be re-tested.
 */
function reset() {
  getService().reset();
}

/**
 * Configures the service.
 */
function getService() {

  return OAuth2.createService('Facebook')
    // Set the endpoint URLs.
    .setAuthorizationBaseUrl('https://www.facebook.com/dialog/oauth')
    .setTokenUrl('https://graph.facebook.com/v5.0/oauth/access_token')

    // Set the client ID and secret.
    .setClientId(CLIENT_ID)
    .setClientSecret(CLIENT_SECRET)

    // Set the name of the callback function that should be invoked to complete
    // the OAuth flow.
    .setCallbackFunction('authCallback')

    // Set the property store where authorized tokens should be persisted.
    .setPropertyStore(PropertiesService.getUserProperties());
}

/**
 * Handles the OAuth callback.
 */
function authCallback(request) {
  var service = getService();
  var authorized = service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput('Success!');
  } else {
    return HtmlService.createHtmlOutput('Denied.');
  }
}

/**
 * Logs the redict URI to register.
 */
function logRedirectUri() {
  Logger.log(OAuth2.getRedirectUri());
}

/**
 * Returns Token
 */
function logRedirectUri() {
  Logger.log(OAuth2.getRedirectUri());
}

function facebook_app_setup() {
 var validOauthUrl = Utilities.formatString('https://developers.facebook.com/apps/%s/fb-login/settings/', CLIENT_ID)
 var htmlOutput = HtmlService
.createHtmlOutput('<style>span{font-size: 14px;font-weight: bold;text-decoration: underline;font-style: italic;cursor: pointer;}</style>'+
                  '<script>function selectURL(){document.getElementById("oauthURL").select();document.execCommand("copy")}</script>'+
                  '<p>Copy & Paste The Below URL In <a href="'+validOauthUrl+'"><i>Valid OAuth Redirect URIs</i></a></p>'+
                  '<br /><span onclick="selectURL()">Copy to Clipboard</span><textarea type="text" id="oauthURL" style="width:100%;">'+Utilities.formatString("https://script.google.com/macros/d/%s/usercallback", ScriptApp.getScriptId())+
                  '</textarea>')
    .setWidth(450)
    .setHeight(200);
SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Valid OAuth Redirect URIs')
}

function prompt_withURL(prompt, url) {
 var htmlOutput = HtmlService
 .createHtmlOutput('<style>span{font-size: 14px;font-weight: bold;text-decoration: underline;font-style: italic;cursor: pointer;}</style>'+
                  '<script>function selectURL(){document.getElementById("oauthURL").select();document.execCommand("copy")}</script>'+
                  '<br /><span onclick="selectURL()">Copy to Clipboard</span><textarea type="text" id="oauthURL" style="width:100%;">'+ url +
                  '</textarea>')
    .setWidth(450)
    .setHeight(200);
SpreadsheetApp.getUi().showModalDialog(htmlOutput, prompt)
}
