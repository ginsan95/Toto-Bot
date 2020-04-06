import { CronJob } from 'cron';
import { parse as htmlParse } from 'node-html-parser';
import { parse as dateParse, format as dateFormat } from 'date-fns';
import { JWT } from 'google-auth-library';
import key from '../keys/service-account.json';
import * as api from './api';

// const job = new CronJob(
//     '* * * * * *',
//     function() {
//         console.log('You will see this message every second');
//     },
//     null,
//     true,
//     'America/Los_Angeles'
// );
//
// job.start();

interface TotoInfo {
    money: number;
    drawDate: Date;
}

const jwt = new JWT(
    key.client_email,
    undefined,
    key.private_key,
    'https://www.googleapis.com/auth/firebase.messaging',
    undefined
);

function fetchResults(): Promise<string> {
    return api.fetchURL(
        'http://www.singaporepools.com.sg/DataFileArchive/Lottery/Output/toto_next_draw_estimate_en.html'
    );
}

function parseMoney(root: any): number {
    const moneySpan = root.querySelector('span');
    let moneyText = moneySpan.rawText;
    const estText = ' est';
    if (moneyText.endsWith(estText)) {
        moneyText = moneyText.substring(0, moneyText.length - estText.length);
    }
    if (moneyText.startsWith('$')) {
        moneyText = moneyText.substring(1, moneyText.length);
    }
    moneyText = moneyText.replace(/,/g, '');
    return Number(moneyText);
}

function parseDrawDate(root: any): Date {
    const dateDiv = root.querySelector('.toto-draw-date');
    let dateText = dateDiv.rawText;
    const splited = dateText.split(', ');
    splited.push('+08');
    dateText = splited.slice(1, splited.length).join(',');
    return dateParse(dateText, 'dd MMM yyyy ,h.mmbb,x', new Date());
}

function parseTotoInfo(html: string): TotoInfo {
    const root: any = htmlParse(html);
    const money = parseMoney(root);
    const drawDate = parseDrawDate(root);
    return { money, drawDate };
}

function handleTotoInfo(info: TotoInfo) {
    return fetchGoogleToken().then(token => sendNotification(info, token));
}

function fetchGoogleToken(): Promise<string> {
    return jwt.authorize().then(item => {
        let { access_token } = item;
        if (!access_token) {
            throw new Error('Access Token is undefined');
        }
        return access_token;
    });
}

function sendNotification(info: TotoInfo, token: string) {
    const { money, drawDate } = info;
    const moneyStr = money.toFixed(1).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    const drawStr = dateFormat(drawDate, 'dd MMM yyyy hh:mm bb');
    const message = `${moneyStr} at ${drawStr}`;

    const body = {
        message: {
            topic: 'all',
            notification: {
                title: 'Toto Bot',
                body: message,
            },
            data: {
                money: money.toString(),
                drawDate: drawDate.valueOf().toString(),
            },
        },
    };

    const Authorization = `Bearer ${token}`;

    return api
        .post(
            'https://fcm.googleapis.com/v1/projects/toto-bot-50434/messages:send',
            body,
            { Authorization }
        )
        .then(value => console.log(value));
}

fetchResults()
    .then(parseTotoInfo)
    .then(handleTotoInfo)
    .catch(error => console.error(error));
