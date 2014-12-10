// Get an array of cards
Meteor.publish('cardsForBoard', function (boardId) {
  check(boardId, String)

  return Cards.find({board: boardId})
})

Meteor.publish('bucketsForBoard', function (boardId) {
  check(boardId, String)

  return Buckets.find({board: boardId})
})

Meteor.publish('boardById', function (boardId) {
  check(boardId, String)

  return Boards.find({_id: boardId})
})
