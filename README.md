# wmf-worker-bug


This repo shows a bug when using WMF in a project with Web Workers. The project was configured with minimum chunk size of 0 to make the code simpler.

Since webpack 5, Workers were simplified by just using `new Worker(new URL('./worker.js', import.meta.url)))`. This generates a separate worker chunk with it's own runtime (even if using `runtimeChunk: "single"`). This worker runtime is unable to use Module Federation (at the moment, at least) and therefore sharing modules through module federation make it impossible to use the shared modules on the worker.

## Setup and running

```bash
#setup
npm i

# normal build
npm run build
npm start # run the generated dist/main.js

# wmf build
npm run build.wmf
npm start # run the generated dist/main.js
# notice a promise rejection due to the worker erroring out
```

## Explanation

When generating a project without Webpack Module Federation, the generated worker is simple:


```js
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/worker.js":
/*!***********************!*\
  !*** ./src/worker.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var worker_threads__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! worker_threads */ "worker_threads");
/* harmony import */ var worker_threads__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(worker_threads__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var is_odd__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! is-odd */ "./node_modules/is-odd/index.js");
/* harmony import */ var is_odd__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(is_odd__WEBPACK_IMPORTED_MODULE_1__);



worker_threads__WEBPACK_IMPORTED_MODULE_0__.parentPort.on('message', (v) => {
    // console.log('worker message');
    worker_threads__WEBPACK_IMPORTED_MODULE_0__.parentPort.postMessage(is_odd__WEBPACK_IMPORTED_MODULE_1___default()(v.isOdd));
});


/***/ }),

/***/ "worker_threads":
/*!*********************************!*\
  !*** external "worker_threads" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("worker_threads");

/***/ })

/******/ 	});

// WEBPACK RUNTIME CODE AFTER THIS
```


But generating it with WMF and sharing `is-odd`, you get a slightly different output.

```js
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/worker.js":
/*!***********************!*\
  !*** ./src/worker.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var worker_threads__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! worker_threads */ "worker_threads");
/* harmony import */ var worker_threads__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(worker_threads__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var is_odd__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! is-odd */ "webpack/sharing/consume/default/is-odd/is-odd");
/* harmony import */ var is_odd__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(is_odd__WEBPACK_IMPORTED_MODULE_1__);



worker_threads__WEBPACK_IMPORTED_MODULE_0__.parentPort.on('message', (v) => {
    // console.log('worker message');
    worker_threads__WEBPACK_IMPORTED_MODULE_0__.parentPort.postMessage(is_odd__WEBPACK_IMPORTED_MODULE_1___default()(v.isOdd));
});


/***/ }),

/***/ "worker_threads":
/*!*********************************!*\
  !*** external "worker_threads" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("worker_threads");

/***/ })

/******/ 	});

// WEBPACK RUNTIME CODE AFTER THIS
```


Notice that `is-odd` is being imported as `__webpack_require__(/*! is-odd */ "webpack/sharing/consume/default/is-odd/is-odd");`. But in the worker context, there are no sharing modules (and is-odd is being concatenated into the worker anyway).


Webpack sharing information in `main.js` runtime:

```js
/******/ 			var promises = [];
/******/ 			switch(name) {
/******/ 				case "default": {
/******/ 					register("is-odd", "3.0.1", () => (() => (__webpack_require__(/*! ./node_modules/is-odd/index.js */ "./node_modules/is-odd/index.js"))), 1);
/******/ 				}
/******/ 				break;
/******/ 			}
/******/ 			if(!promises.length) return initPromises[name] = 1;
/******/ 			return initPromises[name] = Promise.all(promises).then(() => (initPromises[name] = 1));
```

Webpack sharing information in `src_worker_js.js` runtime:

```js
/******/ 			var promises = [];
/******/ 			switch(name) {
/******/ 			}
/******/ 			if(!promises.length) return initPromises[name] = 1;
/******/ 			return initPromises[name] = Promise.all(promises).then(() => (initPromises[name] = 1));
```

Considering we're dealing with workers, I suspect that WMF should be completely disabled on the worker context.



