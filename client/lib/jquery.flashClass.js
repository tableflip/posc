/**
 * Add and remove a class. Leave the animating to the css.
 *
 * (╯°□°）╯︵ TABLEFLIP
 */
(function( $ ) {

  $.fn.flashClass = function (className, time) {
    className = className || 'flash'
    time = jQuery.fx ? jQuery.fx.speeds[time] || time : time;

    this.addClass(className)
    setTimeout(this.removeClass.bind(this, className), time)
  }

}( jQuery ))
