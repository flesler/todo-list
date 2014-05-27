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

	setActive: function(todo) {
		if (todo && this.state.todo) {
			this.state.todo.onStop();
		}
		this.setState({todo:todo});
	},

	render: function() {
		var mode = this.state.todo ? 'active' :
			this.state.tasks.length ? 'idle' : 'empty';
		document.body.className = mode;

		var list = this;
		return <ul className="list-group"> 
						<AddToDo handler={this.onAdd} />
						{this.state.tasks.map(function(key) {
							return <ToDo key={key} list={list} />
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
			this.props.list.setActive(this);
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
		this.props.list.setActive(this);
		this.update({startTime: Date.now()});
	},

	onStop: function() {
		this.props.list.setActive(null);

		var elapsed = Date.now() - this.state.startTime;
		this.update({startTime: null, done: this.state.done + elapsed});
	},

	onDelete: function() {
		delete localStorage[this.props.key];
		this.props.list.flush();
	},

	onText: function(e) {
		this.update({text: e.target.value});
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
						<input value={text} onChange={this.onText} style={{width:text.length * 8 + 6}} />
						<span onClick={this.onAddTime} className="label label-default">
							<ElapsedDisplay time={this.state.done} />
						</span>
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

var AddToDo = React.createClass({
	render: function() {
		return <li className="add-button list-group-item" onClick={this.props.handler}><Button type="plus-sign" /></li>
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
		return <i>{this.format(this.props.time)}</i>;
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
		return <span className="label label-success">
						<ElapsedDisplay time={Date.now() - this.props.startTime} />
					 </span>
	}
});

React.renderComponent(
  <App />,
  document.body
);
