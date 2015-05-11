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
      Meteor.subscribe('prioritiesForMap', this.params._id),
      Meteor.subscribe('objectivesForMap', this.params._id)
    ]
  },

  data: function () {
    return {
      _id: this.params._id,
      map: Maps.findOne(this.params._id),
      priorities: Priorities.find({map: this.params._id}, {sort: [['preferredSlot', 'asc']]}).fetch(),
      objective: function () {
        return Objectives.findOne(Session.get('objectiveId'))
      }
    }
  }
})

Template.map.rendered = function () {
  $.dd('.objective', '.slot', objectiveDrop)
  $.dd('.priority', '.priority', priorityDrop)
}

Template.mapTitle.events({
  'click .map-title': function (evt) {
    toggleMapTitleField()
    $('.input-map-title').focus()
  },
  'blur .input-map-title': function (evt) {
    toggleMapTitleField()
    var mapId = $('.input-map-title').data('mapid')
    var newTitle = $('.input-map-title').val()
    if (newTitle === '') newTitle = 'Priorities'
    Maps.update({_id: mapId}, {$set: {name: newTitle}})
  },
  'submit form': function (evt) {
    evt.preventDefault()
    $('input', evt.currentTarget).blur()
  }
})

function toggleMapTitleField () {
  $('.map-title').toggle()
  $('.edit-map-title').toggle() 
}

Template.mapTimeframe.events({
  'click .map-timeframe, click .btn-map-timeframe': function (evt) {
    toggleMapTimeframeField()
    $('.input-map-timeframe').focus()
  },
  'blur .input-map-timeframe': function (evt) {
    toggleMapTimeframeField()
    var mapId = $('.input-map-timeframe').data('mapid')
    var newTimeframe = $('.input-map-timeframe').val()
    Maps.update({_id: mapId}, {$set: {timeframe: newTimeframe}})
  },
  'submit form': function (evt) {
    evt.preventDefault()
    $('input', evt.currentTarget).blur()
  }
})

function toggleMapTimeframeField () {
  $('.map-timeframe, .btn-map-timeframe').toggle()
  $('.edit-map-timeframe').toggle()
}

function priorityDrop (draggedEl, dropEl) {
  var draggedId = $(draggedEl).data('priority')
  var dropId = $(dropEl).data('priority')
  if (draggedId === dropId) return
  Meteor.call('movePriority', draggedId, dropId)
}

function objectiveDrop (objectiveEl, slotEl) {
  var $slotEl = $(slotEl)
  var objectiveId = $(objectiveEl).data('objective')
  var slot = parseInt($slotEl.attr('data-slot'))
  var toPriorityId = $slotEl.parents('.priority').data('priority')
  var toPriority = Priorities.findOne(toPriorityId)
  var objective = Objectives.findOne(objectiveId)

  if (isFull(toPriorityId) && objective.priority !== toPriorityId) {
    // Priority is full, drop is denied.

    new jBox('Notice', {
      content: toPriority.name + ' is full',
      autoClose: 1000,
      color:'red'
    })

    return
  }

  Meteor.call('move', objectiveId, toPriorityId, slot)
}

function isFull(priority) {
  if (typeof priority === 'string') {
    priority = Priorities.findOne(priority)
  }
  if (priority.isTrash) return false

  var objectives = Objectives.find({priority: priority._id}).count()
  return objectives >= priority.limit
}

// Render slots
Template.priority.helpers({
  slots: function () {

    var objectives = Objectives.find({priority: this._id}, {sort:[['preferredSlot', 'asc']]}).fetch()

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

Template.priority.events({
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
    var priority = tpl.data._id
    var map = tpl.data.map

    //console.log('slot:', slot, 'priority:', priority, 'map:', map)

    var objectiveId = Objectives.insert({
      name: tpl.data.name.split(' ')[0] +' ' + (slot + 1),
      desc: 'A ' + tpl.data.name,
      priority: priority,
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
    content: function () {
      return self.$('.popover')[0].outerHTML
    },
    trigger: 'hover',
    animation: 'fade',
    delay: {hide: 300},
    cache: false
  })
}

Template.objective.helpers({
  truncate: function (str) {
    console.log(str, str.length)
    if (str.length < 50) return str
    return str.slice(0, 50) + '…'
  }
})

Template.objectiveEdit.helpers({
  show: function () {
    var show = !! Session.get('objectiveId')

    if (show) {
      $('#objective-edit-name').focus()

      $('#objective-edit-longdesc').trumbowyg({
        btns: ['bold', 'italic', '|', 'link']
      })

      $('#objective-edit-longdesc').trumbowyg('html', this.longdesc)
      
    } else {
      var form = $('.objective-edit form')[0]
      form && form.reset()
      $('#objective-edit-longdesc').trumbowyg('destroy')
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
    trash = Priorities.findOne({isTrash: true})
    if (trash._id === objective.priority) {
      Objectives.remove(objective._id)
    } else {
      Objectives.update(objective._id, { $set: { priority: trash._id }})
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

