(async () => {
    'use strict';

    const pemu = require('paraemu');
    const crypto = require('crypto');
    const { threadNo, interval } = pemu.args;

    // 0: open, 1: pause, 2: stop
    let threadStatus = 0;
    let intervalId = 0;
    let nonce = 0;

    const calculate = (key, difficultyStr, payloadStr) => {
        if (threadStatus === 1) {
            clearInterval(intervalId);
            return;
        }

        const dataStr = crypto.randomBytes(10).toString('hex');
        
        let nonceStr = (++nonce).toString(16);
        // if nonce is odd length, add 0
        nonceStr = ((nonceStr.length) % 2) ? `0${nonceStr}` : nonceStr;

        const hash = crypto.createHash('sha256');
        const compactData = Buffer.from(`${payloadStr}${dataStr}${nonceStr}`, 'hex');
        const result = hash.update(compactData).digest();

        const difficulty = Buffer.from(difficultyStr, 'hex');

        // difficulty > result: 1
        // difficulty = result: 0
        // difficulty < result: -1
        const compare = Buffer.compare(difficulty, result);

        difficulty >= result
        if (compare >= 0) {
            pemu.local('brchen-get-answer', { threadNo, key, dataStr, nonceStr });
        }
    };

    const calculatePause = () => {
        threadStatus = 1;
        clearInterval(intervalId);
    };

    const calculateStop = () => {
        threadStatus = 2;
        clearInterval(intervalId);
    };

    pemu
    .on('brchen-get-answer', () => {
        pemu.local('brchen-thread-pause');
    })
    .on('brchen-thread-start', (e, res) => {
        threadStatus = 0;
        intervalId = setInterval(calculate, interval, res.key, res.difficulty, res.payload);
    })
    .on('brchen-thread-pause', calculatePause)
    .on('brchen-thread-stop', calculateStop)
    .on('brchen-thread-restart', (e, res) => {
        calculatePause();
        pemu.send(pemu.uniqueId, 'brchen-thread-start', res);
    });
})();