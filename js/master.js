// Put all your page JS here

$(function () {
    $('#slickQuiz').slickQuiz({
		callbacks: {
			animations: {
				setupQuiz: function () {console.log ('setupQuiz complete');},
            	startQuiz: function () {console.log ('startQuiz complete');},
            	resetQuiz: function () {console.log ('resetQuiz complete');},
            	checkAnswer: function () {console.log ('checkAnswer complete');},
            	nextQuestion: function () {console.log ('nextQuestion complete');},
            	backToQuestion: function () {console.log ('backToQuestion complete');},
            	completeQuiz: function () {console.log ('completeQuiz complete');}
			},
			events: {
				completeQuiz: function (options) {
					console.log ('quiz completed with:' +
							(options && options.questionCount ? options.questionCount : 'null') +
									' & ' +
									(options && options.score ? options.score : 'null')
							);
				}
			}
		},
    	backButtonText: 'back',
    	tryAgainText: 'try again'
    });
});
