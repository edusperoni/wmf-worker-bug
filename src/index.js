import { Worker } from 'worker_threads';


function checkIfOdd(n, worker) {
    return new Promise((resolve, reject) => {
        worker.on('error', (e) => {
            reject(e);
            worker.terminate();
        });

        worker.on('message', (msg) => {
            resolve(msg);
            worker.terminate();
        });

        worker.postMessage({
            isOdd: n
        });
    });
}

async function tests() {
    console.log('isOdd 1', await checkIfOdd(1, new Worker(new URL('./worker.js', import.meta.url))));
}

tests();



// const worker = new Worker(new URL('./worker.js', import.meta.url));


