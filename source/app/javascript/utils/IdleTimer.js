var idleWait = 5000;

var idleTimer = null;
var idleState = false;

(function ($) {

    $(document).ready(function () {

        $('*').bind('mousemove keydown scroll', function () {

            clearTimeout(idleTimer);

            idleState = false;

            idleTimer = setTimeout(function () {

                // Idle Event
                window.location = 'http://storymaps.esri.com/stories/2014/wilderness-start-page/';

                idleState = true; }, idleWait);
        });

        $("body").trigger("mousemove");

    });
}) (jQuery);