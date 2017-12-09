import React, {Component} from 'react';
import io from 'socket.io-client';
import styled from 'styled-components';

export default class Board extends Component {
  constructor(props){
    super(props);
    this.state = {
      socket: props.socket,
      playerNum: this.props.items,
      value: "",
      sound: false,
      board: [
      	['','',''],
      	['','',''],
      	['','','']
      ]
    }
  }

  componentDidMount(){
  	//Обновление игрового поля
  	this.state.socket.on('update board', (data) => {
  		
  		this.setState({
  			board: data
    	})
  	})
  }
  clickTile = (e) => {
  	e.preventDefault();
    this.state.socket.emit('click', {
		tile_id: e.target.id,
		sessionCode: this.props.sessionCode, 
    });
  }
  render() {
    return (
		<Button 
			className="tile" 
			id="button_1"
			onClick={this.clickTile}
		>
		{this.state.board[0][0]}
		</Button>
    )
  }
}

  const Button = styled.button `
	width: 80px;
	height: 80px;
	font-size: 60px;
`;