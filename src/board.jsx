import React, {Component} from 'react';
import io from 'socket.io-client';
import styled from 'styled-components';
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
      sound: false
    }
  }
  componentDidMount(){

  	//Обновление игрового поля
  	this.state.socket.on('update board', (data) => {
  		this.setState({
  			board: data.gameBoard,
  			turns: currentTurns
    	})
  	})
  }

  clickTile = (e) => {
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
						<Button 
							className="tile" 
							id="tile_00"
							onClick={this.clickTile}
						>
			          <Sound
			            url="./static/sound/click.mp3"
			            playStatus={Sound.status.PLAYING}
			            playFromPosition={0}
			            onLoading={this.handleSongLoading}
			            onPlaying={this.handleSongPlaying}
			            onFinishedPlaying={this.handleSongFinishedPlaying} />
						{this.state.board[0][0]}
						</Button>
					</td>
					<td>
						<Button 
							className="tile" 
							id="tile_01"
							onClick={this.clickTile}
						>
						{this.state.board[0][1]}
						</Button>
					</td>
					<td>
						<Button 
							className="tile" 
							id="tile_02"
							onClick={this.clickTile}
						>
						{this.state.board[0][2]}
						</Button>
					</td>
				</tr>
				<tr>
					<td>
						<Button 
							className="tile" 
							id="tile_10"
							onClick={this.clickTile}
						>
						{this.state.board[1][0]}
						</Button>
					</td>
					<td>
						<Button 
							className="tile" 
							id="tile_11"
							onClick={this.clickTile}
						>
						{this.state.board[1][1]}
						</Button>
					</td>
					<td>
						<Button 
							className="tile" 
							id="tile_12"
							onClick={this.clickTile}
						>
						{this.state.board[1][2]}
						</Button>
					</td>
				</tr>
				<tr>
					<td>
						<Button 
							className="tile" 
							id="tile_20"
							onClick={this.clickTile}
						>
						{this.state.board[2][0]}
						</Button>
					</td>
					<td>
						<Button 
							className="tile" 
							id="tile_21"
							onClick={this.clickTile}
						>
						{this.state.board[2][1]}
						</Button>
					</td>
					<td>
						<Button 
							className="tile" 
							id="tile_22"
							onClick={this.clickTile}
						>
						{this.state.board[2][2]}
						</Button>
					</td>
				</tr>
			</tbody>
		</table>
    )
  }
}

  const Button = styled.button `
	width: 80px;
	height: 80px;
	font-size: 60px;
`;