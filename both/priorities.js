/*

# Priorities: Named priority groups

```js
  {
    name: "Top Priority",
    desc: "Do these things first"
    map: "mapId"
    limit: 5,
    preferredSlot: 0,
    createdBy: userId,
    createdOn: timestamp,
    updatedOn: timestamp,
  }
```

where:
  - `limit` is the max number of objectives that they can contain
  - 'map' is the id of the Map that contains this priority
  - 'sort' is one of ["name", "updatedAt", "manual"]

*/

Priorities = new Mongo.Collection('priorities', {transform: transform})

// N.B. Last priority _must_ be the trash 
var priorityNames = ['Top priority', 'Second priority', 'Third priority', 'Fourth priority', 'Trash']

function transform (priority) {
  priority.name = priorityNames[priority.preferredSlot]
  return priority
}

Priorities.createPriorities = function (mapId) {
  var priorities = priorityNames.map(function (name, index) {
    var p = {
      desc: '',
      map: mapId,
      limit: 5,
      preferredSlot: index,
      createdBy: this.userId,
      createdOn: Date.now()
    }

    // Last priority is the trash - label it so
    if (index == priorityNames.length - 1) {
      // trash is unbounded
      p.limit = 0
      p.isTrash = true
    }

    return p
  })

  var priorityIds = priorities.map(function (priority) {
    return Priorities.insert(priority)
  })
  console.log('insert priorities', priorityIds)

  return priorityIds
}

function yes () {return true} //TODO: limit access to editors
function no () {return false} //TODO: limit access to editors

Priorities.allow({
  insert: no,
  update: yes,
  remove: no
})

Meteor.methods({
  movePriority: function (fromId, toId) {
    var from = Priorities.findOne(fromId)
    var to = Priorities.findOne(toId)

    if (to.isTrash) {
      Objectives.update({priority: fromId}, { $set: { priority: toId }}, { multi:true })
      return
    }

    if (from.isTrash) {
      throw new Meteor.Error(401, 'Moving the trash is not possible')
    }

    // remove priority from source map
    Priorities.update(fromId, {$set: {map: null, preferredSlot: -1}})
    Priorities.update(
      { map: from.map, preferredSlot: { $gt: from.preferredSlot }},
      { $inc: { preferredSlot: -1 }},
      { multi: true }
    )

    // make way
    Priorities.update(
      { map: to.map, preferredSlot: { $gte: to.preferredSlot }},
      { $inc: { preferredSlot: 1 }},
      { multi: true }
    )
    Priorities.update(fromId, {$set: {map: from.map, preferredSlot: to.preferredSlot}})
  },

  move: function (objectiveId, toPriorityId, slot) {
    var objective = Objectives.findOne(objectiveId)

    // remove objective from source priority
    Objectives.update(objectiveId, {$set: {priority: null, preferredSlot: -1}})
    Objectives.update(
      { priority: objective.priority, preferredSlot: { $gt: objective.preferredSlot }},
      { $inc: { preferredSlot: -1 }},
      { multi: true }
    )

    // make way in destination priority
    Objectives.update(
      { priority: toPriorityId, preferredSlot: { $gte: slot }},
      { $inc: { preferredSlot: 1 }},
      { multi: true }
    )
    Objectives.update(objectiveId, {$set: {priority: toPriorityId, preferredSlot: slot}})
  }
})
