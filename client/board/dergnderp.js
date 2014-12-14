/*
 Lipstick on the HTML drag and drop pig
 Basically this: http://www.html5rocks.com/en/tutorials/dnd/basics/
 As a jQuery plugin.
 */
(function( $ ) {
  console.log('dergnderp', $)
  var dragSrcEl = null

  $.event.props.push('dataTransfer')

  $.fn.derg = function () {
    this
      .attr('draggable', true)
      .on('dragstart', handleDragStart)
      .on('dragend', handleDragEnd)

    return this
  }

  $.fn.derp = function (cb) {
    cb = cb || function (dragged, dropTarget, dataTransfer) { $(dropTarget).append(dragged) }

    this
      .on('dragenter', handleDragEnter)
      .on('dragover',  handleDragOver)
      .on('dragleave', handleDragLeave)
      .on('drop', handleDrop(cb))

    return this
  }

  function handleDragStart(e) {
    dragSrcEl = this;
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
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    return false;
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
      return false;
    }
  }
}( jQuery ))
