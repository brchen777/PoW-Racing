(async () => {
    'use strict';

    const pemu = require('paraemu');
    const { INFO } = require('./res/lib.js');

    const { groupId } = pemu;
    let remoteGroupId = null;
    let trophy = [];
    let oldKey = null;

    pemu
    .on('tasks-ready', (e) => {
        INFO('Tasks ready.');

        const [threadCnt, timeout] = pemu.args;
        for (let i = 0; i < threadCnt; i++) {
            pemu.job('./thread.js', { workerData: { threadNo: i, timeout } });
        }
        trophy = Array(threadCnt).fill(0);

        pemu.local('brchen-threads-ready');
    })
    .on('net-connection-ready', (e, res) => {
        remoteGroupId = res.groupId;

        pemu.send(remoteGroupId, 'fetch-difficulty');
        INFO(`RemoteId: ${remoteGroupId}, MyId: ${groupId}`);
    })
    .on('net-connection-removed', (e) => {
        INFO('Connection removed.');

        pemu.send('brchen-process-exit', pemu.uniqueId);
    })
    .on('update-difficulty', (e, res) => {
        pemu.local('brchen-thread-restart', res);
    })
    .on('current-difficulty', (e, res) => {
        pemu.local('brchen-thread-start', res);
    })
    .on('error', (e) => {
        INFO('Something has error.');
        INFO(e);

        pemu.send('brchen-process-exit', pemu.uniqueId);
    })
    .on('brchen-threads-ready', (e) => {
        INFO('Threads ready.');
    })
    .on('brchen-thread-start', (e, res) => {
        INFO(`Thread start: key: ${res.key}, payload: ${res.payload}, difficulty: ${res.difficulty}`);
    })
    .on('brchen-thread-restart', (e, res) => {
        INFO(`Thread restart: key: ${res.key}, payload: ${res.payload}, difficulty: ${res.difficulty}`);
    })
    .on('brchen-get-answer', (e, res) => {
        // Prevent repeated sending
        if (res.key === oldKey) {
            return;
        }
        oldKey = res.key;
        
        INFO(`Get answer: key: ${res.key}, data: ${res.dataStr}, nonce: ${res.nonceStr}`);

        // counting
        trophy[res.threadNo]++;
        
        pemu.emit('pow-answer', { 
            tag: pemu.tag,
            key: res.key,
            data: res.dataStr,
            nonce: res.nonceStr
        });
    })
    .on('brchen-process-exit', (e) => {
        // print which thread find answer
        let trophyStr = [];
        for (let i = 0; i < trophy.length; i++) {
            trophyStr.push(`[ T${i}: ${trophy[i]} ]`);
        }
        INFO(trophyStr.join(', '));

        setTimeout(() => {
            process.exit(0);
        }, 5000);
    });
})();