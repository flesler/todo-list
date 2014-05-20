/** @jsx React.DOM */

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
		var ids = [];
		for (var key in localStorage) {
			if (key.indexOf('task') === 0) {
				ids.push({key:key});
			}
		}
		return ids;
	},

	onAdd: function() {
		var task = { key:'task'+Date.now(), text:'', done:0 };
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
			this.ids().length ? 'idle' : 'empty';
		document.body.className = mode;

		var list = this;
		return <ul className="list-group"> 
						{this.state.tasks.map(function(t) {
							return <ToDo key={t.key} list={list} />
						})}
						<AddToDo handler={this.onAdd} />
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

	render: function() {
		if (this.running()) {
			clearTimeout(this.timeout);
			this.timeout = setTimeout(this.forceUpdate.bind(this), 1000);
		}

		var text = this.state.text || 'Untitled';
		return <li className={'list-group-item list-group-item-'+this.color()}>
						<input value={text} onChange={this.onText} style={{width:text.length * 8 + 6}} />
						<span className="label label-default">{this.format(this.state.done)}</span>
						{this.running() ? 
							<Button type="ok" handler={this.onStop} /> :
							<Button type="time" handler={this.onStart} />
						}
						{this.running() ?
							<span className="label label-success">{this.format(Date.now() - this.state.startTime)}</span> :
							<span />
						}
						<Button type="trash" handler={this.onDelete} />
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


React.renderComponent(
  <App />,
  document.body
);
