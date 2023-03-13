const PROPERTIES = PropertiesService.getScriptProperties();
const telegramUrl = PROPERTIES.getProperty('telegramUrl') + properties.getProperty('telegramToken');

function setWebhook() {
  const webAppUrl = properties.getProperty('webAppUrl');
  const url = telegramUrl + '/setWebhook?url=' + webAppUrl;
  UrlFetchApp.fetch(url);
}

function doPost(e) {
  const contents = JSON.parse(e.postData.contents);
  const telegramBot = new TelegramBot(contents.message.text, contents.message.from.id);
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
