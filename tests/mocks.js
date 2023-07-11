import BaseSource from "../src/sources/base";

global.SpreadsheetApp = {
    openById: () => ({
        getSheetByName: () => ({
            getRange: () => ({
                getValue: () => "VERDADERO",
                getValues: () => ([["key"],[""]]),
                setValue: (value) => value,
                setValues: (values) => values,
            }),
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
        getContentText: () => '{"success":true,"timestamp":1689097383,"base":"EUR","date":"2023-07-11","rates":{"COP":4613.878404,"USD":1.100728,"VES":31.009038}}',
    }),
};

export default class MockedBaseSource extends BaseSource {
    sendMessage(text) {
    }
}