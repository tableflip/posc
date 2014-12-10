// Get an array of cards
Meteor.publish('cardsById', function (cards) {
  check(cards, [String])
  
})
