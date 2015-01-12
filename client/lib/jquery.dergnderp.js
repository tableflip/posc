/*
 Lipstick on the HTML drag and drop pig
 Basically this: http://www.html5rocks.com/en/tutorials/dnd/basics/
 As a jQuery plugin.
 */
(function( $ ) {

  $.event.props.push('dataTransfer')

  $.dd = function (dragSelector, dropSelector, cb) {

    cb = cb || function (dragged, dropTarget, dataTransfer) { $(dropTarget).append(dragged) }

    var dragSrcEl = null

    function addAutoScroll () {
      console.log('addAutoScroll')
      var $body = $('body')
      $body.append([
        $('<div data-dd-autoscroll="-1" style="top:0;"></div>'),
        $('<div data-dd-autoscroll="1" style="bottom:0;"></div>')
      ])

      $('[data-dd-autoscroll]').css({
        position:'fixed',
        left: 0,
        right: 0,
        height: 30,
        zIndex: 999999
      })
      .on('dragover', function () {
        var $body = $('html,body')
        if ($body.is(':animated')) return true;
        var dir = parseInt($(this).data('dd-autoscroll'), 10)
        var chunk = 40
        var scrollTo = window.scrollY + (dir * chunk)
        console.log('scrollTo', scrollTo, dir)
        $body.animate({scrollTop: scrollTo}, 80, 'linear')
      })
    }

    function handleDragEnd(e) {
      $('.dragging').removeClass('dragging')
      $('[data-dd-autoscroll]').remove()
    }

    function handleDragEnter(e) {
      var dragEl = e.dataTransfer.getData('text/html')
      //console.log('dragEnter', $(dragEl).is(dragSelector), e)
      if($(dragEl).is(dragSelector)) {
        $(this).addClass('dragover')
      }
    }

    function handleDragOver(e) {
      e.preventDefault()
      //e.stopPropagation()
      var $dragEl = $(e.dataTransfer.getData('text/html'))
      if($dragEl.is(dragSelector)) {
        $(this).addClass('dragover')

        e.dataTransfer.dropEffect = 'move'

      }
      return false
    }

    function handleDragLeave(e) {
      $(this).removeClass('dragover')
    }

    $(document)
      .on('dragstart', dragSelector, function handleDragStart(e) {
        e.stopPropagation()
        dragSrcEl = this
        addAutoScroll()
        $(this).addClass('dragging')
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.outerHTML);
      })
      .on('dragend', dragSelector, handleDragEnd)

    $(document)
      .on('dragenter', dropSelector, handleDragEnter)
      .on('dragover', dropSelector, handleDragOver)
      .on('dragleave', dropSelector, handleDragLeave)
      .on('drop', dropSelector, function (e) {
        e.stopPropagation()
        var dropTarget = this
        var dragged = dragSrcEl
        dragSrcEl = null
        if (dragged != dropTarget) {
          cb(dragged, dropTarget, e.dataTransfer)
        }

        $('.dragover').removeClass('dragover')
        return false
      })

    return this
  }

}( jQuery ))
