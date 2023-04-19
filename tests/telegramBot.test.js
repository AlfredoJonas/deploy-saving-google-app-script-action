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
