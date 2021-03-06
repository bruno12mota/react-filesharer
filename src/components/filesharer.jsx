var React = require('react');
var randomstring = require('randomstring');
var Peer = require('peerjs');

module.exports = React.createClass({
	propTypes: {
		optionalObject: React.PropTypes.object
	},

	getInitialState: function(){
		return {
			peer: new Peer({key: this.props.opts.peerjs_key}), //for testing
			/*
			//for production:
			peer = new Peer({
			  host: 'yourwebsite.com', port: 3000, path: '/peerjs',
			  debug: 3,
			  config: {'iceServers': [
			    { url: 'stun:stun1.l.google.com:19302' },
			    { url: 'turn:numb.viagenie.ca', credential: 'muazkh', username: 'webrtc@live.com' }
			  ]}
			})
			*/
			my_id: '',
			peer_id: '',
			initialized: false,
			files: []
		};
	},

	componentWillMount: function() {
		this.state.peer.on('open', (id) => {
			console.log('My peer ID is: ' + id);
			this.setState({
				my_id: id,
				initialized: true
			});
		});

		this.state.peer.on('connection', (connection) => {
			console.log('someone connected');
			console.log(connection);

			this.setState({
				conn: connection
			}, () => {
				this.state.conn.on('open', () => {
					this.setState({
						connected: true
					});
				});

				this.state.conn.on('data', this.onReceiveData);
			});
		});
	},

	componentWillUnmount: function(){
		this.state.peer.destroy();
	},

	connect: function(){
		var peer_id = this.state.peer_id;
		var connection = this.state.peer.connect(peer_id);

		this.setState({
		    conn: connection
		}, () => {
			this.state.conn.on('open', () => {
				this.setState({
					connected: true
				});
			});
			this.state.conn.on('data', this.onReceiveData);
		});
	},

	sendFile: function(event){
    console.log(event.target.files);
    var file = event.target.files[0];
    var blob = new Blob(event.target.files, {type: file.type});

    this.state.conn.send({
        file: blob,
        filename: file.name,
        filetype: file.type
    });
	},

	onReceiveData: function(data){
		console.log('Received', data);

		var reader = new FileReader();
		var blob = new Blob([data.file], {type: data.filetype});

		reader.readAsDataURL(blob);

		reader.onload = this.readerLoadComplete.bind(this, data);
	},

	readerLoadComplete: function (event) {
		var file_url = event.target.result;
		var file_name = data.filename;

		var files = this.state.files;
		var file_id = randomstring.generate(5);

		console.log(file_id);

		files.push({
			id: file_id,
			url: file_url,
			name: file_name
		});

		this.setState({
			files: files
		});
	},

	handleTextChange: function(event){
		this.setState({
		  peer_id: event.target.value
		});
	},

	render: function() {
		var result;

		if(this.state.initialized){
			result = (
				<div>
					<div>
            <span>{this.props.opts.my_id_label || 'Your PeerJS ID:'} </span>
            <strong className="mui--divider-left">{this.state.my_id}</strong>
					</div>
					{this.state.connected ? this.renderConnected() : this.renderNotConnected()}
				</div>
			);
		} else {
			result = <div>Loading...</div>;
		}

		return result;
	},

	renderNotConnected: function () {
		return (
			<div>
				<hr />
				<div className="mui-textfield">
					<input type="text" className="mui-textfield" onChange={this.handleTextChange} />
					<label>{this.props.opts.peer_id_label || 'Peer ID'}</label>
				</div>
				<button className="mui-btn mui-btn--accent" onClick={this.connect}>
					{this.props.opts.connect_label || 'connect'}
				</button>
			</div>
		);
	},

	renderConnected: function () {
		return (
			<div>
				<hr />
				<div>
					<input type="file" name="file" id="file" className="mui--hide" onChange={this.sendFile} />
					<label htmlFor="file" className="mui-btn mui-btn--small mui-btn--primary mui-btn--fab">+</label>
				</div>
				<div>
					<hr />
					{this.state.files.length ? this.renderListFiles() : this.renderNoFiles()}
				</div>
			</div>
		);
	},

	renderListFiles: function () {
		return (
			<div id="file_list">
      	<table className="mui-table mui-table--bordered">
					<thead>
					  <tr>
					    <th>{this.props.opts.file_list_label || 'Files shared to you: '}</th>
					  </tr>
					</thead>
					<tbody>
						{this.state.files.map(this.renderFile, this)}
					</tbody>
				</table>
			</div>
		);
	},

	renderNoFiles: function () {
		return (
			<span id="no_files_message">
				{this.props.opts.no_files_label || 'No files shared to you yet'}
			</span>
		);
	},

	renderFile: function (file) {
		return (
			<tr key={file.id}>
				<td>
					<a href={file.url} download={file.name}>{file.name}</a>
				</td>
			</tr>
		);
	}
});
