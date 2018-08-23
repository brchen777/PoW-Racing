(async () => {
    'use strict';

    const pemu = require('paraemu');
    const crypto = require('crypto');
    const { threadNo, timeout } = pemu.args;

    let threadRun = false;

    const calculate = (key, difficultyStr, payloadStr) => {

        if (!threadRun) {
            return;
        }

        const dataStr = crypto.randomBytes(10).toString('hex');
        const nonceStr = crypto.randomBytes(32).toString('hex');

        const hash = crypto.createHash('sha256');
        const compactData = Buffer.from(`${payloadStr}${dataStr}${nonceStr}`, 'hex');
        const result = hash.update(compactData).digest();

        const difficulty = Buffer.from(difficultyStr, 'hex');

        // difficulty > result: 1
        // difficulty = result: 0
        // difficulty < result: -1
        const compare = Buffer.compare(difficulty, result);

        // difficulty >= result
        if (compare >= 0) {
            pemu.local('brchen-get-answer', { threadNo, key, dataStr, nonceStr });
        }
        else {
            setTimeout(calculate, timeout, key, difficultyStr, payloadStr);
        }
    };

    pemu
    .on('brchen-get-answer', (e, res) => {
        threadRun = false;
    })
    .on('brchen-thread-start', (e, res) => {
        threadRun = true;
        setTimeout(calculate, timeout, res.key, res.difficulty, res.payload);
    })
    .on('brchen-thread-restart', (e, res) => {
        pemu.send(pemu.uniqueId, 'brchen-thread-start', res);
    });
})();