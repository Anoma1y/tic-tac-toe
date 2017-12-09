import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import io from 'socket.io-client';
import Board from './board.jsx';
import Chat from './chat.jsx';

class TicTacToe extends Component {

    constructor(props) {
        super(props);
        this.state = {
            sessionCode: '',
            start: false,
            playerName: '',
            checkNameSubmited: false,
            winner: "",
            createButton: false,
            currentPlayer: "",
        }
    }

    componentWillMount() {
        this.socket = io('/');
    }

    //Выполняется при каждом действии
    componentDidMount() {
        //При подключении второго игрока, начинается игра
        //Переводит состояние start в true
        this.socket.on('game start', (data) => {
            this.setState({ start: true });
        });


        this.socket.on('game end', (data) => {
            this.setState({
                winner: data.player.name,
            });
            this.socket.emit('reset board', this.state);
        });
    }

    //Функция рандома (от и до)
    random = (min, max) => Math.round((Math.random() * max - min) + min)
    
    //Метод создания игровой сессии
    createGameSession = () => {
        let sessionCode = this.random(10000, 99999);
        let firstTurnPlayer = true;
        this.setState({
            sessionCode: sessionCode.toString(),
            createButton: !this.state.createButton,
            currentPlayer: this.state.playerName
        });
        this.socket.emit('create session', {
            sessionCode: sessionCode,
            name: this.state.playerName
        });
    }

    //Метод для присоединения к игровой сессии
    joinGameSession = () => {
        if (this.state.sessionCode) {
            this.socket.emit('join session', {
                sessionCode: this.state.sessionCode,
                name: this.state.playerName
            }); 		
        }
    }

    currentTurnPlayer = (player) => {
        this.setState({
            currentPlayer: player
        })
    }

    //Метод отмены действия
    SubmitGame = (e) => {
        e.preventDefault();
    }

    //Метод подтверждения введеного имени и проверка на пустое поле
    SubmitName = (e) => {
        e.preventDefault();
        if (this.state.playerName.length >= 1) {
            this.setState({ 
                checkNameSubmited: true 
            });
        }
    }

    //Метод для ввода номера сессии
    ChangeJoin = (e) => {
        this.setState({ 
            sessionCode: e.target.value 
        });
    }

    //Метод для создания имени и сохранения в state
    ChangeName = (e) => {
        this.setState({ 
            playerName: e.target.value 
        });
    }

    render() {

        //Рендер поля для ввода имени (никнейма)
        let buttonCreate;
        if (!this.state.createButton) {
            buttonCreate =
                <button onClick={this.createGameSession}>Создать новую игровую сессию</button>
        }

        //Рендер поля для ввода имени
        let renderNameInput;
        if (!this.state.checkNameSubmited) {
            renderNameInput =
                <form onSubmit={this.SubmitName}>
                    <h1>Введите имя</h1>
                    <input type="text" placeholder='Введите имя' value={this.state.playerName} onChange={this.ChangeName} />
                    <button type="submit">Подтвердить</button>
                </form>
        }

        //Рендер игровой сессии
        let renderCreateGameSession;
        if (!this.state.start && this.state.checkNameSubmited) {
            renderCreateGameSession =
            <div>
                <form onSubmit={this.SubmitGame}>
                    {buttonCreate}
                    <input type='text' placeholder='Введите код' value={this.state.sessionCode} onChange={this.ChangeJoin}/>
                    <button type='submit' onClick={this.joinGameSession}>Подключиться</button>
                </form>
            </div>
        }

        //Ренден созданной игровой сессии + номер сессии
        let renderGameSession;
        if(this.state.sessionCode !== '' && !this.state.start) {
            renderGameSession =
                <div>
                    <span>Номер игровой сессии: </span><h2>{this.state.sessionCode}</h2>
                    <p>Ожидайте 2 игрока...</p>
                </div>
        }

        //Вывести победителя если игра завершена
        let win;
        if (this.state.winner.length != 0) {
            win = 
                <h1>Побидетель: {this.state.winner}</h1>
        }

        //Рендер игрового поля, доступный после старта игры (когда подключенны оба игрока)
        let renderGame;
        if (this.state.start) {
            renderGame = 
                <div className="gameBoard">
                    <h2>Вы: {this.state.playerName}</h2>
                    {win}
                    <h3>Очередь игрока: <span>{this.state.currentPlayer}</span></h3>
                    <Board 
                        socket={this.socket}
                        sessionCode={this.state.sessionCode} 
                    />
                    <div>
                        <Chat 
                            socket={this.socket}
                            playerName={this.state.playerName}
                            sessionCode={this.state.sessionCode}
                        />
                    </div>     
                </div>
        }

        return (
            <div className="container">
                { renderNameInput }
                { renderCreateGameSession }
                { renderGameSession }
                { renderGame }
            </div>
        )
    }
} 


ReactDOM.render(<TicTacToe />, document.getElementById('root'));

