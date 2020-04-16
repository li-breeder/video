/**
 * 购物圈视频播放组件 未完成，为启用
 * @version 2016/9/20
 * @author luowenlin1
 */
define('wq.gwq.video', function (require, exports, module) {
    "use strict";
    var _cacheThisModule_;
    var $ = require('zepto');
    var ui = require('ui');
    var subAjax = require('subAjax');
    var cache = require('cachev1');
    var css = '<style type="text/css" id="videoControlCss">.video_div .pBack{position:absolute;bottom:3px;padding:0;margin:0;background:rgba(1, 1, 1, 0) url(//img11.360buyimg.com/jdphoto/s188x300_jfs/t3238/242/2571782998/9841/715ffcae/57e3ca4aN9d702ef4.png) no-repeat scroll}.video_div .play{background-position:-10px -5px;box-sizing:content-box;width:100%;height:100%}.video_div .pause{background-position:-39px -5px;box-sizing:content-box;width:100%;height:100%}.video_div .playBack{width:0;background-position:0 -36px;background-repeat:repeat;height:5px}.video_div .controlBar{position:relative;background:rgba(0, 0, 0, .8);height:40px;line-height:40px;width:100%}.video_div .playBtn{position:absolute;width:27px;height:27px;left:35px;bottom:3px}.video_div .playScroll{background-position:0 -50px;background-repeat:repeat;left:70px;right:45px;height:5px;bottom:17px}.video_div .barIco{background-position:-65px -5px;width:24px;height:24px;top:-8px;z-index:15;margin-left:-12px;}.video_div .full{display:block;position:absolute;width:19px;height:20px;right:10px;top:12px}.video_div .fullScreen{background-position:-134px -5px;width:100%;height:100%;bottom:0px;}.video_div .cfullScreen{background-position:-151px -5px;width:100%;height:100%;display:none;bottom:0px;}.video_div .logo{position:absolute;display:block;left:12px;top:9px;width:20px;height:20px}</style>';
    var html = '<div class="video-loading" style="display: none"></div><div class="play-btn"></div><div class=controlBar><div class=playBtn><div class="play pBack" data-type=1></div><div class="pause pBack" data-type=2 style="display:none;"></div></div><div class="pBack playScroll" data-type=3><div class="barIco pBack" data-type=4></div><div class="playBar pBack playBack" style="background-position: 0px -36px;z-index:12;bottom:0px;"></div><div class="bufferBar pBack playBack" style="background-position: 0px -43px;z-index:11;"></div><div class=playIng_bg></div><div class=time style="left: 0px;position: absolute;left: 6px;top: -5px;"></div><div class=duration style="position: absolute;    top: -5px;    right: 20px;"></div></div>#fullScreen#<div class=logo><a href="//wqs.jd.com/shoppingv2/shopping.html?PTAG=37513.6.1" style="display: block; "><img src=//img11.360buyimg.com/jdphoto/s30x30_jfs/t3157/176/2467816306/4649/2750b084/57e1fcb7N06a5a389.png style="width: 28px; height: 20px; "></a></div></div>';
    var clss = "", supportFull = supportFullScreen(), alertPlay = false,isIos = isIos();
    exports.init = function (cls, needAlert) {
        var v = $(".video_div");
        if(v.length==0) return;
        clss = cls || "playBTN";
        alertPlay = needAlert ? true : false;
        JD.device.getNetwork(function (type) {
            type == "wifi" && (alertPlay = false);
        });
        getVideoUrl(v);
        detectSupportVideo();
        //增加事件
        addEvent();
        addVideoControlEvent();
        if ($("#videoControlCss").length == 0) {
            $('head').append(css);
        }
    }
    //是不是ios
    function isIos() {
        return /ip(?:hone|ad|od)/.test(navigator.userAgent.toLowerCase());
    }
    /**
     * 获取视频地址
     */
    function getVideoUrl(v){
        var vus;
        var localItem = [];
        v.forEach(function(item){
            try {
                if($(item).find("video").length>0) return;
                var src = $(item).data("src");
                if (src) return;
                vus = $(item).attr("data-videounique");
                if (!vus||vus=="undefined") return;
                item.vus = vus;
                localItem.push(item);
            }catch(e){
                console.log(e);
            }
        });
        if(localItem.length==0) return;

        var lengh = localItem.length;
        (function getA(index){
            if(index>=lengh) return;
            var vu = localItem[index].vus;
            getVideoInfo(vu,index,function(datas){
                if(datas) {
                    var item = localItem[index];
                    if (datas.location) {
                        try {
                            $(item).data("src", datas.location);
                            $("<img />").on("load", function () {
                                    $(item).html('<img src="' + JD.img.getScaleImg(datas.cover) + '"><div class="playBTN feedback_mix_img_play_2">' + computeTime(datas.videoDuration) + '</div>');
                            }).attr("src", JD.img.getScaleImg(datas.cover));
                        } catch (e) {
                            console.log(e);
                        }
                    } else if(datas.main_url){//拉取失败，视频使用ifram方式播放
                        //http://yuntv.letv.com/bcloud.html?uu=82abd5491f&vu=2e793ca854&pu=098df6fe6d&auto_play=0
                        $(item).html('<iframe allowfullscreen webkitallowfullscreen vspace="0" hspace="0" frameborder="0" marginwidth="0" marginheight="0" allowtransparency="true" scrolling="no" src="'+datas.main_url+"&auto_play=0"+'" width="100%"></iframe>');
                    }
                }
                index++;
                getA(index);
            });
        })(0);
    }

    /**
     * 获取视频信息
     * @param vu
     * @param i
     * @param cb
     */
    function getVideoInfo(vu,i,cb){
        subAjax.load({
            url: "//wq.jd.com/contentlib/common/GetVideoInfo",
            dataType: 'jsonp',
            data:{vu:vu},
            jsonpCallback: 'GetVideoAddr',//容灾返回函数
            localCache: true,
            retry: true,//开启重试
            success: function (datas) {
                if(datas.ret==0&&datas.data&&datas.data.main_url){
                    getRealUrl(datas.data,cb);
                    reportUMP(83, 0, "");
                    return;
                }
                cb&&cb();
                reportUMP(83, 1, vu+","+datas.ret);
            },
            error: function (ret) {
                cb&&cb();
                reportUMP(83, 1, vu+","+ret);
            }
        });
    }

    /**
     * 获取乐视真实播放地址
     * @param datas
     * @param cb
     */
    function getRealUrl(datas,cb){
        subAjax.load({
            url: datas.main_url+"&ajax=1&jsonp=letvcloudj8888&_r=jsonp&format=1&expect=3",
            dataType: 'jsonp',
            localCache: true,
            jsonpCallback:"letvcloudj8888",
            retry: true,//开启重试
            success: function (d) {
                if(d&&d.location){
                    datas.location = d.location;
                    cb&&cb(datas);
                    reportUMP(84, 0,"");
                    return;
                }
                cb&&cb(datas);
                reportUMP(84, 1, datas.main_url);
            },
            error: function (ret) {
                cb&&cb();
                reportUMP(84, 1, datas.main_url+","+ret);
            }
        });
    }
    /**
     * 监测是否支持video,mp4
     */
    function detectSupportVideo() {
        var videoTest = document.createElement("video");
        if (cache.getItem("_support_video")) return;
        if (!!videoTest.canPlayType && videoTest.canPlayType('video/mp4')) {
            cache.setItem("_support_video", 1);
            reportUMP(82, 0, "");
        } else {
            cache.setItem("_support_video", 2);
            reportUMP(82, 1, "");
        }
    }

    /**
     * 上报
     * @param operation
     * @param result
     * @param mesg
     */
    function reportUMP(operation, result, mesg) {
        JD.report.umpBiz({
            bizid: '56',
            operation: operation,
            result: result,
            source: '0',
            message: mesg || ''
        });
    }

    /**
     * 绑定开始播放事件
     */
    function addEvent() {
        $(".wrap").on("click", ".video_div ." + clss, function () {
            var item = $(this).parent();
            if (item.find("video").length == 0 && item.data("src")) {//没有视频但是有src了
                if (alertPlay) {
                    var option = {
                        msg: "非wifi条件下播放视频，可能需要耗费您的移动数据网络,是否继续？", //提示消息
                        icon: "info", //图标类型，none,info,fail,success
                        okText: "确定",
                        cancelText: "取消",
                        onConfirm: function () {
                            renderHtml(item);
                            alertPlay = false;
                        } //点击“确认按钮”时的回调
                    };
                    ui.confirm(option);
                } else {
                    renderHtml(item);
                }
            }else{
                item.find("video")[0].play();
                addVideoEvent(item);
            }
        });
    }

    /**
     * 渲染播放视频dom
     * @param item
     */
    function renderHtml(item) {
        var videoHtml = '<video #controls# preload="none" style="margin: auto;max-height:inherit;" webkit-playsinline="true" playsinline><source src="' + item.data("src") + '" type="video/mp4">暂时不支持播放该视频</video>';
        var s = '<div class=loadingInfo style="text-align: center;position: absolute;top: 50%;width: 100%; color: white;margin-top: -30px;display: none; ">京东微信购物<br>这是一个有趣的好货分享社区～<br>视频加载中<span class="dot">...</span></div>' + "<div style='display: none'>"
        var c = false;
        if (item.attr("controls")||isIos) {//没有控制条，且没有加入
            videoHtml = videoHtml.replace("#controls#", "controls");
            s += videoHtml + "</div>";
            c = true;
        } else {
            videoHtml = videoHtml.replace("#controls#", "");
            if(supportFull){
                html = html.replace('#fullScreen#', '<div class="full" data-type="5"><div class="fullScreen pBack"></div></div>');
            }else{
                html = html.replace('#fullScreen#',"");
            }
            s += videoHtml +html+ "</div>";
        }
        item.append(s);
        addVideoEvent(item,c);
    }

    /**
     * 增加控制条事件
     */
    function addVideoControlEvent() {
        $(".wrap").on("click", ".video_div .controlBar div", function (evt) {
            try {
                var self = $(evt.currentTarget);
                var type = self.data("type");
                if (!type) {
                    self = self.parent();
                    type = self.data("type");
                    if (!type) {
                        return;
                    }
                }
                var videoDiv = $(this).parents(".video_div");
                var video = videoDiv.find("video").eq(0);
                if (!video || video.length == 0) return;

                if (type == 1) {
                    video[0].play();//播放
                    videoDiv.find(".play").hide();
                    videoDiv.find(".pause").show();
                    return;
                }
                if (type == 2) {
                    video[0].pause();//暂停
                    videoDiv.find(".pause").hide();
                    videoDiv.find(".play").show();
                    return;
                }

                if (type == 3) {//点击位置播放
                    var duration = video[0].duration;
                    if (!duration || duration < 1) {//不支持获取dur
                        duration = video.data("duration");
                    }
                    if (!duration || duration < 1) return;

                    var offset = videoDiv.find(".playScroll").offset();
                    var rat = (evt.pageX - offset.left) / offset.width;
                    var current = rat * duration;
                    video[0].currentTime = current;
                    var w = rat * offset.width;
                    videoDiv.find(".barIco").css("left", w);
                    videoDiv.find(".playBar").css("width", w);
                    videoDiv.find(".play").hide();
                    videoDiv.find(".pause").show();
                    video[0].play();
                    return;
                }
                if (type == 4) {
                    return;
                }
                if (type == 5) {//全屏
                    var a = video.get(0);
                    if (a.requestFullscreen) {
                        a.requestFullscreen();
                    } else if (a.webkitRequestFullscreen) {
                        a.webkitRequestFullscreen();
                    }
                    //videoDiv.find(".fullScreen").hide();
                    //videoDiv.find(".cfullScreen").show();
                    return;
                }
                //if (type == 6) {//退出全屏
                //    if (document.exitFullscreen) {
                //        document.exitFullscreen();
                //    } else if (document.webkitExitFullscreen) {
                //        document.webkitExitFullscreen();
                //    }
                //    videoDiv.find(".cfullScreen").hide();
                //    videoDiv.find(".fullScreen").show();
                //    return;
                //}
            } catch (e) {
                console.log("handle error " + e);
            }
        });
        $(".wrap").on("click", ".video_div .controlBar div", function (evt) {

        });
    }

    /**
     * 监测是否支持全屏
     * @returns {boolean}
     */
    function supportFullScreen() {
        var a = document.documentElement;
        return "requestFullscreen" in a || "mozRequestFullScreen" in a && document.mozFullScreenEnabled || "webkitRequestFullscreen" in a || "msRequestFullscreen" in a ;
    }
    function GwqVideo(opt) {
        this._init(opt);
    }

    GwqVideo.fn = GwqVideo.prototype;
    /**
     * 初始化
     * @param item
     * @param shareid
     * @param eventArray
     * @private
     */
    GwqVideo.fn._init = function (opt) {
        this.item = opt.item;
        this.shareid = opt.shareid;
        var video = $(opt.item).find("video");
        this.loadTimes = 0;//连续几次interval没有播放
        this.timer = 0;
        this.video = video;
        this.loading = video.siblings(".video-loading");
        this.playBtn = video.siblings(".play-btn");
        this.loadingInfo = $(opt.item).find(".loadingInfo");
        this.offsetw = 0;
        this.errored = 0;//是否发生异常标识
        this.c = video.siblings(".controlBar");
        this.duration = video.data("duration") || 0;
        this.isComputed = false;
        this.lastProcess = 0;
        var self = this;
        this.control = opt.control;
        $(this.item).removeClass("feedback_mix_img").addClass("feedback_one");
        opt.eventArray&&opt.eventArray.forEach(function (str) {
            self.video.on(str, function () {
                self[str].apply(self);
            });
        });
        //恢复播放
        $(opt.item).find(".play-btn").on("tap", function () {
            self.tapPlay.apply(self);
        });
        var dot = $(opt.item).find(".dot");
        var i = 1;
        this.interval = setInterval(function(){
            var str = "";
            for(var n=0;n<i;n++){
                str+=".";
            }
            if(i>=4) i=1;
            else i++;
            dot.html(str);
        },500);
    }
    /**
     * 开始播放
     */
    GwqVideo.fn.playing = function () {
        reportUMP(56, 0, "");
        this.lastProcess = 0;
        if (this.timer) return;
        this.loading.hide();
        this.playBtn.hide();
        this.loadingInfo.hide();
        this.item.find("img").eq(0).hide();
        this.c.find(".play").hide();
        this.c.find(".pause").show();
        this.video.parent().show();
        clearInterval(this.interval);
        if(this.control) return;
        this.c.find(".playScroll").length>0&&(this.offsetw = this.c.find(".playScroll").offset().width);
        console.log("playing");
        this.loadTimes = 0;
        var self = this;
        this.timer = setInterval(function () {
            self.loadTimes++;
            if (self.loadTimes >= 4) {//连续3次未播放，当作是卡住了
                self.loading.show();
            } else {
                self.loading.hide();
            }
            if (self.video[0].ended) {
                clearInterval(self.timer);
                self.loading.hide();
            }
        }, 300);
    }
    /**
     * 播放中
     */
    GwqVideo.fn.timeupdate = function () {
        this.loading.hide();
        this.playBtn.hide();
        this.loadTimes = 0;//在播放中，清除卡住标识
        //console.log("timeupdate,"+video[0].currentTime);
        var t = this.video[0].currentTime;
        var w = t / this.duration * this.offsetw;
        w && this.c.find(".barIco").css("left", w);
        w && this.c.find(".playBar").css("width", w);
        this.coputeUpdateTime(t);
    }
    /**
     * 被中止
     */
    GwqVideo.fn.abort = function () {
        this.errors(this.shareid + ",abort:" + this.video.error);
    }

    GwqVideo.fn.errors = function (msg) {
        this.loading.hide();
        this.video.siblings(".play-btn").show();
        clearInterval(this.timer);
        console.log("abort");
        this.errored++;
        this.errored == 1 && reportUMP(56, 1, msg);
    }
    /**
     * 异常
     */
    GwqVideo.fn.error = function () {
        this.errors(this.shareid + ",error:" + this.video.error);
    }
    /**
     * 播放完毕
     */
    GwqVideo.fn.ended = function () {
        this.loading.hide();
        this.playBtn.show();
        clearInterval(this.timer);
        console.log("ended");
        $(this.item).find(".time").html($(this.item).find(".duration").html());//最后一秒可能有差异
    }
    /**
     * 暂停
     */
    GwqVideo.fn.pause = function () {
        this.loading.hide();
        this.playBtn.show();
        this.c.find(".play").show();
        this.c.find(".pause").hide();
        clearInterval(this.timer);
        console.log("pause");
    }
    /**
     * 播放时长变化
     */
    GwqVideo.fn.durationchange = function () {
        this.computeDuration();
    }
    /**
     * 获取到元数据
     */
    GwqVideo.fn.loadedmetadata = function () {
        this.computeDuration();
    }
    /**
     * 设置播放总时长
     */
    GwqVideo.fn.computeDuration = function () {
        if (this.isComputed) return;
        this.isComputed = true;
        var d = this.video[0].duration;
        if (d) {
            this.video.data("duration", d);
            this.duration = d;
            $(this.item).find(".duration").html(computeTime(d));
            $(this.item).find(".time").html("00:00");
        }
    }
    /**
     * 计算播放中的时长
     */
    GwqVideo.fn.coputeUpdateTime = function (d) {
        d = parseInt(d);
        if (d - this.lastProcess >= 1) {
            $(this.item).find(".time").html(computeTime(d));
            this.lastProcess = d;
        }
    }
    /**
     * 点击播放
     */
    GwqVideo.fn.tapPlay = function () {
        //是异常终止的。需要重新Load视频流才能继续播放
        if (this.errored) this.video[0].load();
        this.video[0].play();
        this.playBtn.hide();
        this.c.find(".play").hide();
        this.c.find(".pause").show();
    }
    /**
     * 将播放的秒数，转换成00:00
     * @param d
     * @returns {string}
     */
    function computeTime(d) {
        if(isNaN(d)) return "";
        var str = "";
        var hour = parseInt(d / 3600);
        if (hour > 0) {
            if (hour < 10) {
                str = "0" + hour;
            } else {
                str = hour;
            }
            str += ":";
        }
        var hm = d % 3600;
        var m = parseInt(hm / 60);
        if (m < 10) {
            str += "0" + m;
        } else {
            str += m;
        }
        str += ":";
        var s = Math.floor(hm % 60);
        if (s < 10) {
            str += "0" + s;
        } else {
            str += s;
        }
        return str;
    }

    /**
     * 给video注册事件
     * @param item
     */
    function addVideoEvent(item,c) {
        var video = $(item).find("video");
        var shareid = $(item).closest('.feedback_new').attr("data-shareid") || "0";
        new GwqVideo({"item":item, "shareid":shareid,"eventArray":c?['playing']:['playing', 'timeupdate', 'abort', 'error', 'ended', 'pause', 'durationchange', 'loadedmetadata'],"control":c});
        item.find("." + clss).eq(0).hide();
        item.find(".loadingInfo").show();
        video[0].play();
    }

});
