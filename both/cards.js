/*

# Cards: Named issues

```js
  {
    name: "Dance more",
    desc: "Dance, dance, or else we are lost",
    bucket: "bucketId",
    board: "boardId"
    preferredSlot: 0,
    createdBy: userId,
    createdOn: timestamp,
    updatedOn: timestamp
  }
```

where:
- `bucket` is a reference to the containing bucket
- `preferredSlot` is a positional hint from the user for manual sorting

*/
Cards = new Mongo.Collection('cards')

Cards.findForUser = function (userId) {
  return Cards.find({createdBy: userId})
}
