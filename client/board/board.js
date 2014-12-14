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
  $('.card').derg()
  $('.slot').derp()
}

Template.bucket.helpers({
  slots: function () {

    var bucket = this._id

    // find cards for slots, or just return the slot number to denote empty
    var res = _.range(this.limit).map(function(slot, i){
      var card = Cards.findOne({bucket: bucket, preferredSlot: i})
      //console.log('found', card, slot, i)
      return card || slot
    })

    return res
  }
})

Template.bucket.events({
  'click .slot-empty': function (evt, tpl) {
    var slot = parseInt(this, 10)
    var bucket = tpl.data._id
    var board = tpl.data.board

    console.log('slot:', slot, 'bucket:', bucket, 'board:', board)

    Cards.insert({
      name: "Name",
      desc: "More info...",
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
