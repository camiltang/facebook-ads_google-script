// ----- CODE TO REQUEST REPORT --------------------------------------- 

function requestFacebookReport(AD_ACCOUNT_ID) { // Date object
  // Format dates for API call
  
 // Builds the Facebook Ads Insights API URL
  var facebookUrl = 
    'https://graph.facebook.com/v5.0' + 
    '/act_' + AD_ACCOUNT_ID +
    '/insights?level=' + LEVEL +
    '&fields=' + FIELDS +
    '&date_preset=' + DATE_RANGE +  
    '&access_token=' + TOKEN +
    '&time_increment=' + TIME_INCREMENT +
    '&filtering=' + FILTERING +
    '&limit=1000';
  var encodedFacebookUrl = encodeURI(facebookUrl);
  var options = {
    'method' : 'post',
        'muteHttpExceptions' : true

  };
  
  // Fetches & parses the URL 
  var fetchRequest = UrlFetchApp.fetch(encodedFacebookUrl, options);
  var results = JSON.parse(fetchRequest.getContentText());
  var reportId = results.report_run_id;
  
  // Return Report ID
  return reportId;
}

// ----- CODE TO EXPORT REPORT --------------------------------------- 

function extractReport(reportId) { 
  // Fetches the report as a csv file
  var url = 'https://www.facebook.com/ads/ads_insights/export_report?report_run_id=' + reportId + '&format=csv' + '&access_token=' + TOKEN;
  
  var options = {
    'muteHttpExceptions': true
  };
  
  var request = UrlFetchApp.fetch(url, options);
  try {
    //var fetchRequest = request.getContentText();
    var results = Utilities.parseCsv(request);
  }
  catch (err) {
    Logger.log(accounts[i][0]);
    Logger.log(request.getResponseCode());
  }
  return results;
}