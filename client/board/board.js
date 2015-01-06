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

  console.log(cardId, 'to', toBucketId, slot)
  
  if ($slotEl.find('.card').length === 0) {
    // slot is empty
    if (card.bucket !== toBucketId) {
      // moving to a new bucket
      Cards.update(cardId, {$set: {bucket: toBucketId, preferredSlot: slot}})

    } else {
      // move card and close the gap
      Cards.update(cardId, {$set: {preferredSlot: slot}})
      nudgeRight(card, Buckets.findOne(toBucketId))
    }

  } else {

    // we're dropping onto a card, so gonna have to dance.

    var cardInTheWay = Cards.findOne($slotEl.find('.card').data('card'))

    if (cardInTheWay._id === cardId) {
      return // We'll just leave this where we found it.
    }

    if (isFull(toBucketId) && card.bucket !== toBucketId) {
      // Bucket is full, drop is denied.
      console.log('isFull')

      new jBox('Notice', {
        content: toBucket.name + ' is full',
        autoClose: 1000,
        color:'red'
      });

    } else {
      // make room and drop
      nudgeLeft(cardInTheWay, Buckets.findOne(toBucketId))
      Cards.update(cardId, {$set: {bucket: toBucketId, preferredSlot: slot}})
    }
  }
}

function isFull(bucket) {
  if (typeof bucket === 'string') {
    bucket = Buckets.findOne(bucket)
  }
  if (bucket.limit < 1) return true

  var cards = Cards.find({bucket: bucket._id}).count()
  return cards >= bucket.limit
}

function nudgeRight(card, bucket) {
  if (!card) return;
  var nextSlot = card.preferredSlot + 1
  if (nextSlot > bucket.limit) return;
  var nextCard = Cards.findOne({bucket: bucket._id, preferredSlot: nextSlot})
  nudgeRight(nextCard, bucket)
  Cards.update(card._id, { $set: {preferredSlot: nextSlot}})
}

function nudgeLeft(card, bucket) {
  if (!card) return;
  var previousSlot = (card.preferredSlot - 1) % bucket.limit
  if (previousSlot < 0) return;
  var previousCard = Cards.findOne({bucket: bucket._id, preferredSlot: previousSlot})
  nudgeLeft(previousCard, bucket)
  Cards.update(card._id, { $set: {preferredSlot: previousSlot}})
}

function swapCards(card1, card2) {
  if (!card1 || !card2) return;
  Cards.update(card1._id, { $set: {bucket: card2.bucket, preferredSlot: card2.preferredSlot}})
  Cards.update(card2._id, { $set: {bucket: card1.bucket, preferredSlot: card1.preferredSlot}})
}

// Render slots
Template.bucket.helpers({
  slots: function () {

    var cards = Cards.find({bucket: this._id}, {sort:[['preferredSlot', 'asc']]}).fetch()

    if (this.isTrash) { // force first item in trash to always be empty
      cards.push({})
      return cards
    }

    // add in slot property to all cards / slots
    cards = cards.map(function (c, i){ c.slot = i; return c })

    if (cards.length < this.limit) {
      // editable slot
      cards.push({ slot: cards.length })
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

    var slot = parseInt(this.slot, 10)
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
