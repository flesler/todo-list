var hub = {
	_: {},

	_handlers: function(event) {
		return this._[event] || (this._[event] = []); 
	},

	on: function(event, handler) {
		event.split(' ').forEach(function(event) {
			this._handlers(event).push(handler);
		}, this);
	},

	off: function(event, handler) {
		event.split(' ').forEach(function(event) {
			var handlers = this._handlers(event);
			var i = handlers.indexOf(handler);
			if (i !== -1) {
				handlers.splice(i, 1);
			}
		}, this);
	},

	emit: function(event) {
		var args = [].slice.call(arguments, 1);
		event.split(' ').forEach(function(event) {
			this._handlers(event).forEach(function(handler) {
				handler.apply(null, args);
			});
		}, this);
	}
};