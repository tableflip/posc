Meteor.startup(function () {
  Meteor.setTimeout(function () {
    if(Boards.find.count) return
    createTestBoard()
  },1000)
})

function createTestBoard () {
  var boardId = Boards.createBoard('Test', 'the test board')
  Buckets.createBuckets(boardId)
}

