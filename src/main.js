function setWebhook() {
  const properties = PropertiesService.getScriptProperties();
  const telegramUrl = properties.getProperty('telegramUrl') + properties.getProperty('telegramToken');
  const webAppUrl = properties.getProperty('webAppUrl');
  const url = telegramUrl + '/setWebhook?url=' + webAppUrl;
  UrlFetchApp.fetch(url);
}

function doPost(e) {
  const contents = JSON.parse(e.postData.contents);
  telegramBot = TelegramBot(contents.message.text, contents.message.from.id);
  if (telegramBot.authenticate()) {
    if (text == '/finreporte') {
      telegramBot.cleanReport();
    } else if (telegramBot.checkReport()) {
      telegramBot.processReport();
    } else {
      telegramBot.proccessExpenseMessage();
    }
  } else {
      sendMessage(id, "ACCESS ERROR: you can't use this service.");
  }
}
