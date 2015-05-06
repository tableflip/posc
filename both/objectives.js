/*

# Objectives: Named issues

```js
  {
    name: "Dance more",
    desc: "Dance, dance, or else we are lost",
    scope: "scopeId",
    map: "mapId"
    preferredSlot: 0,
    createdBy: userId,
    createdOn: timestamp,
    updatedOn: timestamp
  }
```

where:
- `scope` is a reference to the containing scope
- `preferredSlot` is a positional hint from the user for manual sorting

*/
Objectives = new Mongo.Collection('objectives')

Objectives.findForUser = function (userId) {
  return Objectives.find({createdBy: userId})
}

function yes () {return true} //TODO: limit access to editors

Objectives.allow({
  insert: yes,
  update: yes,
  remove: yes
})
