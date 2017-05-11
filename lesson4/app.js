const eventproxy = require('eventproxy');
const superagent = require('superagent');
const cheerio = require('cheerio');
const url = require('url');
const cnodeUrl = 'https://cnodejs.org/';

superagent.get(cnodeUrl)
.end(function (err, res) {
    if (err) {
        return console.error(err);
    }

    // 获取首页前4条链接
    let topicUrls = [];
    let $ = cheerio.load(res.text);
    $('#topic_list .topic_title').each(function (idx, element) {
        var $element = $(element);
        var href = url.resolve(cnodeUrl, $element.attr('href'));
        topicUrls.push(href);

        if (idx == 3) {
            return false;
        }
    });

    // 监听
    let ep = new eventproxy();
    ep.all('detail_finally', 'score_finally', function (details, scores) {
        let returnData = [];

        details.forEach(function (item, idx) {
            returnData.push(Object.assign({}, details[idx], scores[idx]));
        });

        console.log(returnData);
    });
    // 直接使用ep.done() 需要将after重写 因为after不会把err传出来
    // ep.after('details', topicUrls.length, ep.done('detail_finally'));
    // ep.after('scores', topicUrls.length, ep.done('score_finally'));
    ep.after('details', topicUrls.length, function(details){
        ep.emit('detail_finally', details);
    });
    ep.after('scores', topicUrls.length, function (scores) {
        ep.emit('score_finally', scores);
    });

    // 进一步获取用户页面的用户名和积分
    ep.on('get_score', function (userUrl) {
        superagent.get(userUrl)
        .end(function (err, res) {
            if (err) {
                return console.error(err);
            }

            let $ = cheerio.load(res.text);
            ep.emit('scores', {
                author1: $('.userinfo .dark').html().trim(),
                score1: $('.userinfo .big').html().trim(),
            })
        })
    });

    // 获取标题，链接，第一条评论
    topicUrls.forEach(function (topicUrl) {
        superagent.get(topicUrl)
        .end(function (err, res) {
            if (err) {
                return console.error(err);
            }
            let $ = cheerio.load(res.text);

            //进一步获取用户页面的用户名和积分
            ep.emit('get_score', url.resolve(cnodeUrl, $('.author_content a').attr('href')));
            ep.emit('details', {
                title: $('.topic_full_title').text().trim(),
                href: topicUrl,
                comment1: $('.reply_content').eq(0).text().trim(),
            });
        });
    });
});