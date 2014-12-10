BoardController = RouteController.extend({

  onAfterAction: function () {
    console.log('board', this.params._id)

    if (!this.params._id) {

      Meteor.call('createBoard', function (err, boardId) {
        if (err) return console.error(err)
        console.log('create board', boardId)
        //this.redirect('/board', {_id: boardId})
        Router.go('/board', {_id: boardId})
      })

    }
  }
})

Template.board.helpers({
  buckets: function (boardId) {
    return Buckets.find({board: boardId}).fetch()
  }
})

Template.bucket.helpers({
  cards: function () {
    return Cards.find({bucket: bucketId}).fetch()
  }
})
