# Deploy Google App Scripts

[![Deploy Script](https://github.com/SOM-Firmwide/deploy-google-app-script-action/actions/workflows/deploy-script.yml/badge.svg)](https://github.com/SOM-Firmwide/deploy-google-app-script-action/actions/workflows/deploy-script.yml)

This repository help us to setup an automatic [CI/CD](https://en.wikipedia.org/wiki/CI/CD) process for [Google Apps Scripts](https://developers.google.com/apps-script) using [GitHub Actions](https://docs.github.com/en/actions) for multiple users, and in these terms, use it to handle telegram messages and keep records related to expenses, as well as generate reports.
## Setup

### Create a new Telegram Bot using the [@BotFather](https://t.me/BotFather)

1. Save the token to access the HTTP API, it will be used for configure the `telegramToken`.
2. Go to the [@userinfobot](https://t.me/userinfobot) bot, init it and copy the id that the bot sends you, it will be used as the `telegramUserId`

### Copy Google Sheet from [template](https://docs.google.com/spreadsheets/d/1Pv5DCTmQ2IyI0CZjfkbG78-zs7J71TWCbUOmE-i844Q/edit#gid=385676250)

1. Go to the [template](https://docs.google.com/spreadsheets/d/1Pv5DCTmQ2IyI0CZjfkbG78-zs7J71TWCbUOmE-i844Q/edit#gid=385676250) sheet and copy it into your personal drive. from the url of the sheet copy the `SSID` associated with it, you can find it in the url with this format `https://docs.google.com/spreadsheets/d/<<SSID>>/edit#gid=<<other_id>>`
2. This will generate automatically an AppScript copy of the original. From this App Script copy you will extract the `SCRIPT_ID` variable on the URL with this format `https://script.google.com/home/projects/<<script_id>>/edit`.

### Save required for setting up the sequencer Command-Line Parameters

1. Once in the AppScript, go to the config tap in the left sidebar
2. Scroll down on the 'sequencer Command-Line Parameters' section and start adding the following parameters:
    * exchangeUrl: 'https://s3.amazonaws.com/dolartoday/data.json'
    * ssId: `SSID`
    * telegramToken: `telegramToken`
    * telegramUrl: 'https://api.telegram.org/bot'
    * telegramUserId1: `telegramUserId`
    * telegramUserId2: `telegramUserId`
    * webAppUrl: It will be generated later at the end of the step processes in the readme instructions.

### Setup Git Branch Repository for a new bot with the persons name for better understanding

1. Create a new branch: `git checkout main && git checkout -b <<person-name>>`
2. Set up environment: On the deploy-script.yml file set the Environment to the persons name
    ```
    name: Deploy Script

    on:
    workflow_dispatch:
    push:
        branches: [<<first_person_name>>, <<second_person_name>>, <<NEW_person_name>>]
    release:
        types: [published]
    schedule:
        - cron: "0 0 * * SUN"

    jobs:
    deploy:
        runs-on: ubuntu-latest
        environment: <<Capitalize Person Name>>
    .
    .
    .
    ```
3. Include branch into batch updating file: On the ./update-all.bat
    ```
    ECHO "UPDATING BRANCHES"
    git checkout main
    git pull origin main

    git checkout <<first_person_name>>
    git merge main
    git push origin <<first_person_name>>

    git checkout <<second_person_name>>
    git merge main
    git push origin <<second_person_name>>

    git checkout <<NEW_person_name>>
    git merge main
    git push origin <<NEW_person_name>>
    ```

At this point the workflow will be triggered, but will fail because it is not configured completely.

### Set Repository Secrets

[Github encrypted secrets](https://docs.github.com/en/actions/reference/encrypted-secrets) are used to configure the workflow and can be set from the repository settings page on GitHub.
#### `CLASPRC_JSON`

The `clasp` command line tool uses a `.clasprc.json` file to store the current login information. The contents of this file need to be added to a `CLASPRC_JSON` secret on a new github environment with the name of the person to allow the workflow to update and deploy scripts.

1. Login to clasp as the user that should run the workflow: 
   1. Run `clasp login` 
   2. A web browser will open asking you to authenticate clasp. Accept this from the account you want the workflow to use.
2. Open the `.clasprc.json` file that is created in the home directory (`C:\Users\{username}` on windows, and `~/.clasprc.json` on Linux)
3. Copy the contents of `.clasprc.json` into a new secret named `CLASPRC_JSON`

#### `SCRIPT_ID`

The clasp command line tool identifies the Google Apps Script project to push and deploy too using the `scriptId` property in `.clasp.json`. To specify the target script add a `SCRIPT_ID` secret in the previous created environment. This will cause the workflow to override whatever literal scriptId value is in `.clasp.json`

#### `DEPLOYMENT_ID`

The workflow can automatically deploy the script when the branches are pushed to github.

1. Determine the ID of the deployment you want
   1. Create a new deployment by running `clasp deploy` or on https://scripts.google.com.
   2. Find the deploymen id by running `clasp deployments` or checking the projet settings on https://scripts.google.com.
2. Add the desired deployment id in the same environment with the name `DEPLOYMENT_ID`

## Usage

- Pushing to the branches on github will automatically trigger the workflow to push the code to the `HEAD` deployment on https://scripts.google.com`

## Updating `.clasprc.json`

The `.clasprc.json` file that stores the authentication information contains a `access_token` which expires at the specified `expiry_date` and a `refresh_token` that can be used to request a new `access_token`. These tokens will change over time, but the workflow should update the `CLASPRC_JSON` repository secret.

However, there are [conditions where the refresh token may also expire](https://developers.google.com/identity/protocols/oauth2#expiration). So in addition to the push triggers the workflow is also configured to automatically attempt to login to clasp once a week which will confirm the authentication is still working and potentially refresh and save new tokens.

### `.clasprc.json` File Format Reference

    {
        "access_token": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "refresh_token": "YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
        "scope": "https://www.googleapis.com/auth/script.projects https://www.googleapis.com/auth/script ...",
        "token_type": "Bearer",
        "expiry_date": 0000000000000
    }

## GCP Service Accounts

The whole system described here copying the credentials out of `.clasprc.json` and using a scheduled trigger to automatically update the tokens on a regular basis is a hack. 

The "correct" way to setup a server to server connection like is through a GCP service account. It is possible to login clasp using a key file for a service account. However, the [Apps Scripts API](https://developers.google.com/apps-script/api/concepts) does not work with service accounts.

- [Execution API - cant use service account](https://issuetracker.google.com/issues/36763096)
- [Can the Google Apps Script Execution API be called by a service account?](https://stackoverflow.com/questions/33306299/can-the-google-apps-script-execution-api-be-called-by-a-service-account)
  
## Related Issues

- [Provide instructions for deploying via CI #707](https://github.com/google/clasp/issues/707)
- [Handle rc files prefering local over global to make clasp more CI friendly #486](https://github.com/google/clasp/pull/486)
- [Integration with CI pipeline and Jenkins #524](https://github.com/google/clasp/issues/524)
- [How to use a service account for CI deployments #225](https://github.com/google/clasp/issues/225)

## Reference

- [Advanced Clasp Docs](https://github.com/google/clasp/tree/master/docs)
  