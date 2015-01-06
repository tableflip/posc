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

Buckets = new Mongo.Collection('buckets')

Buckets.createBuckets = function (boardId) {
  var names = ['Top priority', 'Second priority', 'Third priority', 'Fourth priority', 'Trash']

  var buckets = names.map(function (name, index) {
    return {
      name: name,
      desc: "",
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
  swapBuckets: function (fromId, toId) {
    var from = Buckets.findOne(fromId)
    var to = Buckets.findOne(toId)

    if (to.isTrash) {
      Cards.update({bucket: fromId}, { $set: { bucket: toId }}, { multi:true })
      return
    }

    if (from.isTrash) {
      return // send a 401, and show visual cue that it's not possible
    }

    Buckets.update(fromId, { $set: { name: to.name, preferredSlot: to.preferredSlot } })
    Buckets.update(toId, { $set: { name: from.name, preferredSlot: from.preferredSlot } })
  }
})
