function onOpen(e) {
  SpreadsheetApp.getUi()
    .createMenu('Dyson Report')
    .addItem('Request Report', 'runreports')
    .addItem('Import Report', 'exportMerge')
    .addSeparator()
    .addItem('Initialize Facebook App', 'facebook_app_setup')
    .addItem('Oauth Authentificationn', 'run')  
    .addToUi();
}

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}
