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
      const monto = parseFloat(item[2]).toFixed(2);
      const currencyData = this.getCurrencyInfo();
      const rates = currencyData['rates'];
      const eurUsd = parseFloat(rates['USD']);
      const eurVes = parseFloat(rates['VES']);
      const bsUsd = parseFloat(rates['VES'])/eurUsd;
      const pesoUsd = parseFloat(rates['COP'])/eurUsd;
      const pesoBs = parseFloat(rates['COP'])/eurVes;
      let pesos = null;
      let dolar = null;
      let bolivar = null;
      let message = null;

      // Calculate all the currences to keep a history record
      if (item[1] == 'Bolivar') {
        pesos = parseFloat(monto * pesoBs).toFixed(2);
        dolar = parseFloat(monto / bsUsd).toFixed(2);
        bolivar = monto;
      } else if (item[1] == 'Dolar') {
        pesos = parseFloat(monto * pesoUsd).toFixed(2);
        dolar = monto;
        bolivar = parseFloat(monto * bsUsd).toFixed(2);
      } else if (item[1] == 'Peso') {
        pesos = monto;
        dolar = parseFloat(monto / pesoUsd).toFixed(2);
        bolivar = parseFloat(monto / pesoBs).toFixed(2);
      }

      // Check if the calculations went well
      if (pesos != null && dolar != null && bolivar != null && item.length == 4) {
        expenseSheet.appendRow([date, item[0], item[1], bolivar, pesos, dolar, item[3]]);
        message = "Gasto guardado exitosamente. Tipo de cambios: BS/USD=" + bsUsd.toFixed(2) + " COP/BS=" + pesoBs.toFixed(2) + " COP/USD=" + pesoUsd.toFixed(2);
        this.sendMessage(message);
        return {success: true, message};
      } else {
        throw new Error("ERROR: Verifique el formato del mensaje.");
      }
      
    } catch (error) {
      console.log(error);
      this.sendMessage(error.message);
    }
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
      console.log(error);
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
