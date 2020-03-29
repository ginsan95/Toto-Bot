import { CronJob } from 'cron';
import * as https from 'https';

const job = new CronJob(
    '* * * * * *',
    function() {
        console.log('You will see this message every second');
    },
    null,
    true,
    'America/Los_Angeles'
);

job.start();

https.get('https://www.google.com/', { agent: false }, res => {
    res.on('data', data => {
        console.log(data);
    });
});
