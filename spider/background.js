var fs = require('fs'),
    request = require('request');
const superagent = require('superagent');
const cheerio = require('cheerio');
const cnodeUrl = 'http://localhost/tmp.html';


superagent.get(cnodeUrl)
.end(function (err, sres) {
    // 常规的错误处理
    if (err) {
        return next(err);
    }

    var $ = cheerio.load(sres.text);
    var items = [];
    var k = 0;
    items[k] = []
    $('#all_image div').each(function (idx, element) {
        var $element = $(element).find('img');
        var imgUrl = 'http://assets.baicizhan.com/poster/' + ($element.attr('src')).replace('/images/', '');

        download(idx, imgUrl, idx + '.jpg', function () {
            console.log(idx + 'done');
        });
    });
});

var download = function (idx, uri, filename, callback) {
    console.log(idx + 'start');
    request.head(uri, function (err, res, body) {
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};

// download('http://assets.baicizhan.com/poster/2_0_20160824040856_16787.jpg', '1.jpg', function(){
//   console.log('done');
// });
