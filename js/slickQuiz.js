/*!
 * SlickQuiz jQuery Plugin
 * http://github.com/QuickenLoans/SlickQuiz
 *
 * @updated April 29, 2013
 *
 * @author Julie Bellinson - http://www.jewlofthelotus.com
 * @copyright (c) 2013 Quicken Loans - http://www.quickenloans.com
 * @license MIT
 */

(function($){
    $.slickQuiz = function(element, options) {
        var $element = $(element),
             element = element;

        var plugin = this;

        var defaults = {
            checkAnswerText:  'Check My Answer!',
            nextQuestionText: 'Next &raquo;',
            backButtonText: '',
            randomSort: false,
            randomSortQuestions: false,
            randomSortAnswers: false,
            preventUnanswered: false,
            completionResponseMessaging: false,
            disableResponseMessaging: false,
            animationCallbacks: {
                setup: function () {},
                start: function () {},
                checkSubmit: function () {},
                back: function () {},
                next: function () {}
            }
        };

        // Reassign user-submitted deprecated options
        var depMsg = '';

        if (options && typeof options.disableNext != 'undefined') {
            if (typeof options.preventUnanswered == 'undefined') {
                options.preventUnanswered = options.disableNext;
            }
            depMsg += 'The \'disableNext\' option has been deprecated, please use \'preventUnanswered\' in it\'s place.\n\n';
        }

        if (depMsg !== '') {
            if (typeof console != 'undefined') {
                console.warn(depMsg);
            } else {
                alert(depMsg);
            }
        }
        // End of deprecation reassignment

        plugin.config = $.extend(defaults, options);

        var selector = $(element).attr('id');

        var triggers = {
            starter:         '#' + selector + ' .startQuiz',
            checker:         '#' + selector + ' .checkAnswer',
            next:            '#' + selector + ' .nextQuestion',
            back:            '#' + selector + ' .backToQuestion'
        };

        var targets = {
            quizName:        '#' + selector + ' .quizName',
            quizArea:        '#' + selector + ' .quizArea',
            quizResults:     '#' + selector + ' .quizResults',
            quizResultsCopy: '#' + selector + ' .quizResultsCopy',
            quizHeader:      '#' + selector + ' .quizHeader',
            quizScore:       '#' + selector + ' .quizScore',
            quizLevel:       '#' + selector + ' .quizLevel'
        };

        // Set via json option or quizJSON variable (see slickQuiz-config.js)
        var quizValues = (plugin.config.json ? plugin.config.json : typeof quizJSON != 'undefined' ? quizJSON : null);

        var questions = plugin.config.randomSort || plugin.config.randomSortQuestions ?
                        quizValues.questions.sort(function() { return (Math.round(Math.random())-0.5); }) :
                        quizValues.questions;

        var levels = {
            1: quizValues.info.level1, // 80-100%
            2: quizValues.info.level2, // 60-79%
            3: quizValues.info.level3, // 40-59%
            4: quizValues.info.level4, // 20-39%
            5: quizValues.info.level5  // 0-19%
        };

        // Count the number of questions
        var questionCount = questions.length;

        // some special private/internal methods, including those for handling deferred callbacks
        var internal = {method: {
                // get the required number of deferred objects wrapped in an totalDeferreds object
                getTotalDeferreds: function(quantity) { // assuming good arguments
                        var totalDeferreds = {total: quantity, counter: quantity};
                        // e.g. totalDeferreds = { // quantity = 3
                        //	total:		3, // this will hold its value
                        //	counter:	3, // this will be used to count down
                        //	'0':		$.Deferred(), // deferred objects have 'resolve' and 'promise' methods
                        //	'1':		$.Deferred(),
                        //	'2':		$.Deferred()
                        // }
                        for (i = 0; i < quantity; i++) totalDeferreds[i] = $.Deferred();
                        return totalDeferreds;
                },

                // a totalDeferreds object contains many deferred objects; wait for all deferred objects to resolve and then take action
                actTotalDeferreds: function(totalDeferreds, callback) { // assuming good arguments
                        var stack = [];
                        for (i = 0; i < totalDeferreds.total; i++) stack.push(totalDeferreds[i].promise()); //easy to process all the deferred promises as an array
                        $.when.apply(null, stack).then(function () {
                                callback();
                        });
                },

                // build and return a callback function that will resolve one of the deferreds in totalDeferreds
                resolve1Deferred: function(totalDeferreds) {
                        var counter = --totalDeferreds.counter;
                        return function() {
                                totalDeferreds[counter].resolve();
                        };
                }
        }};

        plugin.method = {
            // Sets up the questions and answers based on above array
            setupQuiz: function(options) {
                // use jQ deferred objects as callbacks for animations
                var tdf = internal.method.getTotalDeferreds(3), // BE SURE that # of deferreds matches # of animation callbacks required in this method!
                gcb = internal.method.resolve1Deferred; // this is your Get Callback function, it takes totalDeferreds as input and gives you an animation callback function

                $(targets.quizName).hide().html(quizValues.info.name).fadeIn(1000, gcb(tdf)); // callback 1
                $(targets.quizHeader).hide().prepend(quizValues.info.main).fadeIn(1000, gcb(tdf)); // callback 2
                $(targets.quizResultsCopy).append(quizValues.info.results);

                // Setup questions
                var quiz  = $('<ol class="questions"></ol>'),
                    count = 1;

                // Loop through questions object
                for (i in questions) {
                    if (questions.hasOwnProperty(i)) {
                        var question = questions[i];

                        var questionHTML = $('<li class="question" id="question' + (count - 1) + '"></li>');
                        questionHTML.append('<div class="questionCount">Question <span class="current">' + count + '</span> of <span class="total">' + questionCount + '</span></div>');
                        questionHTML.append('<h3>' + count + '. ' + question.q + '</h3>');

                        // Count the number of true values
                        var truths = 0;
                        for (i in question.a) {
                            if (question.a.hasOwnProperty(i)) {
                                var answer = question.a[i];
                                if (answer.correct) {
                                    truths++;
                                }
                            }
                        }

                        // prepare a name for the answer inputs based on the question
                        var inputName  = 'question' + (count - 1);

                        // Now let's append the answers with checkboxes or radios depending on truth count
                        var answerHTML = $('<ul class="answers"></ul>');

                        var answers = plugin.config.randomSort || plugin.config.randomSortAnswers ?
                            question.a.sort(function() { return (Math.round(Math.random())-0.5); }) :
                            question.a;

                        for (i in answers) {
                            if (answers.hasOwnProperty(i)) {
                                var answer   = answers[i],
                                    optionId = inputName + '_' + i.toString();

                                // If question has >1 true answers, use checkboxes; otherwise, radios
                                var input = '<input id="' + optionId + '" name="' + inputName
                                    + '" type="' + (truths > 1 ? 'checkbox' : 'radio') + '" />';

                                var optionLabel = '<label for="' + optionId + '">' + answer.option + '</label>';

                                var answerContent = $('<li></li>')
                                    .append(input)
                                    .append(optionLabel);
                                answerHTML.append(answerContent);
                            }
                        }

                        // Append answers to question
                        questionHTML.append(answerHTML);

                        // If response messaging is NOT disabled, add it
                        if (!plugin.config.disableResponseMessaging) {
                            // Now let's append the correct / incorrect response messages
                            var responseHTML = $('<ul class="responses"></ul>');
                            responseHTML.append('<li class="correct">' + question.correct + '</li>');
                            responseHTML.append('<li class="incorrect">' + question.incorrect + '</li>');

                            // Append responses to question
                            questionHTML.append(responseHTML);
                        }

                        // Appends check answer / back / next question buttons
                        if (plugin.config.backButtonText && plugin.config.backButtonText !== '') {
                            questionHTML.append('<a href="#" class="button backToQuestion">' + plugin.config.backButtonText + '</a>');
                        }

                        // If response messaging is disabled or hidden until the quiz is completed,
                        // make the nextQuestion button the checkAnswer button, as well
                        if (plugin.config.disableResponseMessaging || plugin.config.completionResponseMessaging) {
                            questionHTML.append('<a href="#" class="button nextQuestion checkAnswer">' + plugin.config.nextQuestionText + '</a>');
                        } else {
                            questionHTML.append('<a href="#" class="button nextQuestion">' + plugin.config.nextQuestionText + '</a>');
                            questionHTML.append('<a href="#" class="button checkAnswer">' + plugin.config.checkAnswerText + '</a>');
                        }

                        // Append question & answers to quiz
                        quiz.append(questionHTML);

                        count++;
                    }
                }

                // Add the quiz content to the page
                $(targets.quizArea).append(quiz);

                // Toggle the start button
                $(triggers.starter).fadeIn(500, gcb(tdf)); // callback 3

                // handle the deferred objects for callbacks
                internal.method.actTotalDeferreds(tdf, function () { // ensure that each deferred has been resolved in the code above!
                    if (options && options.callback) options.callback (); // assume callback is a function
                });
            },

            // Starts the quiz (hides start button and displays first question)
            startQuiz: function(startButton, options) {
                // use jQ deferred objects as callbacks for animations
                var tdf = internal.method.getTotalDeferreds(1), // BE SURE that # of deferreds matches # of animation callbacks required in this method!
                gcb = internal.method.resolve1Deferred; // this is your Get Callback function, it takes totalDeferreds as input and gives you an animation callback function
                // start the quiz
                $(startButton).fadeOut(300, function(){
                    var firstQuestion = $('#' + selector + ' .questions li').first();
                    if (firstQuestion.length) {
                        firstQuestion.fadeIn(500, gcb(tdf)); // callback 1
                    } else (gcb(tdf))(); // callback 1
                });
                // handle the deferred objects for callbacks
                internal.method.actTotalDeferreds(tdf, function () { // ensure that each deferred has been resolved in the code above!
                    if (options && options.callback) options.callback (); // assume callback is a function
                });
            },

            // Validates the response selection(s), displays explanations & next question button
            checkAnswer: function(checkButton, options) {
                var questionLI   = $($(checkButton).parents('li.question')[0]),
                    answerInputs = questionLI.find('input:checked'),
                    answers      = questions[parseInt(questionLI.attr('id').replace(/(question)/, ''))].a;

                // use jQ deferred objects as callbacks for animations
                var tdf = internal.method.getTotalDeferreds(3), // BE SURE that # of deferreds matches # of animation callbacks required in this method!
                gcb = internal.method.resolve1Deferred; // this is your Get Callback function, it takes totalDeferreds as input and gives you an animation callback function

                // Collect the true answers needed for a correct response
                var trueAnswers = [];
                for (i in answers) {
                    if (answers.hasOwnProperty(i)) {
                        var answer = answers[i];

                        if (answer.correct) {
                            trueAnswers.push($('<div />').html(answer.option).text())
                        }
                    }
                }

                // Collect the answers submitted
                var selectedAnswers = [];
                answerInputs.each( function() {
                    // If we're in jQuery Mobile, grab value from nested span
                    if ($('.ui-mobile').length > 0) {
                        var inputValue = $(this).next('label').find('span.ui-btn-text').text();
                    } else {
                        var inputValue = $(this).next('label').text();
                    }

                    selectedAnswers.push(inputValue);
                });

                if (plugin.config.preventUnanswered && selectedAnswers.length === 0) {
                    alert('You must select at least one answer.');
                    (gcb(tdf))(); // callback 1
                    (gcb(tdf))(); // callback 2
                    (gcb(tdf))(); // callback 3
                    return false;
                }

                // Verify all true answers (and no false ones) were submitted
                var correctResponse = plugin.method.compareAnswers(trueAnswers, selectedAnswers);

                if (correctResponse) {
                    questionLI.addClass('correctResponse');
                }

                // If response messaging hasn't been disabled, toggle the proper response
                if (!plugin.config.disableResponseMessaging) {
                    // If response messaging hasn't been set to display upon quiz completion, show it now
                    if (!plugin.config.completionResponseMessaging) {
                        questionLI.find('.answers').hide();
                        questionLI.find('.responses').show();

                        $(checkButton).hide();
                        questionLI.find('.nextQuestion').length ? questionLI.find('.nextQuestion').fadeIn(300, gcb(tdf)) : (gcb(tdf))(); // callback 1
                        questionLI.find('.backToQuestion').length ? questionLI.find('.backToQuestion').fadeIn(300, gcb(tdf)) : (gcb(tdf))(); // callback 2
                    } else {
                        (gcb(tdf))(); // callback 1
                        (gcb(tdf))(); // callback 2
                    }

                    // Toggle responses based on submission
                    if (correctResponse) {
                        questionLI.find('.correct').length ? questionLI.find('.correct').fadeIn(300, gcb(tdf)) : (gcb(tdf))(); // callback 3
                    } else {
                        questionLI.find('.incorrect').length ? questionLI.find('.incorrect').fadeIn(300, gcb(tdf)) : (gcb(tdf))(); // callback 3
                    }
                } else {
                        (gcb(tdf))(); // callback 1
                        (gcb(tdf))(); // callback 2
                        (gcb(tdf))(); // callback 3
                }
                // handle the deferred objects for callbacks
                internal.method.actTotalDeferreds(tdf, function () { // ensure that each deferred has been resolved in the code above!
                    if (options && options.callback) options.callback (); // assume callback is a function
                });
            },

            // Moves to the next question OR completes the quiz if on last question
            nextQuestion: function(nextButton, options) {
                var currentQuestion = $($(nextButton).parents('li.question')[0]),
                    nextQuestion    = currentQuestion.next('.question'),
                    answerInputs    = currentQuestion.find('input:checked');

                // use jQ deferred objects as callbacks for animations
                var tdf = internal.method.getTotalDeferreds(1), // BE SURE that # of deferreds matches # of animation callbacks required in this method!
                gcb = internal.method.resolve1Deferred; // this is your Get Callback function, it takes totalDeferreds as input and gives you an animation callback function

                // If response messaging has been disabled or moved to completion,
                // make sure we have an answer if we require it, let checkAnswer handle the alert messaging
                if (plugin.config.preventUnanswered && answerInputs.length === 0) {
                    (gcb(tdf))();
                    return false;
                }

                if (nextQuestion.length) {
                    currentQuestion.fadeOut(300, function(){
                        nextQuestion.find('.backToQuestion').show().end().fadeIn(500, gcb(tdf)); // callback 1
                    });
                } else {
                    plugin.method.completeQuiz({callback: gcb(tdf)}); // callback 1
                }
                // handle the deferred objects for callbacks
                internal.method.actTotalDeferreds(tdf, function () { // ensure that each deferred has been resolved in the code above!
                    if (options && options.callback) options.callback (); // assume callback is a function
                });
            },

            // Go back to the last question
            backToQuestion: function(backButton, options) {
                var questionLI = $($(backButton).parents('li.question')[0]),
                    answers    = questionLI.find('.answers');

                // use jQ deferred objects as callbacks for animations
                var tdf = internal.method.getTotalDeferreds(2), // BE SURE that # of deferreds matches # of animation callbacks required in this method!
                gcb = internal.method.resolve1Deferred; // this is your Get Callback function, it takes totalDeferreds as input and gives you an animation callback function

                // Back to previous question
                if (answers.css('display') === 'block' ) {
                    var prevQuestion = questionLI.prev('.question');

                    questionLI.fadeOut(300, function() {
                        prevQuestion.removeClass('correctResponse');
                        prevQuestion.find('.responses, .responses li').hide();
                        prevQuestion.find('.answers').show();
                        prevQuestion.find('.checkAnswer').show();

                        // If response messaging hasn't been disabled or moved to completion, hide the next question button
                        // If it has been, we need nextQuestion visible so the user can move forward (there is no separate checkAnswer button)
                        if (!plugin.config.disableResponseMessaging && !plugin.config.completionResponseMessaging) {
                            prevQuestion.find('.nextQuestion').hide();
                        }

                        if (prevQuestion.attr('id') != 'question0') {
                            prevQuestion.find('.backToQuestion').show();
                        } else {
                            prevQuestion.find('.backToQuestion').hide();
                        }

                        prevQuestion.fadeIn(500, gcb(tdf)); // callback 1
                        (gcb(tdf))(); // callback 2
                    });

                // Back to question from responses
                } else {
                    questionLI.find('.responses').fadeOut(300, function(){
                        questionLI.removeClass('correctResponse');
                        questionLI.find('.responses li').hide();
                        answers.fadeIn(500, gcb(tdf)); // callback 1
                        questionLI.find('.checkAnswer').fadeIn(500, gcb(tdf)); // callback 2
                        questionLI.find('.nextQuestion').hide();

                        // if question is first, don't show back button on question
                        if (questionLI.attr('id') != 'question0') {
                            questionLI.find('.backToQuestion').show();
                        } else {
                            questionLI.find('.backToQuestion').hide();
                        }
                    });
                }
                // handle the deferred objects for callbacks
                internal.method.actTotalDeferreds(tdf, function () { // ensure that each deferred has been resolved in the code above!
                    if (options && options.callback) options.callback (); // assume callback is a function
                });
            },

            // Hides all questions, displays the final score and some conclusive information
            completeQuiz: function(options) {
                var score     = $('#' + selector + ' .correctResponse').length,
                    levelRank = plugin.method.calculateLevel(score),
                    levelText = levels[levelRank];

                // use jQ deferred objects as callbacks for animations
                var tdf = internal.method.getTotalDeferreds(1), // BE SURE that # of deferreds matches # of animation callbacks required in this method!
                gcb = internal.method.resolve1Deferred; // this is your Get Callback function, it takes totalDeferreds as input and gives you an animation callback function

                $(targets.quizScore + ' span').html(score + ' / ' + questionCount);
                $(targets.quizLevel + ' span').html(levelText);
                $(targets.quizLevel).addClass('level' + levelRank);

                $(targets.quizArea).fadeOut(300, function() {
                    // If response messaging is set to show upon quiz completion, show it
                    if (plugin.config.completionResponseMessaging && !plugin.config.disableResponseMessaging) {
                        $('#' + selector + ' .questions input').prop('disabled', true);
                        $('#' + selector + ' .questions .button, #' + selector + ' .questions .questionCount').hide();
                        $('#' + selector + ' .questions .question, #' + selector + ' .questions .responses').show();
                        $(targets.quizResults).append($('#' + selector + ' .questions')).fadeIn(500, gcb(tdf)); // callback 1
                    } else {
                        $(targets.quizResults).fadeIn(500, gcb(tdf)); // callback 1
                    }
                });
                // handle the deferred objects for callbacks
                internal.method.actTotalDeferreds(tdf, function () { // ensure that each deferred has been resolved in the code above!
                    if (options && options.callback) options.callback (); // assume callback is a function
                });
            },

            // Compares selected responses with true answers, returns true if they match exactly
            compareAnswers: function(trueAnswers, selectedAnswers) {
                if (trueAnswers.length != selectedAnswers.length) {
                    return false;
                }

                var trueAnswers     = trueAnswers.sort(),
                    selectedAnswers = selectedAnswers.sort();

                for (var i = 0, l = trueAnswers.length; i < l; i++) {
                    if (trueAnswers[i] !== selectedAnswers[i]) {
                        return false;
                    }
                }

                return true;
            },

            // Calculates knowledge level based on number of correct answers
            calculateLevel: function(correctAnswers) {
                var percent = (correctAnswers / questionCount).toFixed(2),
                    level   = 0;

                if (plugin.method.inRange(0, 0.20, percent)) {
                    level = 5;
                } else if (plugin.method.inRange(0.21, 0.40, percent)) {
                    level = 4;
                } else if (plugin.method.inRange(0.41, 0.60, percent)) {
                    level = 3;
                } else if (plugin.method.inRange(0.61, 0.80, percent)) {
                    level = 2;
                } else if (plugin.method.inRange(0.81, 1.00, percent)) {
                    level = 1;
                }

                return level;
            },

            // Determines if percentage of correct values is within a level range
            inRange: function(start, end, value) {
                if (value >= start && value <= end) {
                    return true;
                }
                return false;
            }
        };

        plugin.init = function() {
            // Setup quiz
            plugin.method.setupQuiz({callback: function() {
                    plugin.config.animationCallbacks.setup ();
            }});

            // Bind "start" button
            $(triggers.starter).on('click', function(e) {
                e.preventDefault();
                plugin.method.startQuiz(this, {callback: function() {
                    plugin.config.animationCallbacks.start ();
                }});
            });

            // Bind "submit answer" button
            $(triggers.checker).on('click', function(e) {
                e.preventDefault();
                plugin.method.checkAnswer(this, {callback: function() {
                    plugin.config.animationCallbacks.checkSubmit ();
                }});
            });

            // Bind "back" button
            $(triggers.back).on('click', function(e) {
                e.preventDefault();
                plugin.method.backToQuestion(this, {callback: function() {
                    plugin.config.animationCallbacks.back ();
                }});
            });

            // Bind "next question" button
            $(triggers.next).on('click', function(e) {
                e.preventDefault();
                plugin.method.nextQuestion(this, {callback: function() {
                    plugin.config.animationCallbacks.next ();
                }});
            });
        };

        plugin.init();
    };

    $.fn.slickQuiz = function(options) {
        return this.each(function() {
            if (undefined === $(this).data('slickQuiz')) {
                var plugin = new $.slickQuiz(this, options);
                $(this).data('slickQuiz', plugin);
            }
        });
    };
})(jQuery);
