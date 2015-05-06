Router.route('/', {name:'home'})
Router.route('/map/:_id', {name: 'map' })
Router.route('/map', {name: 'map.new', controller: 'NewMapController' })

Tracker.autorun(function() {
  var controller = Router.current()
  if (!controller) return
  console.log('Loaded path:', controller.route._path)
})
