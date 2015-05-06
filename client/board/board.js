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
      buckets: Buckets.find({board:this.params._id}, {sort: [['preferredSlot', 'asc']]}).fetch(),
      card: function () {
        return Cards.findOne(Session.get('cardId'))
      }
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
  if (draggedId === dropId) return
  Meteor.call('moveBucket', draggedId, dropId)
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
  'dblclick .card': function (evt, tpl) {

    var card = this

    console.log('dblclick .card', card)

    Session.set('cardId', card._id)
  },
  'click .card': function (evt) {
    evt.stopPropagation()
  },
  'mousedown .card': function (evt) {
    $(evt.currentTarget).webuiPopover('hide')
  },
  'click .slot': function (evt, tpl) {
    if (tpl.data.isTrash) return

    var slot = parseInt(this.preferredSlot, 10)
    var bucket = tpl.data._id
    var board = tpl.data.board

    //console.log('slot:', slot, 'bucket:', bucket, 'board:', board)

    var cardId = Cards.insert({
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

    Session.set('cardId', cardId)
  }
})

Template.card.rendered = function () {
  this.$('.card').webuiPopover({
    title:'Title',
    content:'Content',
    trigger: 'hover',
    animation: 'fade',
    delay: {
      show: 1000,
      hide: 300
    },
  })
}

Template.cardEdit.helpers({
  show: function () {
    var show = !! Session.get('cardId')

    if (show) {
      $('#card-edit-name').focus()
    } else {
      var form = $('.card-edit form')[0]
      form && form.reset()
    }
    return show
  }
})

Template.cardEdit.events({
  'click .btn-close': function () {
    Session.set('cardId', false)
  },
  'click .btn-cancel': function () {
    Session.set('cardId', false)
  },
  'click .btn-trash': function () {
    var card = this;
    trash = Buckets.findOne({'name': 'Trash'})
    if (trash._id === card.bucket) {
      Cards.remove(card._id)
    } else {
      Cards.update(card._id, { $set: { bucket: trash._id }})
    }

    Session.set('cardId', false)
  },
  'submit form, click .btn-save': function (evt, tpl) {
    evt.preventDefault()

    var card = this
    var fields = ['name', 'desc', 'leader', 'due','longdesc']
    var values = fields.map(function(prop) {
      return $('#card-edit-' + prop).val()
    })
    var query = values.reduce(function(res, val, i){
      var field = fields[i]
      if(val === card[field]) return res
      res[field] = val
      return res
    }, {})

    console.log('click .btn-save', query, values)

    Cards.update(card._id, {$set: query })

    Session.set('cardId', false)
  }
})

