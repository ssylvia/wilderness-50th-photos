var idleWait = 300000;

var idleTimer = null;
var idleState = false;

(function ($) {

    $(document).ready(function () {

        $('*').bind('mousemove keydown scroll', function () {

            clearTimeout(idleTimer);

            idleState = false;

            idleTimer = setTimeout(function () {

                // Idle Event
                location.reload();

                idleState = true; }, idleWait);
        });

        $("body").trigger("mousemove");

    });
}) (jQuery);