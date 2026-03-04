// ----- LOOP TO REQUEST ALL REPORTS AND SET ON SPREADSHEET --------------------------------------- 

function request_all_reports() {
  var range = accountsrange;
  var table = accounts;

  for (var i = 1; i < table.length; i++) {
    var AD_ACCOUNT_ID = table[i][1];
    var reportId = requestFacebookReport(AD_ACCOUNT_ID);
    table[i][2] = reportId;
  }
  range.setValues(table)
}

// ----- EXPORT ALL CSV REPORT AND MERGE THEM --------------------------------------- 

function extract_all_reportsandmerge() {
  var range = accountsrange;
  var table = accounts;
  var allresults = []
  allresults.push(header);
  
  for (var i = 1; i < table.length; i++) {
    
    var reportId = table[i][2];
    var results = extractReport(reportId)
    var allresults = merger(header,allresults,results)
    
    }
  
  return allresults

}

function merger(header, table, values) {
  var merged_table = table;
  for (var i = 1; i < values.length; i++) {
    var row = [];
    for (var z = 0; z < header.length; z++) {
      var index = values[0].indexOf(header[z]);
      var id_text = ' ID'
      var id_index = id_text.indexOf(header[z]);
      if (index === -1) {
        row.push('');
      }
      else {
        row.push(values[i][index])
      }
    }
    merged_table.push(row);
  }
  return merged_table;
}