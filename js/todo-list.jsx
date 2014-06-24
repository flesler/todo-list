/** @jsx React.DOM */

// TODO: Auto focus text when creating a task

var App = React.createClass({
	render: function() {
		return <div className="main"> 
						<div className="panel panel-default">
							<Header />
							<ToDoList app={this} />
						</div>
					</div>
	}
});

var Header = React.createClass({
	render: function() {
		return <div className="panel-heading">
				  	<h1 className="panel-title">To-do List</h1>
				  	<a className="home" href="https://github.com/flesler/todo-list" target="_blank">
				  		<Button type="home" />
				  	</a>
					</div>
	}
});

var ToDoList = React.createClass({
	getInitialState: function() {
		return {tasks:this.ids(), todo: null};
	},

	componentDidMount: function() {
		hub.on('add', this.onAdd);
		hub.on('start', this.onStart);
		hub.on('stop', this.onStop);
		hub.on('remove', this.flush);
	},

	componentWillUnmount: function() {
		hub.off('add', this.onAdd);
		hub.off('start', this.onStart);
		hub.off('stop', this.onStop);
		hub.off('remove', this.flush);
	},

	ids: function() {
		var ids = Object.keys(localStorage).filter(function(key) {
			return parseInt(key, 10);
		});
		return ids.sort(function(a, b) {
			return b - a;
		});
	},

	onAdd: function() {
		var task = { key:Date.now(), text:'Untitled', done:0 };
		localStorage[task.key] = JSON.stringify(task);
		this.flush();
	},

	flush: function() {
		this.setState({tasks: this.ids()});
	},

	onStart: function(todo) {
		if (this.state.todo) {
			this.state.todo.onStop();
		}
		this.setState({todo:todo});
	},

	onStop: function() {
		this.setState({todo:null});
	},

	render: function() {
		var mode = this.state.todo ? 'active' :
			this.state.tasks.length ? 'idle' : 'empty';
		document.body.className = mode;

		var list = this;
		return <ul className="list-group"> 
						<AddToDo />
						{this.state.tasks.map(function(key) {
							return <ToDo key={key} />
						})}
					</ul>
	}
});

var ToDo = React.createClass({
	getInitialState: function() {
		var json = localStorage[this.props.key];
		return JSON.parse(json);
	},

	componentDidMount: function() {
		if (this.running()) {
			hub.emit('start', this);
		}
	},

	update: function(changes) {
		this.setState(changes, function() {
			localStorage[this.props.key] = JSON.stringify(this.state);
		}.bind(this));
	},

	running: function() {
		return !!this.state.startTime;
	},

	color: function() {
		if (this.running()) return 'warning';
		return this.state.done ? 'success' : 'default';
	},

	onStart: function() {
		hub.emit('start', this);
		this.update({startTime: Date.now()});
	},

	onStop: function() {
		hub.emit('stop', this);

		var elapsed = Date.now() - this.state.startTime;
		this.update({startTime: null, done: this.state.done + elapsed});
	},

	onDelete: function() {
		delete localStorage[this.props.key];
		hub.emit('remove', this);
	},

	onText: function(text) {
		this.update({text: text});
	},

	onAddTime: function() {
		// Add 5 minutes each time the accumulated time is clicked
		this.update({done: this.state.done + 5 * 60 * 1000});
	},

	onClear: function() {
		this.update({done: 0});
	},

	render: function() {
		var text = this.state.text || '';
		return <li className={'list-group-item list-group-item-'+this.color()}>
						<EditableField text={text} onText={this.onText} />
						<ElapsedDisplay time={this.state.done} onClick={this.onAddTime} className="label label-default" />
						{this.running() ? 
							<Button type="ok" handler={this.onStop} /> :
							<Button type="time" handler={this.onStart} />
						}
						{this.running() &&
							<ElapsedCounter startTime={this.state.startTime} />
						}
						<Button type="trash" handler={this.onDelete} />
						{!!this.state.done && 
							<Button type="repeat" handler={this.onClear} />
						}
					 </li>;
	}
});

var EditableField = React.createClass({
	onFocus: function(e) {
		var field = e.target;
		// Select all text on focus
		setTimeout(function() { field.select();	}, 1);
	},

	onChange: function(e) {
		this.props.onText(e.target.value);
	},

	onKeyUp: function(e) {
		// Lose focus on enter or esc
		if (e.which === 13 || e.which === 27) {
			e.target.blur();
		}
	},

	render: function() {
		var text = this.props.text || '';
		var width = text.length * 7;
		return <input value={text} onKeyUp={this.onKeyUp} onFocus={this.onFocus} onChange={this.onChange} style={{width:width}} />;
	}
});

var AddToDo = React.createClass({
	onAdd: function() {
		hub.emit('add');
	},

	render: function() {
		return <li className="add-button list-group-item" onClick={this.onAdd}><Button type="plus-sign" /></li>
	}
});

var Button = React.createClass({
	render: function() {
		return <span className={'glyphicon glyphicon-'+this.props.type} onClick={this.props.handler}></span>
	}
});

var ElapsedDisplay = React.createClass({
	pad: function(n) {
		n = Math.floor(n);
		return n < 10 ? '0'+n : n;
	},

	format: function(time) {
		var sec = Math.floor(time / 1000);
		var hour = Math.floor(sec / 3600);
		sec = sec % 3600;
		var min = Math.floor(sec / 60);
		sec = sec % 60;
		return [hour, min, sec].map(this.pad).join(':');
	},

	render: function() {
		return this.transferPropsTo(<span>{this.format(this.props.time)}</span>);
	}
});

var ElapsedCounter = React.createClass({
	componentDidMount: function() {
		this.timeout = setInterval(this.forceUpdate.bind(this), 1000);
	},

	componentWillUnmount: function() {
		clearTimeout(this.timeout);
	},
	
	render: function() {
		return <ElapsedDisplay className="label label-success" time={Date.now() - this.props.startTime} />
	}
});

React.renderComponent(
  <App />,
  document.body
);

React.initializeTouchEvents(true);