import jest from "jest-mock";
import MockedBaseSource from "./mocks";

test('Process an expensive record with a good format', () => {
    const telegramBot = new MockedBaseSource("Conocimiento - Peso - 60000 - Inscripción ídem y Jonás curso canino");
    telegramBot.sendMessage = jest.fn();
    telegramBot.proccessExpenseMessage();
	expect(telegramBot.sendMessage).toBeCalledWith("Gasto guardado exitosamente. Tipo de cambios: Bs/USD=24.95 Bs/COP=174 USD/COP=4640");
});

test('Process an expensive record with wrong text format', () => {
    const telegramBot = new MockedBaseSource("Conocimiento - 60000 - Inscripción ídem y Jonás curso canino");
    telegramBot.sendMessage = jest.fn();
    telegramBot.proccessExpenseMessage();
    expect(telegramBot.sendMessage).toBeCalledWith("ERROR: Verifique el formato del mensaje.");
});

test('New report', () => {
    const telegramBot = new MockedBaseSource("/report");
    telegramBot.sendMessage = jest.fn();
    telegramBot.processReport();
    expect(telegramBot.sendMessage).toBeCalledWith("Ingrese key:");
});

test('Clean started report', () => {
    const telegramBot = new MockedBaseSource("/finreporte");
    telegramBot.sendMessage = jest.fn();
    telegramBot.cleanReport();
    expect(telegramBot.sendMessage).toBeCalledWith("El reporte ah finalizado brother!");
});

test('Currency source fails', () => {
    global.UrlFetchApp = {
        fetch: () => {
            throw new Error("ERROR: Fallo al obtener la informacion de las tasas de cambio.");
        },
    };
    const telegramBot = new MockedBaseSource("Conocimiento - Peso - 60000 - Inscripción ídem y Jonás curso canino");
    telegramBot.sendMessage = jest.fn();
    telegramBot.proccessExpenseMessage();
	expect(telegramBot.sendMessage).toBeCalledWith("ERROR: Fallo al obtener la informacion de las tasas de cambio.");
})

// Build test for proccessing an entire report with all the steps
