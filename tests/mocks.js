import BaseSource from "../src/sources/base";

global.SpreadsheetApp = {
    constants: {
        budget: 13.5,
        finalBudgetReport: 0.2
    },
    openById: () => ({
        getSheetByName: () => ({
            getRange: (range) => {
                const returnValues = {
                    getValue: () => "VERDADERO",
                    getValues: () => ([["key"],[""]]),
                    setValue: (value) => value,
                    setValues: (values) => values,
                };
                switch (range) {
                    case "B3":
                        returnValues.getValue = () => global.SpreadsheetApp.constants.budget;
                        return returnValues;
                    case "M3":
                        returnValues.getValue = () => global.SpreadsheetApp.constants.finalBudgetReport;
                    default:
                        return returnValues;
                }
            },
            appendRow: () => {},
        }),
    }),
};

var mockProperties = {
    ssId: "",
    exchangeUrl: "",
    telegramUserIds: "15123",
    telegramUrl: "",
    webAppUrl: "",
    telegramToken: "",
}

global.SETTINGS = {
    getProperty: (key) => mockProperties[key],
};

global.UrlFetchApp = {
    fetch: () => ({
        getContentText: () => '{"USD": {"promedio": 24.95},"COL": {"compra": 174},"USDCOL": {"ratetrm": 4640}}',
    }),
};

export default class MockedBaseSource extends BaseSource {
    sendMessage(text) {
    }
}