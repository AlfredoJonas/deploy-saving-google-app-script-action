const SETTINGS = PropertiesService.getScriptProperties();

 /**
   * Used as a single call from the Google AppScript IDE to 
   * set a webhook from telegram back to the google script
   */
function setWebhook() {
  const webAppUrl = SETTINGS.getProperty('webAppUrl');
  const url = SETTINGS.getProperty('telegramUrl') + SETTINGS.getProperty('telegramToken') + '/setWebhook?url=' + webAppUrl;
  UrlFetchApp.fetch(url);
}

/**
   * Callback listener for Telegram source
   * @param  {[object]} e [Contains all related telegram new incoming message info]
   */
function doPost(e) {

  // Extract info from telegram bot source callback
  const contents = JSON.parse(e.postData.contents);
  const text = contents.message.text;

  // From telegram bot source we build the required object to process 
  // the text and save or generate report for expenses info
  const telegramBot = new TelegramBot(text, contents.message.from.id);

  // Checking if the user is authorized to use this service
  if (telegramBot.authenticate()) {

  // Check what type of action is asking the user
    if (text == '/finreporte') {
      telegramBot.cleanReport();
    } else if (telegramBot.checkReport()) {
      telegramBot.processReport();
    } else {
      telegramBot.proccessExpenseMessage();
      console.info(response);
    }
  } else {
    // UNAUTHORIZED
    telegramBot.sendMessage("ACCESS ERROR: you can't use this service.");
  }
}
