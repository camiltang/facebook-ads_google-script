# Facebook Ads Insight on Google App Script

This script request data from Facebook Inisght API v5.0 asynchronous and imports in a Google Sheet. Based on a multi-account set up, merging multiple accounts report into a single sheet.  

## Getting Started

These instructions will get you a copy of the project up and running on your own google sheet and Facebook App. Each file should live within a single Google Script *(File > New > Script File)* but can also be combined. 

### How to run

1. Set up Facebook App on first execution. *See below*
2. Configure the script in Config. *See below*
3. Run the request function `request_all_reports()` to request reports. 
4. Run one of the extract functions to export reports, this should run after the request function to let the asynchronous request complete. On average, 30s is enough delay, although depending on the number of accounts and complexity of data. 
  -  `export_to_once()` allow to export reports to one sheet, clearing the old content.
  -  other function soon

### Facebook App Set Up

For this script to work, you'll need to set up a Facebook App adding the Marketing API product. 
This current set up of the script is also set up to make Oauth 2.0 request to Facebook API using [gsuitedevs/apps-script-oauth2 library](https://github.com/gsuitedevs/apps-script-oauth2/blob/master/samples/Facebook.gs).

1. Create [Facebook App](https://developers.facebook.com/apps/). 
2. Add both Marketing API and Facebook Login as products
3. In Facebook Log-in Product add the following URL (1) in **Valid OAuth Redirect URIs**. You may also get URL by running facebook_app_setup function in Oauth file. 

(1) : https://script.google.com/macros/d/{{google_script_id}}/usercallback

### Script Set Up

All settings are contained within the Config file. 

1. Facebook App Oauth section relates to your Facebook App. 
  - Add [gsuitedevs/apps-script-oauth2 library](https://github.com/gsuitedevs/apps-script-oauth2/blob/master/samples/Facebook.gs) to your script.
2. Facebook token is automatically set by Oauth, but could be set manually for short projects. 
3. Set Spreadsheet information at top based on numbers of account you have. 
4. `var header` should contain all fields you wish to include, in order, as displayed in your normal report. For example, cost should be "Amount Spent (USD)". `FIELDS` should still include these metrics/dimension. 
5. Refer to [Facebook Docs](https://developers.facebook.com/docs/marketing-api/insights/parameters/v5.0)  for all other fields including : `LEVEL`, `DATE_RANGE`, `FIELDS`, `TIME_INCREMENT`, `FILTERING`
6. `TIMERANGE` is left as reference, although not in use in the current version of `requestFacebookReport()`. If added, would overide `DATE_RANGE`. It enables more flexibility in dates, as well as being able to include Today data in the request. 
