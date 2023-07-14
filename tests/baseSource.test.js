import jest from "jest-mock";
import MockedBaseSource from "./mocks";

test('Process an expensive record with a good format and budget', () => {
    const telegramBot = new MockedBaseSource("Conocimiento - Peso - 60000 - Inscripción ídem y Jonás curso canino");
    telegramBot.sendMessage = jest.fn();
    telegramBot.proccessExpenseMessage();
    const message = "Gasto guardado exitosamente!";
    const expenseAdded = "\nGASTO: fecha=2023/7/14 | Categoria=Conocimiento | dolares=12.93, pesos=60000, bolivares=344.83";
    const exchangeRates = "\nTasas de cambios: Bs/USD=24.95 | Bs/COP=174 | USD/COP=4640";
	expect(telegramBot.sendMessage).toHaveBeenCalledWith(message + expenseAdded + exchangeRates);
});


test('Process an expensive record with a good format and higher amount than budget', () => {
    const telegramBot = new MockedBaseSource("Conocimiento - Peso - 60000 - Inscripción ídem y Jonás curso canino");
    telegramBot.sendMessage = jest.fn();
    let finalBudgetReport = 0;
    global.SpreadsheetApp.constants.finalBudgetReport = finalBudgetReport = 14;
    telegramBot.proccessExpenseMessage();
    const message = "Gasto guardado exitosamente!";
    const expenseAdded = "\nGASTO: fecha=2023/7/14 | Categoria=Conocimiento | dolares=12.93, pesos=60000, bolivares=344.83";
    const exchangeRates = "\nTasas de cambios: Bs/USD=24.95 | Bs/COP=174 | USD/COP=4640";
	const budgetReport = "\n\nWARNING: Los gastos para la categoria Conocimiento superan el presupuesto(13.5$) del presente mes.";
    expect(telegramBot.sendMessage).toHaveBeenCalledWith(message + expenseAdded + exchangeRates + budgetReport);
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
