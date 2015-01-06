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

    function handleDragEnd(e) {
      $('.dragging').removeClass('dragging')
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
        //console.log('dragstart', this)
        dragSrcEl = this
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
