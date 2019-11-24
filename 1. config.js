// ----- Settings --------------------------------------- 

// Spreadsheet information
var ss = SpreadsheetApp.getActive();
var config = ss.getSheetByName("Config");
var data_fresh = ss.getSheetByName("Data.fresh");
var data_persistant = ss.getSheetByName("Data.persistent");

var accountsrange = config.getRange("A1:C6")
var accounts = accountsrange.getValues(); // [['account', 'account id', 'report id'],['ref', 123, 123]];

// Facebook App Oauth
var CLIENT_ID = '';
var CLIENT_SECRET = '';

// Facebook token
var TOKEN = run();

// ad, adset, campaign, account
var LEVEL = 'campaign'

// Date_preset on Facebook reference
var DATE_RANGE = 'last_28d'

// TIMERANGE overrides DATE_RANGE if uncommented on Facebook reference
var today = new Date();
var start = new Date();
start.setDate(start.getDate() - 30);
var TIMERANGE = "{'since':'" + formatDate(start) + "','until':'" + formatDate(today) + "'}";

// Field request
var FIELDS = 'account_name,account_id,campaign_name,campaign_id,objective,spend,impressions,actions,action_values'

// Set header here, as they usually appear on report. Matching all columns your FIELDS generate
// Careful of currency in Amount Spent.
var header = ['Account ID', 'Account Name', 'Campaign Name', 'Campaign ID', 'Objective', 'Reporting Starts', 'Reporting Ends', 'Amount Spent (USD)', 'Impressions', 'Video Watches at 25%', 'Video Watches at 50%', 'Video Watches at 75%', 'Video Watches at 95%', 'Video Watches at 100%', 'ThruPlays',  '3-Second Video Views', 'Post Reactions', 'Post Comments', 'Post Shares', 'Page Likes', 'Link Clicks', 'Page Engagement', 'Post Engagement', 'Landing Page Views', 'Post Saves', 'Searches', 'Content Views', 'Purchases','Purchases Conversion Value', 'Adds to Cart', 'Adds to Cart Conversion Value']

// set to 1 for daily, value between 1 to 90
var TIME_INCREMENT = '1' 

// Filters
var FILTERING = ''
