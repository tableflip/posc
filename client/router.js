Router.route('/', {name:'home'})
Router.route('/board/:_id', {name: 'board' })
Router.route('/board', {name: 'board.new', controller: 'NewBoardController' })

Tracker.autorun(function() {
  var controller = Router.current()
  if (!controller) return
  console.log('Loaded path:', controller.route._path)
})
