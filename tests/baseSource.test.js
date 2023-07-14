import jest from "jest-mock";
import MockedBaseSource from "./mocks";

test.skip('Process an expensive record with a good format and budget', () => {
    const telegramBot = new MockedBaseSource("Conocimiento - Peso - 60000 - Inscripción ídem y Jonás curso canino");
    telegramBot.sendMessage = jest.fn();
    telegramBot.proccessExpenseMessage();
	expect(telegramBot.sendMessage).toHaveBeenCalledTimes(1);
    const message = "Gasto guardado exitosamente!";
    const expenseAdded = "\n  GASTO: fecha=2023/7/14 | Categoria=Conocimiento | dolares=14.31, pesos=60000, bolivares=403.25";
    const exchangeRates = "\n  Tasas de cambios: BS/USD=28.17 | COP/BS=148.79 | COP/USD=4191.66";
	expect(telegramBot.sendMessage).toHaveBeenCalledWith(message + expenseAdded + exchangeRates);
});


test.skip('Process an expensive record with a good format and higher amount than budget', () => {
    const telegramBot = new MockedBaseSource("Conocimiento - Peso - 60000 - Inscripción ídem y Jonás curso canino");
    telegramBot.sendMessage = jest.fn();
    let budget = 0;
    global.SpreadsheetApp.constants.budget = budget = 12.5;
    telegramBot.proccessExpenseMessage();
    const message = "Gasto guardado exitosamente!";
    const expenseAdded = "\n  GASTO: fecha=2023/7/14 | Categoria=Conocimiento | dolares=14.31, pesos=60000, bolivares=403.25";
    const exchangeRates = "\n  Tasas de cambios: BS/USD=28.17 | COP/BS=148.79 | COP/USD=4191.66";
	expect(telegramBot.sendMessage).toHaveBeenNthCalledWith(1, message + expenseAdded + exchangeRates);
	expect(telegramBot.sendMessage).toHaveBeenNthCalledWith(2, `WARNING: El monto ingresado supera el presupuesto de ${budget}$`);
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
