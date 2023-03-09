const properties = PropertiesService.getScriptProperties();
const telegramUrl = properties.getProperty('telegramUrl') + properties.getProperty('telegramToken');
const webAppUrl = properties.getProperty('webAppUrl');
const ssId = properties.getProperty('ssId');
const exchangeUrl = properties.getProperty('exchangeUrl');
const telegramUserId1 = properties.getProperty('telegramUserId1');
const telegramUserId2 = properties.getProperty('telegramUserId2');

function setWebhook() {
  const url = telegramUrl + '/setWebhook?url=' + webAppUrl;
  UrlFetchApp.fetch(url);
}

function sendMessage(id, text) {
  const url = telegramUrl + '/sendMessage?chat_id=' + id + '&text='+ text;
  UrlFetchApp.fetch(url);
}

function getCurrencyInfo(){
  const response = UrlFetchApp.fetch(exchangeUrl);
  return JSON.parse(response.getContentText());
}

function formatDate(date) {
  return date.getFullYear()+"/"+(parseInt(date.getMonth())+1)+"/"+date.getDate();
}

function proccessExpenseMessage(text, id){
  const expenseSheet = SpreadsheetApp.openById(ssId).getSheetByName('Gastos diarios');
  const nowDate = new Date();
  const date = formatDate(nowDate);
  const item = text.split(' - ');
  const monto = parseFloat(item[2]);
  const currencyData = getCurrencyInfo();
  const bsUsd = parseFloat(currencyData['USD']['promedio']);
  const bsPesos = parseFloat(currencyData['COL']['compra']);
  const usdPesos = parseFloat(currencyData['USDCOL']['ratetrm']);
  var pesos = null;
  var dolar = null;
  var bolivar = null;
  
  if (item[1] == 'Bolivar') {
    pesos = parseFloat(monto * bsPesos);
    dolar = parseFloat(monto / bsUsd);
    bolivar = monto;
  } else if(item[1] == 'Dolar') {
    pesos = parseFloat(monto * usdPesos);
    dolar = monto;
    bolivar = parseFloat(monto * bsUsd);
  } else if(item[1] == 'Peso') {
    pesos = monto;
    dolar = parseFloat(monto / usdPesos);
    bolivar = parseFloat(monto / bsPesos);
  }
  if(pesos != null && dolar != null && bolivar != null && item.length == 4){
    expenseSheet.appendRow([date, item[0], item[1], bolivar, pesos, dolar, item[3]]);
    sendMessage(id, "Gasto guardado exitosamente. Tipo de cambios: Bs/USD="+bsUsd+" Bs/COP="+bsPesos+" USD/COP="+usdPesos);
  } else {
    sendMessage(id, "ERROR: Verifique el formato del mensaje.");
  }
}

function findEmptyReportCell(otrosSheet) {
  const dateIni = otrosSheet.getRange('G2:G3');
  const dateEnd = otrosSheet.getRange('H2:H3');
  const category = otrosSheet.getRange('I2:I3');
  const notes = otrosSheet.getRange('J2:J3');

  return (dateIni.getValues()[1][0] == '' && dateIni)
      || (dateEnd.getValues()[1][0] == '' && dateEnd)
      || (category.getValues()[1][0] == '' && category)
      || (notes.getValues()[1][0] == '' && notes)
}

function fillReportCell(otrosSheet, text) {
  const currentCell = findEmptyReportCell(otrosSheet);
  var values = currentCell.getValues();
  values[1][0] = text; 
  currentCell.setValues(values);
}

function buildfinalReportMessage(otrosSheet) {
  var message = 'Reporte final ';
  const dateIni = Utilities.formatDate(new Date(otrosSheet.getRange('G3').getValue()), 'VET', 'MMMM dd, yyyy');
  var dateEnd = otrosSheet.getRange('H3').getValue();
  const category = otrosSheet.getRange('I3').getValue();
  const notes = otrosSheet.getRange('J3').getValue();
  const bsReportValue = otrosSheet.getRange('K3').getValue();
  const copReportValue = otrosSheet.getRange('L3').getValue();
  const dolarReportValue = otrosSheet.getRange('M3').getValue();

  if (dateEnd == '-') {
    message += 'para '+dateIni;
  } else {
    dateEnd = Utilities.formatDate(new Date(dateEnd), 'VET', 'MMMM dd, yyyy');
    message += 'desde '+dateIni;
    message += ' hasta '+dateEnd;
  }
  if (category != '-') {
    message += ' en categoria '+category;
  }
  if (notes != '-') {
    message += ' y contiene la nota '+notes+':';
  }
  message += " Bs="+parseFloat(bsReportValue).toFixed(2)+" COP="+parseFloat(copReportValue).toFixed(2)+" USD="+parseFloat(dolarReportValue).toFixed(2);
  return message;
}

function processReport(text, id) {
  const otrosSheet = SpreadsheetApp.openById(ssId).getSheetByName('otros');
  if (text == '/reporte') {
    statusReporte = otrosSheet.getRange('F3');
    cleanReportCells(otrosSheet);
    statusReporte.setValue('VERDADERO');
    sendMessage(id, "El reporte ah iniciado...");
  } else {
    fillReportCell(otrosSheet, text);
  }
  const currentCell = findEmptyReportCell(otrosSheet);
  if (currentCell) {
    sendMessage(id, "Ingrese "+currentCell.getValues()[0][0]+":");
  } else {
    const finalReportMessage = buildfinalReportMessage(otrosSheet)
    sendMessage(id, finalReportMessage);
    cleanReportCells(otrosSheet);
  }
}

function cleanReportCells(otrosSheet) {
  const dateIni = otrosSheet.getRange('G3');
  const dateEnd = otrosSheet.getRange('H3');
  const category = otrosSheet.getRange('I3');
  const notes = otrosSheet.getRange('J3');
  const statusReporte = otrosSheet.getRange('F3');

  dateIni.setValue('');
  dateEnd.setValue('');
  category.setValue('');
  notes.setValue('');
  statusReporte.setValue('FALSO');
}

function cleanReport(id) {
  const otrosSheet = SpreadsheetApp.openById(ssId).getSheetByName('otros');
  const statusReporte = otrosSheet.getRange('F3');
  if (statusReporte.getValue() == 'VERDADERO') {
    cleanReportCells(otrosSheet);
    sendMessage(id, "El reporte ah finalizado brother!");
  }
}

function checkReport(text) {
  const otrosSheet = SpreadsheetApp.openById(ssId).getSheetByName('otros');
  return (text == '/reporte' || otrosSheet.getRange('F3').getValue() == 'VERDADERO');
}

function doPost(e) {
  const contents = JSON.parse(e.postData.contents);
  const id = contents.message.from.id;
  if (id == telegramUserId1 || id == telegramUserId2) {
    const text = contents.message.text;
    
    if (text == '/finreporte') {
      cleanReport(id);
    } else if (checkReport(text)) {
      processReport(text, id);
    } else {
      proccessExpenseMessage(text, id);
    }
  } else {
      sendMessage(id, "ACCESS ERROR: you can't use this bot.");
  }
}
