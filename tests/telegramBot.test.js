import jest from "jest-mock";
import TelegramBot from "../src/sources/telegramBot";
import "./mocks";

test('Check telegram good authentication', () => {
    const telegramBot = new TelegramBot("Conocimiento - Peso - 60000 - Inscripción ídem y Jonás curso canino", 15123);
    const response = telegramBot.authenticate();
	expect(response).toBe(true);
});

test('Check telegram bad authentication', () => {
    const telegramBot = new TelegramBot("Conocimiento - Peso - 60000 - Inscripción ídem y Jonás curso canino", 32151);
    const response = telegramBot.authenticate();
	expect(response).toBe(false);
});


test('Throw error when sending a message but the telegram bot api fails', () => {
    global.UrlFetchApp = {
        fetch: () => {
            throw new Error("http error, the source does not exist");
        },
    };
    const telegramBot = new TelegramBot("Any message", 5123213);
    console.log = jest.fn();
    telegramBot.sendMessage("some message");
    expect(console.log).toBeCalledWith("http error, the source does not exist | ERROR: Fallo al enviar el mensaje: some message");
});
