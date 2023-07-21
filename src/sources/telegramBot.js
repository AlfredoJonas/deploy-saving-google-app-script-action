import BaseSource from "./base";

class TelegramBot extends BaseSource {
  constructor(text, telegramUserId) {
    super(text);
    //class members. Should be private. 
    // Used as a string field to check which telegram users has access to this service
    /** @private */
    this.telegramUserId = "" + telegramUserId;
    this.telegramUrl = SETTINGS.getProperty('telegramUrl') + SETTINGS.getProperty('telegramToken') + '/sendMessage?chat_id=' + this.telegramUserId;
  }

  authenticate() {
    return SETTINGS.getProperty('telegramUserIds').split(',').includes(this.telegramUserId);
  }

  sendMessage(text) {
    try {
      UrlFetchApp.fetch(this.telegramUrl + '&text=' + encodeURI(text));
    } catch (error) {
      console.log(error.message + ' | ' + "ERROR: Fallo al enviar el mensaje: " + encodeURI(text));
    }
  }
}

export default TelegramBot;