// Get an array of objectives
Meteor.publish('objectivesForMap', function (mapId) {
  check(mapId, String)

  return Objectives.find({map: mapId})
})

Meteor.publish('scopesForMap', function (mapId) {
  check(mapId, String)

  return Scopes.find({map: mapId})
})

Meteor.publish('mapById', function (mapId) {
  check(mapId, String)

  return Maps.find({_id: mapId})
})
