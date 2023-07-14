import formatDate from "../utils";

class BaseSource {
  /**
     * Allow to process text from different sources, saving expenses 
     * records on a Google Sheet based on the recived text format
     *
  */

  /**
   * constructor description
   * @param  {[string]} text [formated text from the source]
   */
  constructor(text) {
    //class members. Should be private. 
    /** @private */
    this.text = text;
    /** @private */
    this.otrosSheet = SpreadsheetApp.openById(SETTINGS.getProperty('ssId')).getSheetByName('otros');
  }

  /**
   * Defined on the child class, this validates 
   * whatever it's needed to process the text
   */
  authenticate() {
    throw new Error("authenticate method needs to be implemented");
  }

  /**
   * Defined on the child class, this process a 
   * text to send a message back to the source
   * @param  {[string]} text [text to be send back to the source]
   */
  sendMessage(text) {
    throw new Error("sendMessage method needs to be implemented");
  }

  /**
   * Check if any current or incoming report
   */
  checkReport() {
    return (this.text == '/reporte' || this.otrosSheet.getRange('F3').getValue() == 'VERDADERO');
  }

  /**
   * Get currency information related to Bs/COP/Dolar 
   * from an S3 bucket where uptodate information it's 
   * being stored from the dolartoday.com web page
   */
  getCurrencyInfo() {
    const access_key = SETTINGS.getProperty('exchangeratesapiAccessKey');
    const exchangeUrl = `${SETTINGS.getProperty('exchangeUrl')}/latest?access_key=${access_key}&symbols =COP,VES,USD`;
    try {
      const response = UrlFetchApp.fetch(exchangeUrl);
      return JSON.parse(response.getContentText());
    } catch (error) {
      throw new Error("ERROR: Fallo al obtener la informacion de las tasas de cambio.");
    }
  }

  /**
   * Check if the amount of money to be saved it's higher than the one plan in the budget
   * If yes a warning message is sent to remind the current budget and that you are lower/higher
   * than the one set
   */
  checkBudget(montoDolares, category) {
    const budgetSheet = SpreadsheetApp.openById(SETTINGS.getProperty('ssId')).getSheetByName('Presupuesto');
    const currentDate = new Date().toLocaleDateString('en-GB');
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    this.otrosSheet.getRange('G3').setValue(firstDayOfMonth);
    this.otrosSheet.getRange('H3').setValue(currentDate);
    this.otrosSheet.getRange('I3').setValue(category);
    const dolarReportValue = parseFloat(this.otrosSheet.getRange('M3').getValue()) + parseFloat(montoDolares);
    budgetSheet.getRange('A3').setValue(category);
    const budgetDolares = parseFloat(budgetSheet.getRange('B3').getValue());
    if (budgetDolares > 0 && dolarReportValue > budgetDolares) {
      return "\n\n WARNING: Los gastos para la categoria " + category + " superan el presupuesto(" + budgetDolares + "$)" + " del presente mes.";
    }
    this.cleanReportCells(this.otrosSheet);
    return "";
  }

  /**
   * Check the text send from the source and proccess it 
   * to save a new expense record on the Google Sheet
   */
  proccessExpenseMessage() {
    try {
      const ssId = SETTINGS.getProperty('ssId');
      const expenseSheet = SpreadsheetApp.openById(ssId).getSheetByName('Gastos diarios');
      const nowDate = new Date();
      const date = formatDate(nowDate);
      const item = this.text.split(' - ');
      const monto = parseFloat(item[2]);

      const {
        pesos,
        dolares,
        bolivares,
        bsUsd,
        pesoBs,
        pesoUsd,
      } = this.checkCurrencyValues(monto, item[1]);

      // Check if the calculations went well
      if (pesos != null && dolares != null && bolivares != null && item.length == 4) {
        expenseSheet.appendRow([date, item[0], item[1], bolivares, pesos, dolares, item[3]]);
        const message = "Gasto guardado exitosamente!";
        const expenseAdded = "\n\nGASTO: fecha=" + date + " | Categoria=" + item[0] + "\n     dolares=" + dolares + ", pesos=" + pesos + ", bolivares=" + bolivares;
        const exchangeRates = "\nTasas de cambios: BS/USD=" + bsUsd.toFixed(2) + " | COP/BS=" + pesoBs.toFixed(2) + " | COP/USD=" + pesoUsd.toFixed(2);
        const budgetMessage = this.checkBudget(dolares, item[0]);
        this.sendMessage(message + expenseAdded + exchangeRates + budgetMessage);
      } else {
        throw new Error("ERROR: Verifique el formato del mensaje.");
      }
      
    } catch (error) {
      this.sendMessage(error.message);
    }
  }

  /**
   * Check and calculate the amount of money to be saved based on the exchange rates
   * taken from the exchangeratesapi.io API
   */
  checkCurrencyValues(monto, currency) {
    const currencyData = this.getCurrencyInfo();
    const rates = currencyData['rates'];
    const eurUsd = parseFloat(rates['USD']);
    const eurVes = parseFloat(rates['VES']);
    const bsUsd = parseFloat(rates['VES'])/eurUsd;
    const pesoUsd = parseFloat(rates['COP'])/eurUsd;
    const pesoBs = parseFloat(rates['COP'])/eurVes;
    let pesos = null;
    let dolares = null;
    let bolivares = null;

    // Calculate all the currences to keep a history record
    if (currency == 'Bolivar') {
      pesos = parseFloat(monto * pesoBs).toFixed(2);
      dolares = parseFloat(monto / bsUsd).toFixed(2);
      bolivares = monto;
    } else if (currency == 'Dolar') {
      pesos = parseFloat(monto * pesoUsd).toFixed(2);
      dolares = monto;
      bolivares = parseFloat(monto * bsUsd).toFixed(2);
    } else if (currency == 'Peso') {
      pesos = monto;
      dolares = parseFloat(monto / pesoUsd).toFixed(2);
      bolivares = parseFloat(monto / pesoBs).toFixed(2);
    }
    return {pesos, dolares, bolivares, bsUsd, pesoBs, pesoUsd};
  }

  /**
   * Set to their defaults value all report cells
   */
  cleanReportCells() {
    const dateIni = this.otrosSheet.getRange('G3');
    const dateEnd = this.otrosSheet.getRange('H3');
    const category = this.otrosSheet.getRange('I3');
    const notes = this.otrosSheet.getRange('J3');
    const statusReporte = this.otrosSheet.getRange('F3');

    dateIni.setValue('');
    dateEnd.setValue('');
    category.setValue('');
    notes.setValue('');
    statusReporte.setValue('FALSO');
  }

  /**
   * Use currency and calculations values to build the final 
   * reporting message that will be send to the source
   */
  buildfinalReportMessage() {
    try{
      var message = 'Reporte final ';

      const dateIni = Utilities.formatDate(new Date(this.otrosSheet.getRange('G3').getValue()), 'VET', 'MMMM dd, yyyy');
      var dateEnd = this.otrosSheet.getRange('H3').getValue();
      const category = this.otrosSheet.getRange('I3').getValue();
      const notes = this.otrosSheet.getRange('J3').getValue();
      const bsReportValue = this.otrosSheet.getRange('K3').getValue();
      const copReportValue = this.otrosSheet.getRange('L3').getValue();
      const dolarReportValue = this.otrosSheet.getRange('M3').getValue();

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
    } catch (error) {
      throw new Error("ERROR: Algo paso al construir el mensaje final del reporte.");
    }
  }

  /**
   * Check for the incoming cell to be fill,
   * the order for a report is: Date init -> Date end -> Category -> Note
   */
  findEmptyReportCell() {
    const dateIni = this.otrosSheet.getRange('G2:G3');
    const dateEnd = this.otrosSheet.getRange('H2:H3');
    const category = this.otrosSheet.getRange('I2:I3');
    const notes = this.otrosSheet.getRange('J2:J3');

    return (dateIni.getValues()[1][0] == '' && dateIni)
      || (dateEnd.getValues()[1][0] == '' && dateEnd)
      || (category.getValues()[1][0] == '' && category)
      || (notes.getValues()[1][0] == '' && notes)
  }

  /**
   * Check if the report just start or it's in process,
   * then fill the next cell in order
   */
  processReport() {
    let message = null;
    try {
      // If it just start send the respective message 
      // and start asking for next cell to be filled out
      if (this.text == '/reporte') {
        const statusReporte = this.otrosSheet.getRange('F3');
        this.cleanReportCells(this.otrosSheet);
        statusReporte.setValue('VERDADERO');
        message = "El reporte ah iniciado...";
        this.sendMessage(message);
      } else {
        // If the report it's in progress it continues filling out the next cell
        this.fillReportCell(this.otrosSheet);
      }

      // at the end of the process we ask for the next incoming cell
      const currentCell = this.findEmptyReportCell(this.otrosSheet);
      if (currentCell) {
        message = "Ingrese " + currentCell.getValues()[0][0] + ":";
        this.sendMessage(message);
      } else {

        // But if the report it's done we build the 
        // final report result in a single text format
        message = this.buildfinalReportMessage();
        this.sendMessage(message);

        // and clean the cells for a next report
        this.cleanReportCells(otrosSheet);
      }
    } catch (error) {
      this.sendMessage(error.message);
    }
  }

  /**
   * Fill the next empty cell in order in order to build a report
   */
  fillReportCell() {
    const currentCell = this.findEmptyReportCell(this.otrosSheet);
    var values = currentCell.getValues();
    values[1][0] = this.text;
    currentCell.setValues(values);
  }

  cleanReport() {
    const statusReporte = this.otrosSheet.getRange('F3');
    if (statusReporte.getValue() == 'VERDADERO') {
      this.cleanReportCells(this.otrosSheet);
      this.sendMessage("El reporte ah finalizado brother!");
    }
  }
}

export default BaseSource;
