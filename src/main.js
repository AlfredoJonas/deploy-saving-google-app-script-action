const PROPERTIES = PropertiesService.getScriptProperties();

function setWebhook() {
  const webAppUrl = PROPERTIES.getProperty('webAppUrl');
  const url = PROPERTIES.getProperty('telegramUrl') + PROPERTIES.getProperty('telegramToken') + '/setWebhook?url=' + webAppUrl;
  UrlFetchApp.fetch(url);
}

function doPost(e) {
  const contents = JSON.parse(e.postData.contents);
  const text = contents.message.text;
  const telegramBot = new TelegramBot(text, contents.message.from.id);
  if (telegramBot.authenticate()) {
    if (text == '/finreporte') {
      telegramBot.cleanReport();
    } else if (telegramBot.checkReport()) {
      telegramBot.processReport();
    } else {
      telegramBot.proccessExpenseMessage();
    }
  } else {
    telegramBot.sendMessage("ACCESS ERROR: you can't use this service.");
  }
}
