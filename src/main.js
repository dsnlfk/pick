// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.


var fs = require('fs');
var render = require('./render');


var holder = document.getElementById('holder');
holder.ondragover = function() {
    return false;
};
holder.ondragleave = holder.ondragend = function() {
    return false;
};
holder.ondrop = function(e) {
    e.preventDefault();
    var files = e.dataTransfer.files;
    if (files.length > 1) {
        rending(getImgList(files));
    } else {
        fs.readdir(files[0].path, function(err, imgs) {
            if (err) console.log(err);
            rending(getImgList(imgs, files[0].path));
        });
    }
    return false;
};

function getImgList(files, path) {
    var imgList = [];
    for (var i = 0; i < files.length; i++) {
        var file = path ? files[i] : files[i].path;
        if (file.indexOf('.png') > -1 || file.indexOf('.jpg') > -1 || file.indexOf('.gif') > -1) {
            imgList.push((path ? (path + '/') : '') + file);
        }
    }
    return imgList;
}

function rending(imgList) {
    if (imgList.length > 0) {
        render.render(imgList);
    } else {
        alert('你拖进来的不是图片!');
    }
}
