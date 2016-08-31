(function (root, factory) {
    'use strict';
    if (typeof exports === 'object') {
        // CommonJS
        module.exports = factory();
    }
    if (root) {
        // Global Variables
        root.UEM = root.UEM || {};
        root.UEM.resource = factory();
    }
}(this, function () {
    'use strict';

    var out = {},
        LOADING_FPS = 15,
        RESOURCE_SUFFIX = {
            STYLE: ['css'],
            SCRIPT: ['js'],
            IMG: ['jpg', 'png', 'gif', 'webp'],
            AUDIO: ['mp3', 'ogg', 'wav']
        },
        TRANSITION_STEP = 4,
        DEFAULT_AVERAGE_SPEED = 0.2,
        resourceRepository = {};

    /**
     * loading state for recoding loading status
     */
    function LoadingState() {
        this.createTime = +new Date();
        this.averageSpeed = DEFAULT_AVERAGE_SPEED;
        this.resourceNum = 0;
        this.waitingNum = 0;
        this.lastWaitingNum = -1;
        this.lastPercent = 0;
        this.virtualFrame = 0;
        this.lastLogicPercent = 0;
        this.transitionPercent = 0;
        this.percent = 0;
    }

    /**
     * load essential resource
     */
    out.loadEssentialResource = function (srcList, finishedCallback, intervalCallback) {
        var state = new LoadingState();
        requestEssentialResources(state, srcList);
        startLoadingJob(state, finishedCallback || function () {}, intervalCallback || function () {});
    };

    /**
     * load content resource
     */
    out.loadContentResource = function (query, finishedCallback) {
        nextContentResource(document.querySelectorAll(query + ' [data-src]'), 0, finishedCallback || function () {});
    };

    /**
     * get resource
     */
    out.getResource = function (url) {
        return resourceRepository[url];
    };

    /**
     * load next content one by one
     */
    function nextContentResource(els, next, fcb) {
        if (next < els.length) {
            els[next].onload = function () {
                nextContentResource(els, ++next, fcb);
            };
            els[next].setAttribute('src', els[next].getAttribute('data-src'));
        } else {
            fcb();
        }
    }

    /**
     * start images loading job
     */
    function startLoadingJob(state, fcb, icb) {
        var percent = 0,
            loadJob = setInterval(function () {
                percent = getLoadingPercent(state);
                icb(percent);
                if (percent === 1) {
                    clearInterval(loadJob);
                    fcb(resourceRepository);
                }
            }, 1000 / LOADING_FPS);
    }

    /**
     * get loading percent
     */
    function getLoadingPercent(state) {
        if (state.resourceNum === 0) {
            return 1;
        }
        var percent = (state.resourceNum - state.waitingNum) / state.resourceNum,
            virtualPercent = getVirtualPercent(state),
            nextPercent = getNextPercent(state),
            logicPercent = 0;
        updateVirtualFrame(state);
        if (virtualPercent >= nextPercent) {
            if (percent === nextPercent) {
                logicPercent = percent;
            } else {
                logicPercent = state.lastPercent;
            }
        } else {
            logicPercent = (state.lastPercent = virtualPercent);
        }
        return transitionPercent(state, logicPercent);
    }

    /**
     * get a transition percent
     */
    function transitionPercent(state, logicPercent) {
        if (state.logicPercent !== logicPercent) {
            state.logicPercent = logicPercent;
            state.transitionPercent = (state.logicPercent - state.percent) / TRANSITION_STEP;
        }
        state.percent += state.transitionPercent;
        if (state.percent > state.logicPercent) {
            state.percent = state.logicPercent;
        }
        return state.percent;
    }

    /**
     * update virtual frame
     */
    function updateVirtualFrame(state) {
        if (state.lastWaitingNum === state.waitingNum) {
            ++state.virtualFrame;
        } else {
            state.lastWaitingNum = state.waitingNum;
            state.virtualFrame = 0;
        }
    }

    /**
     * get virtual percent
     */
    function getVirtualPercent(state) {
        var virtualPercent =
            (state.resourceNum - state.waitingNum + (state.virtualFrame * state.averageSpeed)) / state.resourceNum;
        if (state.lastPercent > virtualPercent) {
            return state.lastPercent;
        } else {
            return virtualPercent;
        }
    }

    /**
     * get percent when next resource loaded
     */
    function getNextPercent(state) {
        var nextNum = 0,
            RESOURCE_CHANNEL_NUM = 4; // to reduce the initial waiting time
        if (state.waitingNum >= RESOURCE_CHANNEL_NUM) {
            nextNum = RESOURCE_CHANNEL_NUM;
        } else {
            nextNum = state.waitingNum;
        }
        return (state.resourceNum - state.waitingNum + nextNum) / state.resourceNum;
    }

    /**
     * send essential resources request, non-ordered
     */
    function requestEssentialResources(state, srcList) {
        var i = 0;
        state.resourceNum = state.waitingNum = srcList.length;
        while (i < srcList.length) {
            var res = resourceRepository[srcList[i]];
            if (res) {
                resourceLoaded(state, res, srcList[i])();
            } else {
                switch (getResourceType(srcList[i])) {
                case 'STYLE':
                    res = loadStyleResource(srcList[i]);
                    break;
                case 'SCRIPT':
                    res = loadScriptResource(srcList[i]);
                    break;
                case 'AUDIO':
                    res = loadAudioResource(state, srcList[i]);
                    break;
                default:
                    res = new Image();
                    break;
                }
                if (!(res instanceof Audio)) {
                    res.onload = resourceLoaded(state, res, srcList[i]);
                }
                if (res.type !== 'text/css') {
                    res.src = srcList[i];
                }
            }
            ++i;
        }
    }

    /**
     * load script resource
     */
    function loadScriptResource() {
        var res = document.createElement('script');
        window.document.body.appendChild(res);
        return res;
    }

    /**
     * load style resource
     */
    function loadStyleResource(src) {
        var res = document.createElement('link');
        res.rel = 'stylesheet';
        res.type = 'text/css';
        res.href = src;
        window.document.getElementsByTagName('head')[0].appendChild(res);
        return res;
    }

    /**
     * load audio resource
     */
    function loadAudioResource(state, src) {
        var res = new Audio();
        res.autoplay = false;
        res.preload = true;
        resourceLoaded(state, res, src)();
        return res;
    }

    /**
     * get resouce type
     */
    function getResourceType(src) {
        var i = 0,
            p = '';
        for (p in RESOURCE_SUFFIX) {
            if (RESOURCE_SUFFIX.hasOwnProperty(p)) {
                i = RESOURCE_SUFFIX[p].length;
                while (i--) {
                    if (src.indexOf('.' + RESOURCE_SUFFIX[p][i]) > 0) {
                        return p;
                    }
                }
            }
        }
    }

    /**
     * resource loaded callback
     */
    function resourceLoaded(state, res, src) {
        return function () {
            setTimeout(function () {
                resourceRepository[src] = res;
                --state.waitingNum;
                state.averageSpeed = calculateAverageSpeed(state);
            }, 50); // fix NaN bug, make time different
        };
    }

    /**
     * calculate average speed
     */
    function calculateAverageSpeed(state) {
        return (state.resourceNum - state.waitingNum) /
            ((+new Date() - state.createTime) / (1000 / LOADING_FPS));
    }

    return out;
}));