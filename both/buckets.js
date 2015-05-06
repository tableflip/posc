/*

# Buckets: Named priority groups

```js
  {
    name: "Top Priority",
    desc: "Do these things first"
    board: "boardId"
    limit: 5,
    preferredSlot: 0,
    createdBy: userId,
    createdOn: timestamp,
    updatedOn: timestamp,
  }
```

where:
  - `limit` is the max number of cards that they can contain
  - 'board' is the id of the Board that contains this bucket
  - 'sort' is one of ["name", "updatedAt", "manual"]

*/

Buckets = new Mongo.Collection('buckets', {transform: transform})

var bucketNames = ['Top priority', 'Second priority', 'Third priority', 'Fourth priority', 'Trash']

function transform (bucket) {
  bucket.name = bucketNames[bucket.preferredSlot]
  return bucket
}

Buckets.createBuckets = function (boardId) {
  var buckets = bucketNames.map(function (name, index) {
    return {
      desc: '',
      board: boardId,
      limit: 5,
      preferredSlot: index,
      createdBy: this.userId,
      createdOn: Date.now()
    }
  })

  // trash is unbounded
  buckets[4].limit = 0
  buckets[4].isTrash = true

  var bucketIds = buckets.map(function (bucket) {
    return Buckets.insert(bucket)
  })
  console.log('insert buckets', bucketIds)

  return bucketIds
}

function yes () {return true} //TODO: limit access to editors
function no () {return false} //TODO: limit access to editors

Buckets.allow({
  insert: no,
  update: yes,
  remove: no
})

Meteor.methods({
  moveBucket: function (fromId, toId) {
    var from = Buckets.findOne(fromId)
    var to = Buckets.findOne(toId)

    if (to.isTrash) {
      Cards.update({bucket: fromId}, { $set: { bucket: toId }}, { multi:true })
      return
    }

    if (from.isTrash) {
      throw new Meteor.Error(401, 'Moving the trash is not possible')
    }

    // remove bucket from source board
    Buckets.update(fromId, {$set: {board: null, preferredSlot: -1}})
    Buckets.update(
      { board: from.board, preferredSlot: { $gt: from.preferredSlot }},
      { $inc: { preferredSlot: -1 }},
      { multi: true }
    )

    // make way
    Buckets.update(
      { board: to.board, preferredSlot: { $gte: to.preferredSlot }},
      { $inc: { preferredSlot: 1 }},
      { multi: true }
    )
    Buckets.update(fromId, {$set: {board: from.board, preferredSlot: to.preferredSlot}})
  },

  move: function (cardId, toBucketId, slot) {
    var card = Cards.findOne(cardId)

    // remove card from source bucket
    Cards.update(cardId, {$set: {bucket: null, preferredSlot: -1}})
    Cards.update(
      { bucket: card.bucket, preferredSlot: { $gt: card.preferredSlot }},
      { $inc: { preferredSlot: -1 }},
      { multi: true }
    )

    // make way in destination bucket
    Cards.update(
      { bucket: toBucketId, preferredSlot: { $gte: slot }},
      { $inc: { preferredSlot: 1 }},
      { multi: true }
    )
    Cards.update(cardId, {$set: {bucket: toBucketId, preferredSlot: slot}})
  }
})
