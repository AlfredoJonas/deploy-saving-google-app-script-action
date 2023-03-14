class TelegramBot extends BaseSource {
  constructor(text, telegramUserId) {
    super(text);
    //class members. Should be private. 
    // Used as a string field to check which telegram users has access to this service
    /** @private */
    this.telegramUserId = "" + telegramUserId;
  }

  authenticate() {
    return SETTINGS.getProperty('telegramUserIds').split(',').includes(this.telegramUserId);
  }

  sendMessage(text) {
    const url = SETTINGS.getProperty('telegramUrl') + SETTINGS.getProperty('telegramToken') + '/sendMessage?chat_id=' + this.telegramUserId + '&text=' + text;
    UrlFetchApp.fetch(url);
  }
}
