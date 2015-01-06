NewBoardController = RouteController.extend({
  onBeforeAction: function () {

    console.log('new board')

    Meteor.call('createBoard', function (err, boardId) {
      if (err) return console.error(err)
      console.log('create board', boardId)
      Router.go('board', {_id: boardId})
    })

    this.next()
  }
})

BoardController = RouteController.extend({
  waitOn: function() {
    return [
      Meteor.subscribe('boardById', this.params._id),
      Meteor.subscribe('bucketsForBoard', this.params._id),
      Meteor.subscribe('cardsForBoard', this.params._id)
    ]
  },

  data: function () {
    return {
      _id: this.params._id,
      board: Boards.findOne(this.params._id),
      buckets: Buckets.find({board:this.params._id}, {sort: [['preferredSlot', 'asc']]}).fetch()
    }
  }
})

Template.board.rendered = function () {
  $.dd('.card', '.slot', cardDrop)
  $.dd('.bucket', '.bucket', bucketDrop)
}

function bucketDrop (draggedEl, dropEl) {
  var draggedId = $(draggedEl).data('bucket')
  var dropId = $(dropEl).data('bucket')
  if (draggedId === dropId) return;
  Meteor.call('swapBuckets', draggedId, dropId)
}

function cardDrop (cardEl, slotEl) {
  var $slotEl = $(slotEl)
  var cardId = $(cardEl).data('card')
  var slot = parseInt($slotEl.attr('data-slot'))
  var toBucketId = $slotEl.parents('.bucket').data('bucket')
  var toBucket = Buckets.findOne(toBucketId)
  var card = Cards.findOne(cardId)

  if (isFull(toBucketId) && card.bucket !== toBucketId) {
    // Bucket is full, drop is denied.

    new jBox('Notice', {
      content: toBucket.name + ' is full',
      autoClose: 1000,
      color:'red'
    })

    return
  }

  Meteor.call('move', cardId, toBucketId, slot)
}

function isFull(bucket) {
  if (typeof bucket === 'string') {
    bucket = Buckets.findOne(bucket)
  }
  if (bucket.isTrash) return false

  var cards = Cards.find({bucket: bucket._id}).count()
  return cards >= bucket.limit
}

// Render slots
Template.bucket.helpers({
  slots: function () {

    var cards = Cards.find({bucket: this._id}, {sort:[['preferredSlot', 'asc']]}).fetch()

    if (this.isTrash) { // force first item in trash to always be empty
      cards.push({preferredSlot: -1})
      return cards
    }

    if (cards.length < this.limit) {
      // editable slot
      cards.push({ preferredSlot: cards.length })
    }

    // zeroth slot is far right...
    return cards.reverse()
  },

  isFull: function () {
    return isFull(this)
  }
})

Template.bucket.events({
  'dblclick .card': function (evt) {
    evt.stopPropagation()
  },
  'dblclick .slot': function (evt, tpl) {
    if (tpl.data.isTrash) return

    var slot = parseInt(this.preferredSlot, 10)
    var bucket = tpl.data._id
    var board = tpl.data.board

    //console.log('slot:', slot, 'bucket:', bucket, 'board:', board)

    Cards.insert({
      name: tpl.data.name.split(' ')[0] +' ' + (slot + 1),
      desc: 'A ' + tpl.data.name,
      bucket: bucket,
      board: board,
      preferredSlot: slot,
      createdBy: Meteor.userId,
      createdOn: Date.now(),
      updatedOn: Date.now(),
      editing: true
    })
  }
})
