import key from '../keys/service-account.json';

let constants = {
    minMoney: process.env.MIN_MONEY ?? 7 * 1000000,
    email: process.env.CLIENT_EMAIL ?? key.client_email,
    privateKey: process.env.PRIVATE_KEY ?? key.private_key,
    runHour: process.env.RUN_HOUR ?? 18,
    runMinute: process.env.RUN_MINUTE ?? 30,
};

export default constants;
