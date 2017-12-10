import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import io from 'socket.io-client';



export default class Chat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      //Хранение массива сообщений
      messages: [],
      socket: this.props.socket,
      sessionCode: this.props.sessionCode,
      playerName: this.props.playerName
    };
  }

  componentDidMount () {
    this.state.socket.on('message', (message) => {
    	this.setState({ 
    		//Добавление сообщений в начало массива при получении сокетов
    		messages: [message, ...this.state.messages]
    	});
    })
  }

  sendMsg = (e) => {
    const text = e.target.value;///
    //Проверка на наличия текста
    //Сообщения отправляются нажатием клавиши Enter
    if (e.keyCode === 13 && text.length >= 1) {
      let message = {
        sessionCode: this.state.sessionCode,
        text: text,
        playerName: this.state.playerName
      };
      this.setState({ 
      	messages: [message, ...this.state.messages]
      });
      this.state.socket.emit('message', message);
      e.target.value = '';
    }
  }
  render () {
  	//Создание элементов для вывода сообщений
    const renderMessage = this.state.messages.map((msg, i) => {
      return <li key={i}><i>{msg.playerName}</i>: {msg.text}</li>
    })
    return (
    	<div className="chat_block">
        	<input type='text' placeholder='Enter для отправки сообщения...' onKeyUp={this.sendMsg} />
        	{renderMessage}
        </div>
    )
  }
}


