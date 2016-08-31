var resource = require('./resource');
var isInit = true;
var sizeDef = 300;
var isPlay = false;
var time = 100;
var imgList, idxsArr, img, len, tPlay;

exports.render = function(files) {
    imgList = files;
    resource.loadEssentialResource(imgList, function() {
        if (isInit) {
            isInit = false;
            init();
        }
        idxsArr = [];
        for (var i = 0; i < imgList.length; i++) {
            idxsArr.push(i);
        }
        len = idxsArr.length;
        render();
    });
};


function init() {
    img = $('.big-show img');
    $('.prev').on('click', function() {
        prevNext();
    });
    $('.next').on('click', function() {
        prevNext(true);
    });
}


function render() {
    var i = new Image();
    i.src = imgList[0];
    var w = i.width;
    var h = i.height;
    var isW;
    if (h > w) {
        isW = false;
    } else {
        isW = true;
    }
    //展示图设置
    if (h > sizeDef || w > sizeDef) {
        isW ? img.attr('width', sizeDef) : img.attr('height', sizeDef);
    }
    //缩略图列表
    $('.bar-par ul').empty().style('width:' + 100 * len + 'px');
    for (var i = 0; i < len; i++) {
        $('.bar-par ul').append($('<li idx="' + i + '"><span>' + i + '</span><img style="' + (isW ? 'width:100px;' : 'height:100px;') + '" src="' + imgList[i] + '" /><input type="text" /></li>'));
    }
    upadeView(0);
    //下标操作
    $('.bar-par ul input[type=text]').on('input', function() {
        var idxCur = parseInt($(this.parentNode).attr('idx'));
        var idxVal = parseInt($(this).value());
        if (idxVal >= 0 && idxVal < len && idxVal !== idxCur) {
            idxsArr[idxCur] = idxVal;
            upadeView(idxCur);
        } else {
            $(this).value('');
        }
    });
    $('.bar-par ul li').on('click', function() {
        var idxCur = parseInt($(this).attr('idx'));
        upadeView(idxCur);
    });
    // 功能按钮操作
    $('.btns .desc span').html(len - 1);
    $('.btns .first').on('click', function() {
        upadeView(0);
    });
    $('.btns .last').on('click', function() {
        upadeView(len - 1);
    });
    $('.btns .play').on('click', function() {
        isPlay ? isPlay = false : isPlay = true;
        clearTimeout(tPlay);
        tPlay = setTimeout(play, 300);
    });
    $('.btns .fps input').value(time);
    $('.btns .fps input').on('blur', function() {
        var num = parseInt($(this).value());
        num = num >= 10 ? num : 10;
        $(this).value(num);
        time = num;
    });

    $('#holder').addClass('sel');
}

//----------------------------------------------

function prevNext(bo) {
    var idx = parseInt(img.attr('idx'));
    if (bo) {
        if (idx + 1 < len) {
            upadeView(idx + 1);
        }
    } else {
        if (idx - 1 > -1) {
            upadeView(idx - 1);
        }
    }
}

function upadeView(idx) {
    img.attr('src', imgList[idxsArr[idx]]).attr('idx', idx);
    $($('.bar-par ul li').removeClass('sel').els[idx]).addClass('sel');
    $('.data .t').html(idxsArr.join(' , '));
    $('.data .d').html(getImgsName());
    idx === 0 ? $('.prev').addClass('sel') : $('.prev').removeClass('sel');
    idx === len - 1 ? $('.next').addClass('sel') : $('.next').removeClass('sel');
    scrollUI();
}

function getShowIdx() {
    return parseInt($('.big-show img').attr('idx'));
}
//获取所需图片名称
function getImgsName() {
    var arr = [];
    var str = '';
    for (var i = 0; i < len; i++) {
        if (arr.indexOf(idxsArr[i]) === -1) {
            var s = imgList[idxsArr[i]];
            var idx = s.length - s.split('').reverse().join('').search(/\//);
            str += (s.slice(idx) + (i < len - 1 ? '\r' : ''));
            arr.push(idxsArr[i]);
        }
    }
    return str;
}

function scrollUI() {
    var idx = parseInt(img.attr('idx'));
    var wSub = $('.bar-par ul li').els[0].clientWidth;
    var wPar = $('.bar-par').els[0].clientWidth;
    var numShow = Math.floor(wPar / wSub);
    var numShow = Math.floor(wPar / wSub);
    var numMiddle = Math.floor(numShow / 2);
    var numHide = idx - numMiddle;
    if (numHide >= 0) {
        numHide = numHide <= len - numShow ? numHide : len - numShow;
    } else {
        numHide = 0;
    }
    $('.bar-par ul').style('margin-left', -numHide * wSub + 'px');
}

function play() {
    if (isPlay) {
        var idx = parseInt(img.attr('idx'));
        if (idx === len - 1) {
            upadeView(0);
        } else {
            if (idx === len - 2) {
                isPlay = false;
            }
            prevNext(true);
        }
        setTimeout(function() {
            if (isPlay) {
                play();
            }
        }, time);
    }
    descPlay(isPlay);
}

function descPlay(bo) {
    bo ? $('.btns .play').html('暂停') : $('.btns .play').html('播放');
}


//名字排序，底色变换，big－img size，自测