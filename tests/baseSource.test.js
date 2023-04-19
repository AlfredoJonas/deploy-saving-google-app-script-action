import MockedBaseSource from "./mocks";

test('Process an expensive record with a good format', () => {
    const telegramBot = new MockedBaseSource("Conocimiento - Peso - 60000 - Inscripción ídem y Jonás curso canino");
    const response = telegramBot.proccessExpenseMessage();
	expect(response['success']).toBe(true);
});

test('Process an expensive record with wrong text format', () => {
    const telegramBot = new MockedBaseSource("Conocimiento - 60000 - Inscripción ídem y Jonás curso canino");
    const response = telegramBot.proccessExpenseMessage();
	expect(response['success']).toBe(false);
});

test('New report', () => {
    const telegramBot = new MockedBaseSource("/report");
    const response = telegramBot.processReport();
	expect(response['success']).toBe(true);
	expect(response['message']).toBe("Ingrese key:");
});

test('Clean started report', () => {
    const telegramBot = new MockedBaseSource("/report");
    const response = telegramBot.cleanReport();
	expect(response).toBe(true);
});

// Build test for proccessing an entire report with all the steps
