class TelegramBot extends BaseSource {
    constructor(text, telegramUserId) {
        super(text);
        this.telegramUserId = new String(telegramUserId);
    }

    authenticate() {
        return PROPERTIES.getProperty('telegramUserIds').split(',').includes(this.telegramUserId);
    }

    sendMessage(text = null) {
        const url = telegramUrl + '/sendMessage?chat_id=' + this.telegramUserId + '&text='+ text || this.text;
        UrlFetchApp.fetch(url);
    }
}
