/*
 Lipstick on the HTML drag and drop pig
 Basically this: http://www.html5rocks.com/en/tutorials/dnd/basics/
 As a jQuery plugin.
 */
(function( $ ) {
  var dragSrcEl = null

  $.event.props.push('dataTransfer')

  $.derg = function (selector) {
    $(document)
      .on('dragstart', selector, handleDragStart)
      .on('dragend', selector, handleDragEnd)
    //.attr('draggable', true)

    return this
  }

  $.derp = function (selector, cb) {
    cb = cb || function (dragged, dropTarget, dataTransfer) { $(dropTarget).append(dragged) }

    $(document)
      .on('dragenter', selector, handleDragEnter)
      .on('dragover', selector, handleDragOver)
      .on('dragleave', selector, handleDragLeave)
      .on('drop', selector, handleDrop(cb))

    return this
  }

  function handleDragStart(e) {
    dragSrcEl = this
    $(this).addClass('dragging')
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
  }

  function handleDragEnd(e) {
    $('.dragging').removeClass('dragging')
  }

  function handleDragEnter(e) {
    $(this).addClass('dragover')
  }

  function handleDragOver(e) {
    $(this).addClass('dragover')
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    return false
  }

  function handleDragLeave(e) {
    $(this).removeClass('dragover')
  }

  function handleDrop(cb) {
    return function (e) {
      e.stopPropagation()
      var dropTarget = this
      var dragged = dragSrcEl
      if (dragged != dropTarget) {
        cb(dragged, dropTarget, e.dataTransfer)
      }

      $('.dragover').removeClass('dragover')
      return false
    }
  }
}( jQuery ))
