class TelegramBot extends BaseSource {
    constructor(text, telegramUserId) {
        super(text);
        this.telegramUserId = telegramUserId;
    }

    authenticate() {
        return PropertiesService.getScriptProperties().getProperty('telegramUserIds').split(',').includes(this.telegramUserId);
    }

    sendMessage() {
        const url = telegramUrl + '/sendMessage?chat_id=' + this.telegramUserId + '&text='+ this.text;
        UrlFetchApp.fetch(url);
    }
}
