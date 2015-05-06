/*

# Scopes: Named priority groups

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
  - 'map' is the id of the Map that contains this scope
  - 'sort' is one of ["name", "updatedAt", "manual"]

*/

Scopes = new Mongo.Collection('scopes', {transform: transform})

var scopeNames = ['Top priority', 'Second priority', 'Third priority', 'Fourth priority', 'Trash']

function transform (scope) {
  scope.name = scopeNames[scope.preferredSlot]
  return scope
}

Scopes.createScopes = function (mapId) {
  var scopes = scopeNames.map(function (name, index) {
    return {
      desc: '',
      map: mapId,
      limit: 5,
      preferredSlot: index,
      createdBy: this.userId,
      createdOn: Date.now()
    }
  })

  // trash is unbounded
  scopes[4].limit = 0
  scopes[4].isTrash = true

  var scopeIds = scopes.map(function (scope) {
    return Scopes.insert(scope)
  })
  console.log('insert scopes', scopeIds)

  return scopeIds
}

function yes () {return true} //TODO: limit access to editors
function no () {return false} //TODO: limit access to editors

Scopes.allow({
  insert: no,
  update: yes,
  remove: no
})

Meteor.methods({
  moveScope: function (fromId, toId) {
    var from = Scopes.findOne(fromId)
    var to = Scopes.findOne(toId)

    if (to.isTrash) {
      Objectives.update({scope: fromId}, { $set: { scope: toId }}, { multi:true })
      return
    }

    if (from.isTrash) {
      throw new Meteor.Error(401, 'Moving the trash is not possible')
    }

    // remove scope from source map
    Scopes.update(fromId, {$set: {map: null, preferredSlot: -1}})
    Scopes.update(
      { map: from.map, preferredSlot: { $gt: from.preferredSlot }},
      { $inc: { preferredSlot: -1 }},
      { multi: true }
    )

    // make way
    Scopes.update(
      { map: to.map, preferredSlot: { $gte: to.preferredSlot }},
      { $inc: { preferredSlot: 1 }},
      { multi: true }
    )
    Scopes.update(fromId, {$set: {map: from.map, preferredSlot: to.preferredSlot}})
  },

  move: function (objectiveId, toScopeId, slot) {
    var objective = Objectives.findOne(objectiveId)

    // remove objective from source scope
    Objectives.update(objectiveId, {$set: {scope: null, preferredSlot: -1}})
    Objectives.update(
      { scope: objective.scope, preferredSlot: { $gt: objective.preferredSlot }},
      { $inc: { preferredSlot: -1 }},
      { multi: true }
    )

    // make way in destination scope
    Objectives.update(
      { scope: toScopeId, preferredSlot: { $gte: slot }},
      { $inc: { preferredSlot: 1 }},
      { multi: true }
    )
    Objectives.update(objectiveId, {$set: {scope: toScopeId, preferredSlot: slot}})
  }
})
