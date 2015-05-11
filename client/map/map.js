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

  onRun: function () {
    if (this.params.query.edit) {
      window.location.hash = '/edit/' + this.params.query.edit
    }

    setSessionObjectiveIdFromHash()
    $(window).on('hashchange', setSessionObjectiveIdFromHash)
    this.next()
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
  },

  onAfterAction: function () {
    setHashFromSessionObjectiveId()
  }
})

function setSessionObjectiveIdFromHash () {
  var hash = window.location.hash

  if (hash) {
    var params = hash.split('/').slice(1)

    if (params[0] === 'edit' && Session.get('objectiveId') != params[1]) {
      Session.set('objectiveId', params[1])
    }
  }
}

function setHashFromSessionObjectiveId () {
  var objectiveId = Session.get('objectiveId')
  var hash = window.location.hash
  var newHash = '/edit/' + objectiveId

  if (objectiveId) {
    if (hash.slice(1) != newHash) {
      window.location.hash = newHash
    }
  } else if (hash) {
    window.location.hash = ''
  }
}

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
    evt.preventDefault()
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
  sequenceNumber: function (priority) {
    var priorities = Priorities.find({map: priority.map}, {sort: [['preferredSlot', 'asc']]})

    var order = 0
    var sequence = 0

    priorities.forEach(function (p) {
      if (Objectives.find({priority: p._id}).count()) {
        order++

        if (p._id == priority._id) {
          sequence = order
        }
      }
    })

    return sequence
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
      return self.$('.popover').clone()
    },
    trigger: 'hover',
    animation: 'fade',
    delay: {hide: 300},
    cache: false
  // Bug in lib means that shown.webui.popover doesn't work :(
  // Listen for show instead and add checkbox events after timeout
  }).on('show.webui.popover', function () {
    setTimeout(function () {
      $('.webui-popover.in input[type=checkbox]').click(onPopoverCheckboxChange)
    })
  })
}

function onPopoverCheckboxChange () {
  var checkbox = $(this)
  var objectiveId = checkbox.closest('.popover').data('objective')
  var objective = Objectives.findOne(objectiveId)
  var checklist = objective.checklist.map(function (item) {
    if (item.name == checkbox.val()) {
      item.checked = checkbox.is(':checked')
    }
    return item
  })
  Objectives.update(objectiveId, {$set: {checklist: checklist}})
}

Template.objective.helpers({
  truncate: function (str) {
    if (str.length < 50) return str
    return str.slice(0, 50) + '…'
  }
})

Template.objectiveEdit.helpers({
  show: function () {
    var show = !! Session.get('objectiveId')

    if (show) {
      // If not already showing, we need to init
      if (!$('.objective-edit.show').size()) {
        $('#objective-edit-name').focus()

        $('#objective-edit-longdesc').trumbowyg({
          btns: ['bold', 'italic', '|', 'link']
        })
      }

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
  'click .btn-checklist-add': function (evt) {
    Objectives.update(this._id, {$push: {checklist: {name: '', checked: false}}})
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

    var checklistBoxes = $('#objective-edit-checklist input[type=checkbox]')
    var checklistNames = $('#objective-edit-checklist input[type=text]')

    var checklist = checklistBoxes.toArray().reduce(function (list, checkbox, i) {
      var name = $(checklistNames[i]).val()
      if (name) list.push({name: name, checked: $(checkbox).is(':checked')})
      return list
    }, [])

    query.checklist = checklist

    console.log('click .btn-save', query, values)

    Objectives.update(objective._id, {$set: query })

    Session.set('objectiveId', false)
  }
})

