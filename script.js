"use strict";

const turnText = document.querySelector(".turn-for");
const turnX = document.querySelector(".turn--X");
const turnO = document.querySelector(".turn--O");

const buttonBot = document.querySelector(".bot");
const buttonfriend = document.querySelector(".friend");
const buttonReset = document.querySelector(".reset");

const huPlayer = "O";
const aiPlayer = "X";
const cells = document.querySelectorAll(".cell");
const endGame = document.querySelector(".end-game");

const winCombos = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

class App {
  originBoard;
  bindTurnClick = this.turnClick.bind(this);
  currPlayer = "bot";
  currTurn = "O";
  flag = true;
  isBotThinking = false; // New flag to prevent double clicking

  constructor() {
    this.resetGame();
  }

  resetGame() {
    this.initialize();
    buttonBot.addEventListener(
      "click",
      this.addButtonClasses.bind(
        this,
        buttonBot,
        buttonfriend,
        "friend",
        "bot",
      ),
    );
    buttonfriend.addEventListener(
      "click",
      this.addButtonClasses.bind(
        this,
        buttonfriend,
        buttonBot,
        "bot",
        "friend",
      ),
    );
    buttonReset.addEventListener("click", this.startGame.bind(this));
  }

  addButtonClasses(b1, b2, a1, a2) {
    this.currPlayer = a2;
    b1.classList.add("hidden");
    b2.classList.remove("hidden");
    buttonReset.classList.remove("hidden", a1);
    buttonReset.classList.add(a2);
    this.startGame();
  }

  initialize() {
    this.originBoard = Array.from(Array(9).keys());
    for (let i = 0; i < cells.length; i++) {
      cells[i].textContent = "";
      cells[i].style.backgroundColor = "transparent";
      cells[i].addEventListener("click", this.bindTurnClick);
    }
  }

  turnActive(_turn) {
    if (_turn === turnO) {
      turnO.classList.add("turn--active");
      turnX.classList.remove("turn--active");
      turnText.textContent =
        this.currPlayer === "bot" ? "your turn" : "player 1";
    } else {
      turnO.classList.remove("turn--active");
      turnX.classList.add("turn--active");
      turnText.textContent =
        this.currPlayer === "bot" ? "bot's turn" : "player 2";
    }
  }

  startGame() {
    this.flag = true;
    this.isBotThinking = false;
    endGame.classList.add("hidden");
    this.turnActive(turnO);
    this.initialize();
  }

  turnClick(square) {
    const squareId = square.target.id;

    // BUG FIX: Prevent click if bot is thinking or cell is occupied
    if (this.isBotThinking || typeof this.originBoard[squareId] !== "number") {
      return;
    }

    if (this.currPlayer === "bot") {
      // Human move
      this.turn(squareId, huPlayer);

      // Only let bot move if game isn't over
      if (!this.checkWin(this.originBoard, huPlayer) && !this.checkTie()) {
        this.isBotThinking = true; // Lock the board

        setTimeout(() => {
          if (this.flag) {
            // Ensure bot picks from actual empty spots in its opening move
            const availableOpening = [0, 2, 4, 6, 8].filter(
              (el) => typeof this.originBoard[el] === "number",
            );

            const randInd = Math.floor(Math.random() * availableOpening.length);
            this.turn(String(availableOpening[randInd]), aiPlayer);
            this.flag = false;
          } else {
            this.turn(String(this.bestSpot()), aiPlayer);
          }
          this.isBotThinking = false; // Unlock the board
        }, 1000);
      }
    } else {
      // Friend Mode
      this.turn(squareId, this.currTurn);
      this.currTurn = this.currTurn === "O" ? "X" : "O";
    }
  }

  turn(squareId, player) {
    this.originBoard[squareId] = player;
    document.getElementById(squareId).textContent = player;
    cells[squareId].removeEventListener("click", this.bindTurnClick);

    let gameWon = this.checkWin(this.originBoard, player);

    if (gameWon) {
      this.gameOver(gameWon);
    } else if (this.checkTie()) {
      this.declareWiner("Tie");
    }

    if (player === huPlayer) this.turnActive(turnX);
    if (player === aiPlayer) this.turnActive(turnO);
  }

  checkWin(board, player) {
    let gameWon = null;
    for (let i = 0; i < winCombos.length; i++) {
      if (winCombos[i].every((index) => board[index] === player)) {
        gameWon = { index: i, winner: player };
        break;
      }
    }
    return gameWon;
  }

  checkTie() {
    return this.emptyPlace(this.originBoard).length === 0;
  }

  gameOver(gameWon) {
    winCombos[gameWon.index].forEach((el) => {
      cells[el].style.backgroundColor = "#40a578";
    });
    this.declareWiner(gameWon.winner);
  }

  declareWiner(who) {
    for (let i = 0; i < cells.length; i++) {
      cells[i].removeEventListener("click", this.bindTurnClick);
    }
    endGame.classList.remove("hidden");

    if (who === "Tie") {
      endGame.textContent = "Tie";
      return;
    }

    if (this.currPlayer === "bot") {
      endGame.textContent = who === huPlayer ? "You Win" : "You Lose";
    } else {
      endGame.textContent = who === "O" ? "Player 1 Wins" : "Player 2 Wins";
    }
  }

  emptyPlace(board) {
    return board.filter((s) => typeof s === "number");
  }

  bestSpot() {
    return this.minimax(this.originBoard, aiPlayer).index;
  }

  minimax(newBoard, player) {
    let availableSpot = this.emptyPlace(newBoard);

    if (this.checkWin(newBoard, huPlayer)) return { score: -10 };
    if (this.checkWin(newBoard, aiPlayer)) return { score: 20 };
    if (availableSpot.length === 0) return { score: 0 };

    let moves = [];
    for (let i = 0; i < availableSpot.length; i++) {
      let move = {};
      move.index = availableSpot[i];
      newBoard[availableSpot[i]] = player;

      if (player === aiPlayer) {
        let result = this.minimax(newBoard, huPlayer);
        move.score = result.score;
      } else {
        let result = this.minimax(newBoard, aiPlayer);
        move.score = result.score;
      }

      newBoard[availableSpot[i]] = move.index;
      moves.push(move);
    }

    let bestMove;
    if (player === aiPlayer) {
      let bestScore = -Infinity;
      for (let i = 0; i < moves.length; i++) {
        if (moves[i].score > bestScore) {
          bestScore = moves[i].score;
          bestMove = i;
        }
      }
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < moves.length; i++) {
        if (moves[i].score < bestScore) {
          bestScore = moves[i].score;
          bestMove = i;
        }
      }
    }
    return moves[bestMove];
  }
}

const app = new App();
