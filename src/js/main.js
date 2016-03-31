$(function() {

    var App = (function(){

        return {
            init : function() {
                MenuCollapse.init();
                Popups.init();
                PopupForm.init();
                Player.init();
                BtnFilter.init();
                Timer.init();
                DefaultPopups.init();
            }
        }
    })()

    ,Timer = (function(){
        var T = {};
        T.timer = null;
        T.amount = 20;
        T.cacheElems = function() {
            T.$ = {};
            T.$.instance = $(".question__time");
            T.$.label = $("#timer_label");
            T.$.value = $("#timer_val");
        };

        T.bindEvents = function() {};

        T.set = function(amount) {
            // на будущее данная функция работает 
            // с числами больше 20
            T.$.value.text(amount);

            var lastDigit = (amount % 10);
            var label = '';
            if (lastDigit <= 0) {
                label = 'секунд';
            } else if (lastDigit <= 1) {
                label = 'секунда';
            } else if ( lastDigit <= 4 ) {
                label = 'секунды';
            } else {
                label = 'секунд';
            }

            // исключение (11-14) секунд а не секунда/секунды
            if ( ( amount>=11 ) && (amount<=14) ) {
                label = 'секунд';
            }

            T.$.label.text(label);
        }

        T.start = function() {
            T.cacheElems(); // one more time (template was redrawn)
            T.timer = window.setInterval(function(){
                T.set(--T.amount);
                if (!T.amount) {
                    console.log ('game fucking over');
                    T.stop();
                }
            }, 1000);
        }

        T.stop = function() {
            clearTimeout(T.timer);
        }

        T.init = function() {
            T.cacheElems();
            T.bindEvents();
        };

        return T;
    })()

    ,MenuCollapse = (function(){
        return {
            init : function() {
                $('#toggle-menu').on('click',function(){
                    $(this).toggleClass('cross');
                    $('#nav').toggleClass('open');
                });
            }
        }
    })()

    ,Popups = (function(){

        var PP = {};

        PP.q = 0;
        PP.qe = null;

        PP.showQuestion = function() {
            var q = PP.q;
            var qe = PP.qe;
            var tmplData = {
                pic : qe.episodePic,
                author_name : PP.questionTypeHelper(qe.questions[q].type).author,
                author_pic : PP.questionTypeHelper(qe.questions[q].type).pic,
                points   : qe.questions[q].points,
                question : qe.questions[q].title,
                answer1  : qe.questions[q].answers[0],
                answer2  : qe.questions[q].answers[1],
                answer3  : qe.questions[q].answers[2],
            };

            var tmpl = PP.$.template.html();
            PP.$.popup_q.html( _.template(tmpl)(tmplData) );
            PP.$.popup_q.find('.question__state').find('li').eq(PP.q).addClass('active');

            Timer.start();
        };

        PP.cacheElems = function() {
            PP.$ = {};
            PP.$.popup = $("#question_popup");
            PP.$.popup_q = PP.$.popup.find('.question.question--go');
            PP.$.callers = $('.popup__caller');
            PP.$.template = $("#question_popup_tmpl");
            PP.$.btnStart = $("#popup_btn_start");
        };

        PP.questionTypeHelper = function(type) {
            var R = {};
            if (type == 'fromMorgan') {
                R.pic = 'images/q/freeman.png';
                R.author = 'Морган Фриман'
            };

            return R;
        };

        PP.showFinalScreen = function() {
            PP.$.popup
                .removeClass('popup-question--go')
                .removeClass('popup-question--start')
                .addClass('popup-question--share');
        };

        PP.bindEvents = function() {

            if ( !PP.$.callers.length ) return;
            PP.$.callers.on('click',function(e){
                e.preventDefault();

                var fader = '<div class="popup__fader"></div>',
                    $caller = $(this);

                PP.qe = QUESTIONS[$caller.data('episode')]; // берем данные из хранилища

                PP.$.popup.fadeIn(250, function(){
                    $(this).addClass('active');
                    if ($caller.attr('data-active')){ // for social authorise popup only
                        var item = $caller.attr('data-active');
                        PP.$.popup.find('.active').removeClass('active');
                        PP.$.popup.find(item).addClass('active');
                    }
                });
                $('body').addClass('noscroll').append(fader);
            });

            // Close popup
            $(document).on('click', "[popup-closer], .popup__fader", function(e){
                e.preventDefault();

                $('.popup.active').fadeOut(200,function(){
                    $(this).removeClass('active');
                    $('body').removeClass('noscroll');
                    if ($('.popup__fader').length){
                        $('.popup__fader').remove();
                    }
                });
            });

            // btn answer (is always redrawn, so do not used cached item)
            $(document).on('click', "#question_btn_answer", function(){
                Timer.stop();
                PP.q++;
                if (PP.q < 3 ) {
                    PP.showQuestion();
                } else {
                    PP.showFinalScreen();
                }

                return false;
            });

            PP.$.btnStart.on('click', function() {
                $(this).parents('.popup-question--start')
                       .removeClass('popup-question--start')
                       .addClass('popup-question--go');

                // 1-ый вопрос по умолчанию при старте
                PP.q = 0;
                PP.showQuestion();
                return false;
            });
        };

        PP.init = function() {
            PP.cacheElems();
            PP.bindEvents();
        };

        return PP;
    })()

    ,PopupForm = (function(){
        var PF = {};

        PF.email = '';
        PF.HTML = {
            err : '<div class="err"><div class="h1">Произошла ошибка</div></div>',
            btn : '<button class="btn visible" id="show-again">Попробовать еще раз</button>'
        }
        PF.errorMessage = 'Произошла ошибка. Пожалуйста, попробуйте еще раз.';

        PF.success = function(data){
            if ( data.error ) {
                var errorHTML = '<p>'+(data.errorMessage ? data.errorMessage : errorMsg) + '</p>';
                $('.reminder').fadeOut(500, function(){
                    $(this).parents('.popup__body')
                        .append( $(PF.HTML.err).append(errorHTML) )
                        .append( PF.HTML.btn );
                });
            } else {
                $('.reminder').fadeOut(500, function(){
                    $('#done-email').text(PF.email);
                    $('.done').fadeIn(500)
                });
            }
        };
        PF.error = function(data) {
            var errorHTML = '<p>'+(data.errorMessage ? data.errorMessage : errorMsg) + '</p>';
            $('.reminder').fadeOut(500, function(){
                $(this).parents('.popup__body')
                    .append( $(PF.HTML.err).append(errorHTML) )
                    .append( PF.HTML.btn );
            });
        }

        PF.init = function() {

            $('[js-validate]').each(function(i,form){
                $(form).validate({
                    submitHandler: function(form) {
                        PF.email = $(form).find('[name=email]').val();
                        var data = $(form).serialize();

                        $.ajax({
                            url     : $(form).attr('action'),
                            method  : $(form).attr('method'),
                            data    : data,
                            success : PF.success,
                            error   : PF.error
                        });

                        return false;
                    }
                });
            });

            $(document).on('click', '#show-again', function(e){
                e.preventDefault();

                $('.popup__body').find('.err, #show-again').fadeOut(500,function(){
                    $('.reminder').fadeIn(500);
                });
            });
        }

        return PF;
    })()

    ,Player = (function(){
        var PL = {};

        PL.fitContainerHeight = function(){
            var $mainContent = $('.layout-main'),
                ph = $(window).height() - 70,
                ww = $(window).width();
            $mainContent.find('.container').css('height','auto');
            if ($mainContent.length) {
                if ($('body').hasClass('page-about')) {
                    //$mainContent.find('.fullscreen-section').removeAttr('style');
                    if (ww > 1023) {

                        $mainContent.find('.fullscreen-section:not(.custom-height)').css('height', ph);

                    } else {
                        $mainContent.find('.fullscreen-section:not(.custom-height)').removeAttr('style');
                    }
                }

                var ch = $mainContent.height();
                cnth = $mainContent.find('.container').outerHeight();
                if (ch > cnth) {
                    $mainContent.find('.container').css('height', ch);
                } else {
                    $mainContent.find('.container').css('height', 'auto');
                }
            }
            
            if ($mainContent.hasClass('.page-about')){
                if ($('.about-img-wrap').css('display') == "block"){
                    var h = $('.about-img-wrap').css('height') + 70;
                    $(".player").css('height', h);
                } else {
                    $(".player").css('height', "100%");
                }
            }
        };
        PL.init = function() {

            $(window).on('resize load',PL.fitContainerHeight);

            if (!isMobile.any) {
                if (typeof $.fn.mb_YTPlayer != "undefined") {
                    $(".player").mb_YTPlayer({
                        onError: function(){
                            $('body').addClass('no-video');
                            if ($('.about-img-wrap').length) {
                                $('.about-img-wrap').removeClass('transparent');
                            }
                        }
                    });
                    $(".player").on("YTPEnd", function(e) {
                        $(this).YTPPlay();
                    });
                    $(".player").on("YTPReady", function(e) {
                        if ($('.about-img-wrap').length) {
                            $('.about-img-wrap').addClass('transparent');
                        }
                    });
                } else {
                    $('body').addClass('no-video');
                    if ($('.about-img-wrap').length) {
                        $('.about-img-wrap').removeClass('transparent');
                    }
                }
            } else { //mobile phone detect
                $('body').addClass('no-video');
                if ($('.about-img-wrap').length) {
                    $('.about-img-wrap').removeClass('transparent');
                }
            }
        }

        return PL;
    })()

    ,BtnFilter = (function(){
        return {
            init : function() {
                $btns = $('.btn-filter .btn:not(.inactive)');
                if (!$btns.length) return false;

                $btns.on('click',function(e){
                    e.preventDefault();
                    $btns.removeClass('active');
                    $(this).addClass('active');

                    var id = $(this).attr('id');

                    if (id == 'all'){
                        $('[data-episode]').fadeIn();

                    } else {
                        $('[data-episode]').fadeOut();
                        $('[data-episode="' + id + '"]').fadeIn(500);
                    }
                    $('[data-id]').fadeOut();
                    $('[data-id="' + id + '"]').fadeIn(500);
                });
            }
        }
    })(),
    
    DefaultPopups = (function(){
        return {
            init: function(){
                var $callers = $('.popup__caller');

                $callers.on('click',function(e){
                    e.preventDefault();
                    var popup = $(this).attr('href'),
                        fader = '<div class="popup__fader"></div>',
                        $caller = $(this);

                    $(popup).fadeIn(500,function(){
                        $(this).addClass('active');
                        if ($caller.attr('data-active')){ // for social authorise popup only
                            var item = $caller.attr('data-active');
                            $(popup).find('.active').removeClass('active');
                            $(popup).find(item).addClass('active');
                        }
                    });

                    $('body').addClass('noscroll').append(fader);
                });
                $(document).on('click', "[popup-closer], .popup__fader", function(e){
                    e.preventDefault();

                    $('.popup.active').fadeOut(500,function(){
                        $(this).removeClass('active');
                        $('body').removeClass('noscroll');
                        if ($('.popup__fader').length){
                            $('.popup__fader').remove();
                        }
                    });

                });
            }
        }
    })()

    /**
     * Dummy Module Example
     */
    ,DummyModule = (function(){
        return {
            init : function() {
                // do something
            }
        }
    })()

    ;App.init();

});
