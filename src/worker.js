import { parentPort } from 'worker_threads';
import isOdd from 'is-odd';

parentPort.on('message', (v) => {
    // console.log('worker message');
    parentPort.postMessage(isOdd(v.isOdd));
});
