(async () => {
    'use strict';

    const fs = require('fs');
    const moment = require('moment');

    const fileName = 'log.txt';

    module.exports = {
        INFO: (msg) => {
            const result = `[${moment().format('YYYY-MM-DD, HH:mm:ss')}]: ${msg}`;
            console.log(result);
            fs.appendFileSync(fileName, `${result}\n`);
        }
    };
})();