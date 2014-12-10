/*

# Boards: A priority ordered list of Buckets

Boards are responsible for access control.
Buckets point to the Boards that they belong to.
Cards point to the Bucket they are in.

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

Boards = new Meteor.Collection('boards')

Boards.createBoard = function () {
  var board = {
    name: "Priorities",
    desc: "",
    editors: [this.userId],
    createdBy: this.userId,
    createdOn: Date.now()
  }

  var id = Boards.insert(board)
  console.log('insert board', id)

  Buckets.createBuckets(id)

  return id
}

if (Meteor.isServer) {
  Meteor.methods({
    'createBoard': Boards.createBoard
  })
}
