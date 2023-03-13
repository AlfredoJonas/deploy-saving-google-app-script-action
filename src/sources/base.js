class BaseSource {
  constructor(text) {
    this.ssId = PROPERTIES.getProperty('ssId');;
    this.text = text;
  }

  authenticate() {
    throw new Error("authentnicate method needs to be implemented");
  }

  sendMessage(text = null) {
    throw new Error("sendMessage method needs to be implemented");
  }

  checkReport() {
    const otrosSheet = SpreadsheetApp.openById(this.ssId).getSheetByName('otros');
    return (this.text == '/reporte' || otrosSheet.getRange('F3').getValue() == 'VERDADERO');
  }

  getCurrencyInfo() {
    const response = UrlFetchApp.fetch(PROPERTIES.getProperty('exchangeUrl'));
    return JSON.parse(response.getContentText());
  }

  proccessExpenseMessage() {
    const response = {
      success: false,
      message: null
    };
    
    const expenseSheet = SpreadsheetApp.openById(this.ssId).getSheetByName('Gastos diarios');
    const nowDate = new Date();
    const date = formatDate(nowDate);
    const item = this.text.split(' - ');
    const monto = parseFloat(item[2]);
    const currencyData = this.getCurrencyInfo();
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
    } else if (item[1] == 'Dolar') {
      pesos = parseFloat(monto * usdPesos);
      dolar = monto;
      bolivar = parseFloat(monto * bsUsd);
    } else if (item[1] == 'Peso') {
      pesos = monto;
      dolar = parseFloat(monto / usdPesos);
      bolivar = parseFloat(monto / bsPesos);
    }
    if (pesos != null && dolar != null && bolivar != null && item.length == 4) {
      expenseSheet.appendRow([date, item[0], item[1], bolivar, pesos, dolar, item[3]]);
      const message = "Gasto guardado exitosamente. Tipo de cambios: Bs/USD=" + bsUsd + " Bs/COP=" + bsPesos + " USD/COP=" + usdPesos;
      response['success'] = true;
      response['message'] = message;
      this.sendMessage(message);
    } else {
      const message = "ERROR: Verifique el formato del mensaje.";
      response['message'] = message;
      this.sendMessage(message);
    }
    return response;
  }

  cleanReportCells(otrosSheet) {
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


  buildfinalReportMessage(otrosSheet) {
    var message = 'Reporte final ';
    const dateIni = Utilities.formatDate(new Date(otrosSheet.getRange('G3').getValue()), 'VET', 'MMMM dd, yyyy');
    var dateEnd = otrosSheet.getRange('H3').getValue();
    const category = otrosSheet.getRange('I3').getValue();
    const notes = otrosSheet.getRange('J3').getValue();
    const bsReportValue = otrosSheet.getRange('K3').getValue();
    const copReportValue = otrosSheet.getRange('L3').getValue();
    const dolarReportValue = otrosSheet.getRange('M3').getValue();

    if (dateEnd == '-') {
      message += 'para ' + dateIni;
    } else {
      dateEnd = Utilities.formatDate(new Date(dateEnd), 'VET', 'MMMM dd, yyyy');
      message += 'desde ' + dateIni;
      message += ' hasta ' + dateEnd;
    }
    if (category != '-') {
      message += ' en categoria ' + category;
    }
    if (notes != '-') {
      message += ' y contiene la nota ' + notes + ':';
    }
    message += " Bs=" + parseFloat(bsReportValue).toFixed(2) + " COP=" + parseFloat(copReportValue).toFixed(2) + " USD=" + parseFloat(dolarReportValue).toFixed(2);
    return message;
  }

  findEmptyReportCell(otrosSheet) {
    const dateIni = otrosSheet.getRange('G2:G3');
    const dateEnd = otrosSheet.getRange('H2:H3');
    const category = otrosSheet.getRange('I2:I3');
    const notes = otrosSheet.getRange('J2:J3');

    return (dateIni.getValues()[1][0] == '' && dateIni)
      || (dateEnd.getValues()[1][0] == '' && dateEnd)
      || (category.getValues()[1][0] == '' && category)
      || (notes.getValues()[1][0] == '' && notes)
  }

  processReport() {
    const otrosSheet = SpreadsheetApp.openById(this.ssId).getSheetByName('otros');
    if (this.text == '/reporte') {
      statusReporte = otrosSheet.getRange('F3');
      this.cleanReportCells(otrosSheet);
      statusReporte.setValue('VERDADERO');
      this.sendMessage("El reporte ah iniciado...");
    } else {
      this.fillReportCell(otrosSheet);
    }
    const currentCell = this.findEmptyReportCell(otrosSheet);
    if (currentCell) {
      this.sendMessage("Ingrese " + currentCell.getValues()[0][0] + ":");
    } else {
      const finalReportMessage = this.buildfinalReportMessage(otrosSheet)
      this.sendMessage(finalReportMessage);
      this.cleanReportCells(otrosSheet);
    }
  }

  fillReportCell(otrosSheet) {
    const currentCell = this.findEmptyReportCell(otrosSheet);
    var values = currentCell.getValues();
    values[1][0] = this.text;
    currentCell.setValues(values);
  }

  cleanReport() {
    const otrosSheet = SpreadsheetApp.openById(this.ssId).getSheetByName('otros');
    const statusReporte = otrosSheet.getRange('F3');
    if (statusReporte.getValue() == 'VERDADERO') {
      this.cleanReportCells(otrosSheet);
      this.sendMessage("El reporte ah finalizado brother!");
    }
  }
}