// Put all your page JS here

$(function () {
    $('#slickQuiz').slickQuiz({
		animationCallbacks: {
			setupQuiz: function () {console.log ('setupQuiz animation complete');},
        	startQuiz: function () {console.log ('startQuiz animation complete');},
        	resetQuiz: function () {console.log ('resetQuiz animation complete');},
        	checkAnswer: function () {console.log ('checkAnswer animation complete');},
        	nextQuestion: function () {console.log ('nextQuestion animation complete');},
        	backToQuestion: function () {console.log ('backToQuestion animation complete');},
        	completeQuiz: function () {console.log ('completeQuiz animation complete');}
		},
		events: {
			onStartQuiz: function () {console.log ('quiz started');},
			onCompleteQuiz: function (options) {
				console.log ('quiz completed with feedback args: ' +
						(options && options.questionCount ? options.questionCount : 'null') +
								' & ' +
								(options && options.score ? options.score : 'null')
						);
			}
		},
    	backButtonText: 'back',
    	tryAgainText: 'try again'
    });
});
