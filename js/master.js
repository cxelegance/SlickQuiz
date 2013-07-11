// Put all your page JS here

$(function () {
    $('#slickQuiz').slickQuiz({
            animationCallbacks: {
                setup: function () {console.log ('setup complete');},
                start: function () {console.log ('start complete');},
                checkSubmit: function () {console.log ('check or submit complete');},
                back: function () {console.log ('back complete');},
                next: function () {console.log ('next complete');}
            },
	backButtonText: 'back'
	});
});
