import { TelegramBot } from "../src/sources/telegramBot.js";

test('Check telegram bot expensive saving', function () {
    const telegramBot = TelegramBot(contents.message.text, contents.message.from.id);

    const response = telegramBot.proccessExpenseMessage();

	expect(response['success']).toBe(true);
});
