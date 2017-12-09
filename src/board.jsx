import React, {Component} from 'react';
import io from 'socket.io-client';
import Sound from 'react-sound';

let currentTurns = true;
export default class Board extends Component {
	constructor(props){
		super(props);
		this.state = {
			socket: props.socket,
			turns: currentTurns,
			sessionCode: this.props.sessionCode,
			board: [
				['','',''],
				['','',''],
				['','','']
			],
			sfx: false
		}
	}

	componentDidMount(){

		//Обновление игрового поля
		this.state.socket.on('update board', (data) => {
			this.setState({
				board: data.gameBoard,
				turns: currentTurns
			});
			if (data.playerInfo["playerOne"]["currentTurn"] === false) {
				this.props.currentTurnPlayer(data.playerInfo["playerTwo"]["name"]);
			} else if (data.playerInfo["playerTwo"]["currentTurn"] === false) {
				this.props.currentTurnPlayer(data.playerInfo["playerOne"]["name"])
			}
		})
	}

	clickTile = (e) => {
		this.state.sfx = 
		<Sound
			url="./static/sfx/click.mp3"
			playStatus={Sound.status.PLAYING}
		/>
		e.preventDefault();
			if (this.state.turns) {
				this.state.socket.emit('click', {
					tile_id: e.target.id,
					turns: this.state.turns,
					socketStateId:  this.state.socket.id,
					sessionCode: this.state.sessionCode, 
			}); 
		}
	}

	render() {
		return (
			<table className="center">
				<tbody>
					<tr>
						<td>
							<button 
								className="tile" 
								id="tile_00"
								onClick={this.clickTile}
							>
							{this.state.board[0][0]}
							{this.state.sfx}
							</button>
						</td>
						<td>
							<button 
								className="tile" 
								id="tile_01"
								onClick={this.clickTile}
							>
							{this.state.board[0][1]}
							</button>
						</td>
						<td>
							<button 
								className="tile" 
								id="tile_02"
								onClick={this.clickTile}
							>
							{this.state.board[0][2]}
							</button>
						</td>
					</tr>
					<tr>
						<td>
							<button 
								className="tile" 
								id="tile_10"
								onClick={this.clickTile}
							>
							{this.state.board[1][0]}
							</button>
						</td>
						<td>
							<button 
								className="tile" 
								id="tile_11"
								onClick={this.clickTile}
							>
							{this.state.board[1][1]}
							</button>
						</td>
						<td>
							<button 
								className="tile" 
								id="tile_12"
								onClick={this.clickTile}
							>
							{this.state.board[1][2]}
							</button>
						</td>
					</tr>
					<tr>
						<td>
							<button 
								className="tile" 
								id="tile_20"
								onClick={this.clickTile}
							>
							{this.state.board[2][0]}
							</button>
						</td>
						<td>
							<button 
								className="tile" 
								id="tile_21"
								onClick={this.clickTile}
							>
							{this.state.board[2][1]}
							</button>
						</td>
						<td>
							<button 
								className="tile" 
								id="tile_22"
								onClick={this.clickTile}
							>
							{this.state.board[2][2]}
							</button>
						</td>
					</tr>
				</tbody>
			</table>
		)
	}
}

