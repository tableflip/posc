/*

# Maps: A priority ordered list of Scopes

Maps are responsible for access control.
Scopes point to the Maps that they belong to.
Objectives point to the Scope they are in.

```js
  {
    name: "Transition to coperative",
    desc: "",
    editors: ["userId"],
    createdBy: userId,
    createdOn: timestamp,
    updatedOn: timestamp,
    changelog: [{
      msg: "Bob renamed #1 to **Improve the docs**"
    }],
  }
```

where:
- `editors` are the users who can make changes
- `changelog` is feature creep so ignore for now

*/

Maps = new Meteor.Collection('maps')

Maps.createMap = function () {
  var map = {
    name: 'Priorities',
    desc: '',
    editors: [this.userId],
    createdBy: this.userId,
    createdOn: Date.now()
  }

  var id = Maps.insert(map)
  console.log('insert map', id)

  Scopes.createScopes(id)

  return id
}

Maps.updateTitle = function (id, title) {
  Maps.update(id, {'name': title})
  return title
}

if (Meteor.isServer) {
  Meteor.methods({
    createMap: Maps.createMap
  })
}
