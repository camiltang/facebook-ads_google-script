// ----- LOOP TO REQUEST ALL REPORTS AND SET ON SPREADSHEET --------------------------------------- 

function export_to_once() {
  data_fresh.clear()
  var results_export = extract_all_reportsandmerge();
  data_fresh.getRange(1, 1, results_export.length, results_export[0].length).setValues(results_export);
}

// ----- EXPORT ALL CSV REPORT AND MERGE THEM --------------------------------------- 



