import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import io from 'socket.io-client';
import Sound from 'react-sound';
import Board from './board.jsx';
import Chat from './chat.jsx';

class TicTacToe extends Component {

    constructor(props) {
        super(props);
        this.state = {
            sessionCode: '',
            start: false,
            playerName: '',
            countWins: 0,
            countWinsEnemy: 0,
            countDraw: 0,
            checkNameSubmited: false,
            winner: "",
            createButton: false,
            currentPlayer: "",
            enemyPlayer: "",
            sessionCreate: false
        }
        this.currentTurnPlayer = this.currentTurnPlayer.bind(this)
    }

    componentWillMount() {
        this.socket = io('/');
    }

    //Выполняется при каждом действии
    componentDidMount() {
        //При подключении второго игрока, начинается игра
        //Переводит состояние start в true
        this.socket.on('game start', (data) => {
            this.setState({ 
                start: true,
                enemyPlayer: this.getEnemyPlayer(data.playerOneName, data.playerTwoName)
            });
        });

        this.socket.on('game end', (data) => {
            let winnerName;
            //Условие добавления имени победителя, если имеется ключ draw, то ничья
            let count = 0;
            if (Object.keys(data.player).indexOf("draw") != -1) {
                winnerName = data.player.draw;
                this.setState({ 
                    countDraw: this.state.countDraw + 1 
                });

            } else {
                winnerName = data.player.name;
                if (this.state.playerName != data.player.name) {
                    this.setState({ 
                        countWinsEnemy: this.state.countWinsEnemy + 1 
                    });
                }  else if (this.state.playerName == data.player.name) {
                    this.setState({ 
                        countWins: this.state.countWins + 1 
                    });
                } 
            }
            this.setState({
                winner: winnerName
            });
            count=0;
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
            currentPlayer: this.state.playerName,
            sessionCreate: !this.state.sessionCreate
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

    //Получение имени противника
    getEnemyPlayer = (first, second) => { 
        return first != this.state.playerName ? first : second;
    }

    //Имя игрока который ходит в данный момент
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

        //Рендер поля для ввода имени
        let renderNameInput;
        if (!this.state.checkNameSubmited) {
            renderNameInput =
                <form onSubmit={this.SubmitName}>
                    <label className="username">Введите имя</label>
                    <input type="text" value={this.state.playerName} className="user_input" onChange={this.ChangeName} />
                    <button type="submit" className="user_button">Подтвердить</button>
                </form>
        }

        //Ренден созданной игровой сессии + номер сессии
        let renderGameSession;
        if(this.state.sessionCode !== '' && !this.state.start) {
            renderGameSession =
                <label className="game_session">
                    <p>Номер игровой сессии: </p>
                    <h2>{this.state.sessionCode}</h2>
                    <p>Ожидайте 2 игрока</p>
                </label>
        }

        //Рендер игровой сессии
        let renderCreateGameSession;
        if (!this.state.start && this.state.checkNameSubmited ) {
            renderCreateGameSession =
            <form onSubmit={this.SubmitGame}>
                <button onClick={this.createGameSession} className="create_session">Создать игровую сессию</button>
                {renderGameSession}
                <input type='text' placeholder='Введите код' value={this.state.sessionCode} onChange={this.ChangeJoin} className="input_code"/>
                <button type='submit' className="join_session" onClick={this.joinGameSession}>Подключиться</button>
            </form>
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
                    <h2>Вы: <span>{this.state.playerName}</span> Ваш противник: <span>{this.state.enemyPlayer}</span></h2>
                    {win}
                    <h3>Очередь игрока: <span>{this.state.currentPlayer}</span></h3>
                    <h4>Количество побед:  <span>Вы - {this.state.countWins}</span><span>Ничья - {this.state.countDraw}</span> <span>Противник - {this.state.countWinsEnemy}</span></h4>
                    <Board 
                        socket={this.socket}
                        sessionCode={this.state.sessionCode}
                        currentTurnPlayer={this.currentTurnPlayer} 
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
                { renderGame }
            </div>
        )
    }
} 


ReactDOM.render(<TicTacToe />, document.getElementById('root'));

