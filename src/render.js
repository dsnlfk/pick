var resource = require('./resource');
var isInit = true;
var sizeDef = 300;
var isPlay = false;
var isLoop = false;
var time = 100;
var imgList, //图片资源：图片地址列表
    idxArr, //整个展示列：长度对应imgList.length，值对应 imgList 下标
    delArr, //长度对应imgList.length,值1/0表示是否删除
    noDelIdxArr, //非删除idxArr下标数组
    img, len, tPlay, tActPlay, imgNew;

exports.render = function(files) {
    imgList = files;
    resource.loadEssentialResource(imgList, function() {
        if (isInit) {
            isInit = false;
            init();
        }
        idxArr = [];
        delArr = [];
        for (var i = 0; i < imgList.length; i++) {
            idxArr.push(i);
            delArr.push(1);
        }
        len = idxArr.length;
        noDelIdxArr = getNoDelIdxArr();
        render();
    });
};

function init() {
    img = $('.big-show img');

    //上一帧
    $('.prev').on('click', function() {
        descPlay(false);
        prevNext();
    });
    //下一帧
    $('.next').on('click', function() {
        descPlay(false);
        prevNext(true);
    });

    //改变展示尺寸
    $('.size input').on('change', function() {
        if (this.checked) {
            $('.big-show').addClass('selBig');
            sizeDef = 500;
        } else {
            $('.big-show').removeClass('selBig');
            sizeDef = 300;
        }
        bigShow(imgNew);
    });
    //底色选择
    $('.color input').on('change', function() {
        if (this.checked) {
            $('.big-show').addClass('selBg');
        } else {
            $('.big-show').removeClass('selBg');
        }
    });

    //第一帧
    $('.btns .first').on('click', function() {
        descPlay(false);
        upadeView(noDelIdxArr[0]);
    });
    //最后一帧
    $('.btns .last').on('click', function() {
        descPlay(false);
        upadeView(noDelIdxArr[noDelIdxArr.length - 1]);
    });
    //播放
    $('.btns .play').on('click', function() {
        actPlaying(parseInt($(this).attr('data-turn')));
    });
    //循环播放
    $('.btns .loopPlay').on('click', function() {
        actPlaying(parseInt($(this).attr('data-turn')), true);
    });
    //修改帧率
    $('.btns .fps input').on('blur', function() {
        var num = parseInt($(this).value());
        num = num >= 10 ? num : 10;
        $(this).value(num);
        time = num;
    });
}


function render() {
    //展示图设置
    imgNew = getImgObj();
    bigShow(imgNew);
    //缩略图列表渲染
    $('.bar-par ul').empty().style('width:' + 100 * len + 'px');
    for (var i = 0; i < len; i++) {
        var html = [
            '<li idx="' + i + '">',
            '<span>' + i + '</span>',
            '<img style="' + (imgNew.isW ? 'width:100px;' : 'height:100px;') + '" src="' + imgList[i] + '" />',
            '<input type="text" />',
            '<em data-del="1"></em>',
            '</li>'
        ].join('');
        $('.bar-par ul').append($(html));
    }
    upadeView(0);
    //下标操作
    $('.bar-par ul input[type=text]').on('blur', function() {
        var idxCur = getIdxCur($(this.parentNode));
        var idxVal = parseInt($(this).value());
        if (idxVal >= 0 && idxVal < len && idxVal !== idxCur) {
            idxArr[idxCur] = idxVal;
            $(this).value(idxVal);
        } else {
            idxArr[idxCur] = idxCur;
            $(this).value('');
        }
        upadeView(idxCur);
    });
    $('.bar-par ul em').on('click', function() {
        var del = parseInt($(this).attr('data-del'));
        var idxCur = getIdxCur($(this.parentNode));
        if (del) {
            del = 0;
            $(this.parentNode).addClass('del');
        } else {
            del = 1;
            $(this.parentNode).removeClass('del');
        }
        $(this).attr('data-del', del);
        delArr[idxCur] = del;
        upadeView(idxCur);
        noDelIdxArr = getNoDelIdxArr();
    });
    $('.bar-par ul li').on('click', function() {
        descPlay(false);
        upadeView(getIdxCur($(this)));
    });

    //
    descPlay(false);
    $('.btns .desc span').html(len - 1);
    $('.btns .fps input').value(time);
    $('#holder').addClass('sel');
}

//----------------------------------------------

function prevNext(bo) {
    var idx = parseInt(img.attr('idx'));
    var n = bo ? next(idx) : prev(idx);
    if (n !== -1) {
        upadeView(n);
    }
}

function upadeView(idx) {
    img.attr('src', imgList[idxArr[idx]]).attr('idx', idx);
    $($('.bar-par ul li').removeClass('sel').els[idx]).addClass('sel');
    $('.data .t').html(getNoDelIdxArr(true).join(' , '));
    $('.data .d').html(getImgsName());
    idx === 0 ? $('.prev').addClass('sel') : $('.prev').removeClass('sel');
    idx === len - 1 ? $('.next').addClass('sel') : $('.next').removeClass('sel');
    scrollUI();
}

//获取所需图片名称
function getImgsName() {
    var arrTemp = [];
    var str = '';
    var arrSource = getNoDelIdxArr(true).sort(sortNumber);
    for (var i = 0; i < arrSource.length; i++) {
        if (arrTemp.indexOf(arrSource[i]) === -1) {
            var s = imgList[arrSource[i]];
            var idx = s.length - s.split('').reverse().join('').search(/\//);
            str += (s.slice(idx) + (i < arrSource.length - 1 ? '\r' : ''));
            arrTemp.push(arrSource[i]);
        }
    }
    return str;
}

function scrollUI() {
    var wSub = $('.bar-par ul li').els[0].clientWidth;
    var wPar = $('.bar-par').els[0].clientWidth;
    var numShow = Math.floor(wPar / wSub);
    if (numShow < len) {
        var numMiddle = Math.floor(numShow / 2);
        var numHide = parseInt(img.attr('idx')) - numMiddle;
        if (numHide >= 0) {
            numHide = numHide <= len - numShow ? numHide : len - numShow;
        } else {
            numHide = 0;
        }
        $('.bar-par ul').style('margin-left', -numHide * wSub + 'px');
    }
}

function actPlaying(trun, bo) {
    var tn = trun ? false : true;
    if (!(isPlay && tn)) {
        clearTimeout(tActPlay);
        clearTimeout(tPlay);
        tActPlay = setTimeout(play, 300);
    }
    bo ? descPlay(tn, bo) : descPlay(tn);
}

function play() {
    if (isPlay) {
        var idx = parseInt(img.attr('idx'));
        if (idx === noDelIdxArr[noDelIdxArr.length - 1]) { //处于最后一帧
            upadeView(idxArr[noDelIdxArr[0]]);
        } else {
            if (idx === noDelIdxArr[noDelIdxArr.length - 2] && !isLoop) {
                descPlay(false);
            }
            prevNext(true);
        }
        tPlay = setTimeout(function() {
            if (isPlay) {
                play();
            }
        }, time);
    }
}

function descPlay(bo, loop) {
    isPlay = bo;
    isLoop = loop ? true : false;
    if (bo) {
        if (loop) {
            $('.btns .loopPlay').addClass('sel').attr('data-turn', 1).html('循环暂停');
            playTurnOff();
        } else {
            $('.btns .play').addClass('sel').attr('data-turn', 1).html('暂停');
            loopPlayTurnOff();
        }
    } else {
        playTurnOff();
        loopPlayTurnOff();
    }
}

function playTurnOff() {
    $('.btns .play').removeClass('sel').attr('data-turn', 0).html('播放');

}

function loopPlayTurnOff() {
    $('.btns .loopPlay').removeClass('sel').attr('data-turn', 0).html('循环播放');
}

function bigShow(imgObj) {
    img.attr('width', 'auto').attr('height', 'auto');
    if (imgObj.hDef > sizeDef || imgObj.wDef > sizeDef) {
        imgObj.isW ? img.attr('width', sizeDef) : img.attr('height', sizeDef);
    }
}

function getImgObj() {
    var i = new Image();
    i.src = imgList[0];
    i.wDef = i.width;
    i.hDef = i.height;
    if (i.hDef > i.wDef) {
        i.isW = false;
    } else {
        i.isW = true;
    }
    return i;
}

function getIdxCur($d) {
    return parseInt($d.attr('idx'));
}

function getNoDelIdxArr(bo) {
    arrNew = [];
    for (var i = 0; i < len; i++) {
        if (delArr[i]) {
            if (bo) {
                arrNew.push(idxArr[i]);
            } else {
                arrNew.push(i);
            }
        }
    }
    return arrNew;
}

function next(idx) {
    for (var i = idx + 1; i < len; i++) {
        if (delArr[i]) {
            return i;
        }
    }
    return -1;
}

function prev(idx) {
    for (var i = idx - 1; i > -1; i--) {
        if (delArr[i]) {
            return i;
        }
    }
    return -1;
}




//utils------------------
function sortNumber(a, b) {
    return a - b;
}
