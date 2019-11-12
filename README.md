# Facebook Ads Insight on Google App Script

This script request data from Facebook Inisght API v5.0 asyncronus and imports in a Google Sheet. 

## Facebook App Set Up

For this script to work, you'll need to set up a Facebook App and [facebook | apps-script-oauth2](https://github.com/gsuitedevs/apps-script-oauth2/blob/master/samples/Facebook.gs). Adding both Marketing API product.

## Insight Set Up

*

## Limitations

*
*

## Token Setup

Additionnaly, you may replace static token with Oauth2 from google [facebook | apps-script-oauth2](https://github.com/gsuitedevs/apps-script-oauth2/blob/master/samples/Facebook.gs). 

1. Insert *script.google.com* in the App Domains
2. Add both Marketing API and Facebook Login as products
3. Add GoogleSheet Macro URL(i) in *Valid OAuth Redirect URIs* of Facebook Log In

```javascript
// Replce the run function of the original scipt to this and use run() to return token. 
function run() {
  var service = getService();
  if (service.hasAccess()) {
    var token = PropertiesService.getUserProperties().getProperty('oauth2.Facebook');
    token = JSON.parse(token);
    return token.access_token;
  }
  else {
    var authorizationUrl = service.getAuthorizationUrl();
    Logger.log('Open the following URL and re-run the script: %s', authorizationUrl);
  }
}
```
