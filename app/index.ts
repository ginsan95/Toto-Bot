import { CronJob } from 'cron';
import { parse as htmlParse } from 'node-html-parser';
import { parse as dateParse, format as dateFormat } from 'date-fns';
import { JWT } from 'google-auth-library';
import * as api from './api';
import constants from './constants';

interface TotoInfo {
    money: number;
    drawDate: Date;
}

const jwt = new JWT(
    constants.email,
    undefined,
    constants.privateKey,
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
    let moneyText = moneySpan?.rawText;
    if (!moneyText || moneyText === '') {
        throw new Error('Money not found!');
    }
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
    let dateText = dateDiv?.rawText;
    if (!dateText || dateText === '') {
        throw new Error('Draw date not found');
    }
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
    if (info.money >= constants.minMoney) {
        return fetchGoogleToken().then(token => sendNotification(info, token));
    } else {
        console.log('Not sending notifications');
        console.log(`Min money amount is ${constants.minMoney}`);
        console.log(`Toto prize money is ${info.money}`);
    }
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

function performTask() {
    fetchResults()
        .then(parseTotoInfo)
        .then(handleTotoInfo)
        .catch(error => console.error(error));
}

const job = new CronJob(
    `00 ${constants.runMinute} ${constants.runHour} * * *`,
    performTask,
    null,
    false,
    'Asia/Singapore'
);

job.start();
