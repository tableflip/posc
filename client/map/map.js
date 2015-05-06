NewMapController = RouteController.extend({
  onBeforeAction: function () {

    console.log('new map')

    Meteor.call('createMap', function (err, mapId) {
      if (err) return console.error(err)
      console.log('create map', mapId)
      Router.go('map', {_id: mapId})
    })

    this.next()
  }
})

MapController = RouteController.extend({
  waitOn: function() {
    return [
      Meteor.subscribe('mapById', this.params._id),
      Meteor.subscribe('scopesForMap', this.params._id),
      Meteor.subscribe('objectivesForMap', this.params._id)
    ]
  },

  data: function () {
    return {
      _id: this.params._id,
      map: Maps.findOne(this.params._id),
      scopes: Scopes.find({map: this.params._id}, {sort: [['preferredSlot', 'asc']]}).fetch(),
      objective: function () {
        return Objectives.findOne(Session.get('objectiveId'))
      }
    }
  }
})

Template.map.rendered = function () {
  $.dd('.objective', '.slot', objectiveDrop)
  $.dd('.scope', '.scope', scopeDrop)
}

Template.mapTitle.events({
  'click .map-title': function (evt) {
    toggleEditField()
    $('.input-map-title').focus()
  },
  'blur': function (evt) {
    toggleEditField()
    var mapId = $('.input-map-title').data('mapid')
    var newTitle = $('.input-map-title').val()
    if (newTitle == '') newTitle = 'Priorities'
    updateMapTitle(mapId, newTitle)
  }
})

function toggleEditField () {
  $('.map-title').toggle()
  $('.edit-map-title').toggle() 
}

function updateMapTitle (id, title) {
  console.log('save', id, title)
  Maps.update({_id: id}, {name: title})
}

function scopeDrop (draggedEl, dropEl) {
  var draggedId = $(draggedEl).data('scope')
  var dropId = $(dropEl).data('scope')
  if (draggedId === dropId) return
  Meteor.call('moveScope', draggedId, dropId)
}

function objectiveDrop (objectiveEl, slotEl) {
  var $slotEl = $(slotEl)
  var objectiveId = $(objectiveEl).data('objective')
  var slot = parseInt($slotEl.attr('data-slot'))
  var toScopeId = $slotEl.parents('.scope').data('scope')
  var toScope = Scopes.findOne(toScopeId)
  var objective = Objectives.findOne(objectiveId)

  if (isFull(toScopeId) && objective.scope !== toScopeId) {
    // Scope is full, drop is denied.

    new jBox('Notice', {
      content: toScope.name + ' is full',
      autoClose: 1000,
      color:'red'
    })

    return
  }

  Meteor.call('move', objectiveId, toScopeId, slot)
}

function isFull(scope) {
  if (typeof scope === 'string') {
    scope = Scopes.findOne(scope)
  }
  if (scope.isTrash) return false

  var objectives = Objectives.find({scope: scope._id}).count()
  return objectives >= scope.limit
}

// Render slots
Template.scope.helpers({
  slots: function () {

    var objectives = Objectives.find({scope: this._id}, {sort:[['preferredSlot', 'asc']]}).fetch()

    if (this.isTrash) { // force first item in trash to always be empty
      objectives.push({preferredSlot: -1})
      return objectives
    }

    if (objectives.length < this.limit) {
      // editable slot
      objectives.push({ preferredSlot: objectives.length })
    }

    // zeroth slot is far right...
    return objectives.reverse()
  },

  isFull: function () {
    return isFull(this)
  }
})

Template.scope.events({
  'dblclick .objective': function (evt, tpl) {

    var objective = this

    console.log('dblclick .objective', objective)

    Session.set('objectiveId', objective._id)
  },
  'click .objective': function (evt) {
    evt.stopPropagation()
  },
  'mousedown .objective': function (evt) {
    $(evt.currentTarget).webuiPopover('hide')
  },
  'click .slot': function (evt, tpl) {
    if (tpl.data.isTrash) return

    var slot = parseInt(this.preferredSlot, 10)
    var scope = tpl.data._id
    var map = tpl.data.map

    //console.log('slot:', slot, 'scope:', scope, 'map:', map)

    var objectiveId = Objectives.insert({
      name: tpl.data.name.split(' ')[0] +' ' + (slot + 1),
      desc: 'A ' + tpl.data.name,
      scope: scope,
      map: map,
      preferredSlot: slot,
      createdBy: Meteor.userId,
      createdOn: Date.now(),
      updatedOn: Date.now(),
      editing: true
    })

    Session.set('objectiveId', objectiveId)
  }
})

Template.objective.rendered = function () {

  var self = this

  this.$('.objective').webuiPopover({
    title: this.data.name,
    content: function () {
      console.log('this', this)
      return self.$('.popover')[0].outerHTML
    },
    trigger: 'hover',
    animation: 'fade',
    delay: {
      show: 1000,
      hide: 300
    },
    cache: false
  })
}

Template.objectiveEdit.helpers({
  show: function () {
    var show = !! Session.get('objectiveId')

    if (show) {
      $('#objective-edit-name').focus()
    } else {
      var form = $('.objective-edit form')[0]
      form && form.reset()
    }
    return show
  }
})

Template.objectiveEdit.events({
  'click .btn-close': function () {
    Session.set('objectiveId', false)
  },
  'click .btn-cancel': function () {
    Session.set('objectiveId', false)
  },
  'click .btn-trash': function () {
    var objective = this;
    trash = Scopes.findOne({'name': 'Trash'})
    if (trash._id === objective.scope) {
      Objectives.remove(objective._id)
    } else {
      Objectives.update(objective._id, { $set: { scope: trash._id }})
    }

    Session.set('objectiveId', false)
  },
  'submit form, click .btn-save': function (evt, tpl) {
    evt.preventDefault()

    var objective = this
    var fields = ['name', 'desc', 'leader', 'due','longdesc']
    var values = fields.map(function(prop) {
      return $('#objective-edit-' + prop).val()
    })
    var query = values.reduce(function(res, val, i){
      var field = fields[i]
      if(val === objective[field]) return res
      res[field] = val
      return res
    }, {})

    console.log('click .btn-save', query, values)

    Objectives.update(objective._id, {$set: query })

    Session.set('objectiveId', false)
  }
})

