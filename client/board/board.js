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
      buckets: Buckets.find({board:this.params._id}).fetch()
    }
  },

  onAfterAction: function () {
    console.log('BoardController.onAfterAction')

  }
})

Template.board.rendered = function () {
  console.log('Board.rendered')
  $.derg('.card')
  $.derp('.slot', function (cardEl, slotEl) {
    var $slotEl = $(slotEl)
    var cardId = $(cardEl).data('card')
    var card = Cards.findOne(cardId)
    var slot = parseInt($slotEl.attr('data-slot'))
    var toBucketId = $slotEl.parents('.bucket').data('bucket')

    //console.log(cardId, 'to', toBucketId, slot)

    console.log($slotEl.attr('data-slot'), card.preferredSlot, 'to', slot)

    if ($slotEl.find('.card').length === 0) {
      // slot is empty, so simples
      console.log('empty slot')
      return Cards.update(cardId, { $set: {bucket: toBucketId, preferredSlot: slot} })
    }
    
    // we're dropping onto a card, so gonna have to dance.
    var cardInTheWay = $slotEl.find('.card').data('card')
    
    if (cardInTheWay === cardId) {
      console.log('no bother')
      return // We'll just leave this where we found it.
    }

    if (cardInTheWay && (slot === card.preferredSlot - 1 || slot === card.preferredSlot + 1)) {
      // Swapsies
      console.log('swapsies!')
      swapCards(card, Cards.findOne(cardInTheWay), Buckets.findOne(toBucketId))
    } else if (!isFull(toBucketId)) {
      console.log('nudging right')
      // there's room in this bucket so let's jiggle
      nudgeRight(Cards.findOne(cardInTheWay), Buckets.findOne(toBucketId))
      Cards.update(cardId, { $set:{bucket:toBucketId, preferredSlot:slot}})
      
    } else {
      console.log('is full')
      // no more room in the bucket so let's swap places
      Cards.update(cardInTheWay, { $set: {bucket: card.bucket, preferredSlot:card.preferredSlot}})
      Cards.update(cardId, { $set:{bucket:toBucketId, preferredSlot:slot}})
    }    
  })
}

function isFull(bucketId) {
  var limit = Buckets.findOne(bucketId).limit
  var cards = Cards.find({bucket: bucketId}).count()
  return cards >= limit
}

function nudgeRight(card, bucket) {
  if (!card) return;
  var nextSlot = (card.preferredSlot + 1) % bucket.limit
  var nextCard = Cards.findOne({bucket: bucket._id, preferredSlot: nextSlot})
  nudgeRight(nextCard, bucket)
  Cards.update(card._id, { $set: {preferredSlot: nextSlot}})
}

function nudgeLeft(card, bucket) {
  if (!card) return;
  var previousSlot = (card.preferredSlot - 1) % bucket.limit
  var previousCard = Cards.findOne({bucket: bucket._id, preferredSlot: previousSlot})
  nudgeLeft(previousCard, bucket)
  Cards.update(card._id, { $set: {preferredSlot: previousSlot}})
}

function swapCards(card1, card2, bucket) {
  if (!card1 || !card2) return;
  Cards.update(card1._id, { $set: {preferredSlot: card2.preferredSlot}})
  Cards.update(card2._id, { $set: {preferredSlot: card1.preferredSlot}})
}

Template.bucket.helpers({
  slots: function () {

    var bucket = this._id

    // find cards for slots, or just return the slot number to denote empty
    var res = _.range(this.limit).map(function(slot, i){
      var card = Cards.findOne({bucket: bucket, preferredSlot: i})
      if (card) card.slot = slot

      return card || { slot: slot }
    })

    return res
  }
})

Template.bucket.events({
  'dblclick .card': function (evt) {
    evt.stopPropagation()
  },
  'dblclick .slot': function (evt, tpl) {
    var slot = parseInt(this.slot, 10)
    var bucket = tpl.data._id
    var board = tpl.data.board

    console.log('slot:', slot, 'bucket:', bucket, 'board:', board)


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
