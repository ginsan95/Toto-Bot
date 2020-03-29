'use strict';
var __importStar =
    (this && this.__importStar) ||
    function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null)
            for (var k in mod)
                if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
        result['default'] = mod;
        return result;
    };
Object.defineProperty(exports, '__esModule', { value: true });
var cron_1 = require('cron');
var https = __importStar(require('https'));
var job = new cron_1.CronJob(
    '* * * * * *',
    function() {
        console.log('You will see this message every second');
    },
    null,
    true,
    'America/Los_Angeles'
);
job.start();
https.get('https://www.google.com/', { agent: false }, function(res) {
    res.on('data', function(data) {
        console.log(data);
    });
});
