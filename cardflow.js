'use strict';

angular.module('angular-cardflow', ['ngTouch']).directive('cardflow', ['$swipe', '$compile', '$window', function($swipe, $compile, $window) {
    return {
        'restrict': 'E',
        'template':'<div class="cardflow-container" ng-transclude ng-swipe-left="swipeLeft($event)" ng-swipe-right="swipeRight($event)"></div>',
        transclude: true,
        'scope': { 'model':'=?', 'atype':'=?', 'margin':'=?', 'animTime':'=?', 'current':'=?' },
        'link': function(scope, element, attrs) {
            // model for reaching into this for callbacks and data-binding
            scope.model = scope.model ||  {};
            
            // swipeSnap or swipeSnapOne
            scope.atype = attrs.atype || 'swipeSnapKinetic';

            // margin for cards
            scope.margin = scope.margin  || 10;
            
            //  time that it takes to animate a movemnt in CSS transition 
            scope.animTime = scope.animTime || 0.25;

            // currently selected card, can be set with param
            scope.model.current = scope.current || 0;

            scope.$watch('model.current', init );
            
            // internal vars
            var cardWidth, cardEls, positionLimitLeft, positionLimitRight, bound, container = element.find('div');

            // update position
            function setPosition(position){
                cardEls.css({
                    'transform': 'translate3d('+position+'px,0,0)',
                    '-webkit-transform': 'translate3d('+position+'px,0,0)',
                    '-o-transform': 'translate3d('+position+'px,0,0)',
                    '-moz-transform': 'translate3d('+position+'px,0,0)'
                });
            }

            // update offset snapped to current card
            function update(delta){
                positionLimitLeft = cardEls[1].offsetLeft;
                positionLimitRight = positionLimitLeft + cardWidth * cardEls.length;

                // delta bounds
                if (delta === 0 || (delta === -1 && scope.model.current > 0) || (delta === 1 && scope.model.current < (cardEls.length-1) ) ){
                    // do I really need to re-calculate this every time?
                    cardEls = element.children().children();
                    cardWidth = cardEls[1].offsetHeight + scope.margin;

                    scope.model.current += delta;
                    scope.position = -(scope.model.current*cardWidth);

                    setPosition(scope.position);

                    cardEls.removeClass('cardflow-active');
                    var active = angular.element(cardEls[scope.model.current]);
                    active.addClass('cardflow-active');
                    if (scope.model.onActive){
                        scope.model.onActive(active, scope.position, scope);
                    }
                }
            }

            // initialize cardflow
            function init(){
                cardEls = element.children().children();
                if (cardEls && cardEls.length){
                    cardWidth = cardEls[1].offsetHeight + scope.margin;

                    angular.forEach(cardEls, function(el, i){
                        angular.element(el).css({ left: (i * cardWidth) + 'px' });
                    });

                    update(0);

                    // store transition
                    var transition={};
                    var t = window.getComputedStyle(cardEls[1])['transition'];
                    if (t){
                        transition.transition = t + '';
                    }
                    angular.forEach(['moz','o','webkit'], function(p){
                        t = window.getComputedStyle(cardEls[1])['transition'];
                        if (t){
                            transition[p+'Transition'] = t;
                        }
                    });

                    if (scope.atype == 'swipeSnap' || scope.atype == 'swipeSnapKinetic'){
                        // calculate current card with start/end
                        var transition;
                        var position;
                        var offset;

                        // only bind once
                        if (!bound){
                            bound=true;
                            $swipe.bind(element, {
                                start: function(coords){
                                    // disable transition
                                    angular.forEach(['moz','o','webkit'], function(p){
                                        cardEls.css(p+'Transition', 'none');
                                    });
                                    cardEls.css({'transition':'none'});
                                    offset = coords.x-(container[0].clientWidth/2)-cardWidth;
                                },
                                end: function(coords){
                                    // restore transition
                                    cardEls.css(transition);
                                    var current = Math.floor((position/-cardWidth) + 0.5);
                                    if (current >=0){
                                        if (current > (cardEls.length-1)){
                                            current = cardEls.length-1;
                                        }
                                    }else{
                                        current = 0;
                                    }
                                    // trigger update
                                    scope.model.current=-1;
                                    scope.$apply();
                                    scope.model.current=current;
                                    scope.$apply();

                                    if (scope.atype == 'swipeSnapKinetic'){
                                        // do some velocity stuff here, modify current
                                    }
                                },
                                // move cards on move (for a grab effect)
                                move: function(coords){
                                    position = scope.position+coords.x-positionLimitLeft - offset;
                                    setPosition(position);
                                }
                            });
                        }
                    }
                }else{
                    // HACK: add active when transcluded elements are available
                    // need to find a better way to do this...
                    setTimeout(init, 100);
                }
            }

            // re-init if anim type changes
            scope.$watch('type', init);

            // on window resize, update translate
            angular.element($window).bind('resize',function(){
                update(0);
            });

            // maybe I should  do these in bindings above

            scope.swipeLeft = function(e){
                if (scope.atype == 'swipeSnapOne'){
                    update(1);
                }
                if (scope.atype == 'swipeSnapKinetic'){
                    // figure out velocity, increase scope.model.current here
                    console.log(e)
                }

            }

            scope.swipeRight = function(e){
                if (scope.atype == 'swipeSnapOne'){
                    update(-1);
                }
                if (scope.atype == 'swipeSnapKinetic'){
                    // figure out velocity, decrease scope.model.current here
                    console.log(e)
                }
            }
        }
    };
}]);