const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackConfig = require('./webpack.config.js');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = 3000;

var sessionGame = {};
var currentPlayer;
var victory = {};

//Игровое поле с номерами
const numBoard = [[00,01,02],[10,11,12],[20,21,22]];
//Выигрышные комбинации
const WinningCombinations = [7,56,448,73,146,292,273,84];

//Класс игрока
class Player {
	constructor(name, num, char, socketID, turn) {
		this.name = name;
		this.num = num;
		this.char = char;
		this.socketID = socketID;
		this.currentTurn = turn;
		this.currentCombo = 0;
	}

	/**
	* Получение текущей позиции, срабатывает когда игрок нажимает на поле 
	* @param val  текущая нажатай плитка формата tile_{number}
	* @return array содержаший 2 числовых значения (линия и столбец) нажатой плитки [row, col];
	*/
	handlerClickTile(data, checkTurn) {
	    let rows = parseInt(data.tile_id.split('_')[1][0], 10);
	    let cols = parseInt(data.tile_id.split('_')[1][1], 10);
	    let value = parseInt(data.tile_id.split('_')[1]);
	    updateBoard(value, data);
	    let sessionCode = data.sessionCode;
	    if (checkTurn) {
	    	let ShiftArr = [rows, cols];
	    	this.bitwiseShift(ShiftArr, sessionCode);
	    }
	}

	/*
	*@param arr массив, который содержит текущее значение строки и столбца
	*@return вызывает функцию для обновления комбинации
	*/
	bitwiseShift(arr, sessionCode) {
		let rows = arr[0];
		let cols = arr[1];
		let value = 1 << ((rows * 3) + cols);
		this.updateCombination(value, sessionCode);
	}

	/**Обновление комбинации
	*@param val текущее значение
	*@return вызывает функцию для проверки победной комбинации
	*/
	updateCombination(val, sessionCode) {
		this.currentCombo += val;
		this.checkWinner(sessionCode);			
    }

    //Вывод текущей комбинации
	getCurrentCombination() {
		return parseInt(this.currentCombo);
	}

	/**
	* Проверка выигрышной комбинации
	* @param currentPlayer текущий игрок
	* @return вызывает функцию winnerAnnounce() для анонса победителя
	*/
	checkWinner(sessionCode) {
		//Текущая комбинацияя
		// console.log(currentPlayer);
		let currentPlayerPosition = this.getCurrentCombination();
		//Цикл проверки, если совпадает = конец игры + анонс победителя
			WinningCombinations.forEach((winCombination) => {
				if ((winCombination & currentPlayerPosition) === winCombination) {
					//вызов метмода анонса победителя с экземпляра класса Игра
					this.winnerAnnounce(this);	
				} else if ((sessionGame[sessionCode]["moves"] == 9) && ((winCombination & currentPlayerPosition) !== winCombination)) {
					const tieMessage = {draw: "Ничья"};
					this.winnerAnnounce(tieMessage);					
				}
			});			
	}

	/**
	* Объявление победителя
	* @param curr текущий игрок
	* @return создает из переменной curr (текущий игрок) копию объекта victory - победителя
	*/
	winnerAnnounce(curr) {
		if (typeof curr === "object") {
			victory["player"] = curr;
		} else {
			victory["draw"] = curr;
		}
	}	
}

/**
* Проверяет, допустимый ли ход, а также происходит 
* обновление игрого поля и перевод текущего хода из true в false	
*	[button_00,  button_01, button_02], 
*	[button_10,  button_11, button_12],
*	[button_20,  button_21, button_22] 
* @param data   объект текущего игрока переданный через сокет
* @return -1 по умолчанию, если везде true, то перевод хода в false
*/
	function updateBoard(val, data) {
		for (let i = 0; i < numBoard.length; i++) {
			for (let j = 0; j < numBoard[i].length; j++) {
				if (numBoard[i][j] === val) {
					//Установка иконки и переключения хода с услвоиями: пустая клетка и текущий ход - true
					if (sessionGame[data.sessionCode].gameBoard[i][j].length == 0 && currentPlayer.currentTurn === true && data.socketStateId == currentPlayer.socketID) {
						//Установка иконки крестика или нолика
						sessionGame[data.sessionCode].gameBoard[i][j] = currentPlayer.char;
						//Переключение возможности хода
						currentPlayer.currentTurn = false;
						sessionGame[data.sessionCode]["moves"] += 1;
					}
				}
			}
		}
		return -1;
	}

	//Функция отрисовки игрового поля
	function drawBoard () {
		return [['','',''],['','',''],['','','']];
	}

	//Создание нового соединения
	io.on('connection', (socket) => {
		console.log('connected!');
		//Создание игровой сессии
		socket.on('create session', (data) => {
			if (data.sessionCode) {
				delete sessionGame[data.sessionCode];
				delete victory["player"];
				delete victory["draw"];
				delete victory["disconnect"];
				//Создание нового объекта - игровой сессии
				sessionGame[data.sessionCode] = {};
				//Отрисовка нового игрового поля
				sessionGame[data.sessionCode].gameBoard = drawBoard();
				sessionGame[data.sessionCode]["moves"] = 0;
				//Создание объекта игрока 1
				sessionGame[data.sessionCode]["player1"] = new Player(data.name, 1, 'X',  socket.id, true);
				//Для данной сессии текущим игроком (ходит первым) является игрок 1
				currentPlayer = sessionGame[data.sessionCode]["player1"];
				socket.join(data.sessionCode);
				io.in(data.sessionCode).emit('session created', true);  		
			}
		});
		//Подключение к игровой сессии
		socket.on('join session', (data) => {
			//В сессии могут быть лишь 2 человека
			if (Object.keys(sessionGame).indexOf(data.sessionCode) != -1) {
				if (socket.id !== sessionGame[data.sessionCode]['player1']["socketID"]) {
					if (!sessionGame[data.sessionCode].hasOwnProperty("player2")) {
						currentPlayer = sessionGame[data.sessionCode]["player1"];
						sessionGame[data.sessionCode]["player2"] = new Player(data.name, 2, 'O',  socket.id, false);
						socket.join(data.sessionCode);
						io.in(data.sessionCode).emit('game start', {
							playerOneName: sessionGame[data.sessionCode]["player1"].name,
							playerTwoName: sessionGame[data.sessionCode]["player2"].name
						});			
					} else {
						console.log("Сессия занята");
					}				
				} else {
					console.log('Ожидайте 2 игрока');
				}
			} else {
				console.log('Сессия не найдена');
			}


		});
		socket.on('reset board', (data) => {
			//need fix
			if (Object.keys(sessionGame).indexOf(data.sessionCode) != -1) {
				sessionGame[data.sessionCode].gameBoard = drawBoard();
				let playerOne = sessionGame[data.sessionCode]["player1"];
				let playerTwo = sessionGame[data.sessionCode]["player2"];
				playerOne["currentCombo"] = 0;
				playerOne["currentTurn"] = true;
				playerTwo["currentCombo"] = 0;
				sessionGame[data.sessionCode]["moves"] = 0;
				socket.join(data);
				delete victory["player"];
				delete victory["draw"];
				delete victory["disconnect"];
				io.in(data.sessionCode).emit('update board', {
					gameBoard: sessionGame[data.sessionCode].gameBoard,
					playerInfo: {
						playerOne: playerOne,
						playerTwo: playerTwo
					}
				});			
			}
		})
		socket.on('click', (data) => {
			let playerOne = sessionGame[data.sessionCode]["player1"];
			let playerTwo = sessionGame[data.sessionCode]["player2"];

			//Переключение текущего игрока
			if (data.socketStateId == playerOne.socketID) {
				currentPlayer = playerOne;
			} else if (data.socketStateId == playerTwo.socketID) {
				currentPlayer = playerTwo;
			}
			let checkTurn = currentPlayer.currentTurn;
			//Выполнения ряда функций (обновление поля, чек победы и т.п.)
			currentPlayer.handlerClickTile(data, checkTurn);

			//Если в переменной объявился объеккт => игра закончена
			if (typeof victory == "object" && Object.keys(victory).length >= 1) {
				playerTwo.currentTurn = false;
				playerTwo.currentTurn = false;
				io.to(data.sessionCode).emit('game end', victory);
			} else {
				//Переключение хода
				if (currentPlayer.socketID == socket.id && socket.id == playerOne.socketID) {
					playerTwo.currentTurn = true;

				} else if (currentPlayer.socketID == socket.id && socket.id == playerTwo.socketID) {
					playerOne.currentTurn = true;
				}			
			}
			socket.join(data);
			io.in(data.sessionCode).emit('update board', {
				gameBoard: sessionGame[data.sessionCode].gameBoard,
				playerInfo: {
					playerOne: playerOne,
					playerTwo: playerTwo
				}
			});

		});
		socket.on('disconnect', () => {
			console.log('disconnected!');
			if (Object.keys(sessionGame).length != 0) {
				Object.keys(sessionGame).forEach((code) => {
					if (sessionGame[code.toString()]["player1"]["socketID"] === socket.id || sessionGame[code.toString()]["player2"]["socketID"] === socket.id) {
						const disconnectMessage = {disconnect: "Противник отключился"};
						victory["disconnect"] = disconnectMessage;
						io.in(code).emit('game end', victory["disconnect"]);
						// delete sessionGame[code];
					}
				});
			}

		});
		//Получение сообщения и отправка его только второму игроку
		socket.on('message', (data) => {
			socket.broadcast.to(data.sessionCode).emit('message', {
				playerName: data.playerName,
				text: data.text
			})
		});
	})

	app.use(express.static(__dirname + '/dist'));
	app.use(webpackDevMiddleware(webpack(webpackConfig)));
	server.listen(3000);
	console.log(`Server listening on port  ${PORT}`);