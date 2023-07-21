import jest from "jest-mock";
import MockedBaseSource from "./mocks";

const message = "Gasto guardado exitosamente!";
const expenseAdded = `\n\nCategoria=Conocimiento`;
const ratesMessage = "\n      Dolares: 14.31\n      Pesos: 60000\n      Bolivares: 403.25";
const exchangeRates = "\nTasas de cambios:\n      BS/USD: 28.17\n      COP/BS: 148.79\n      COP/USD: 4191.66";
const budgetReport = "\n\n PILAS: Los gastos para la categoria Conocimiento superan el presupuesto(20$) del presente mes.";


test('Process an expensive record with a good format and budget', () => {
    const telegramBot = new MockedBaseSource("Conocimiento - Peso - 60000 - Inscripción ídem y Jonás curso canino");
    telegramBot.sendMessage = jest.fn();
    telegramBot.proccessExpenseMessage();
    expect(telegramBot.sendMessage).toHaveBeenCalledWith(message + expenseAdded + ratesMessage + exchangeRates);
});


test('Process an expensive record with a good format and higher amount than budget', () => {
    const telegramBot = new MockedBaseSource("Conocimiento - Peso - 60000 - Inscripción ídem y Jonás curso canino");
    telegramBot.sendMessage = jest.fn();
    let finalBudgetReport = 0;
    global.SpreadsheetApp.constants.finalBudgetReport = finalBudgetReport = 25;
    telegramBot.proccessExpenseMessage();
    expect(telegramBot.sendMessage).toHaveBeenCalledWith(message + expenseAdded + ratesMessage + exchangeRates + budgetReport);
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
