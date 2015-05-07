// Get an array of objectives
Meteor.publish('objectivesForMap', function (mapId) {
  check(mapId, String)

  return Objectives.find({map: mapId})
})

Meteor.publish('prioritiesForMap', function (mapId) {
  check(mapId, String)

  return Priorities.find({map: mapId})
})

Meteor.publish('mapById', function (mapId) {
  check(mapId, String)

  return Maps.find({_id: mapId})
})
