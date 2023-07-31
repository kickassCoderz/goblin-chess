import type { RuneClient } from 'rune-games-sdk/multiplayer'
import { OwnedPiece, Player, SquareId, initialBoardState, BattleState, Piece, playerName } from './types'
import { getPiece } from './utils'

export interface GameState {
    players: Record<string, Player>
    playerToId: Record<Player, string>
    board: Record<SquareId, OwnedPiece>
    selectedSquare?: SquareId
    currentPlayer: Player
    battle?: BattleState
    notification?: {
        message: string
        timestamp: number
    }
}

type GameActions = {
    startBattle: (battle: BattleState) => void
    movePiece: ({ squareId, newSquareId }: { squareId: SquareId; newSquareId: SquareId }) => void
    makeBattleMove: ({ playerMove }: { playerMove: string }) => void
}

declare global {
    const Rune: RuneClient<GameState, GameActions>
}

const endTurn = (game: GameState) => {
    game.currentPlayer = game.currentPlayer === Player.White ? Player.Black : Player.White
}

const checkPlayerAccess = (game: GameState, player: Player) => {
    const battle = game.battle

    if (!battle) {
        throw Rune.invalidAction()
    }

    const { player1, player2 } = battle

    const currentBattlePlayer = battle.player1Move ? player2 : player1

    if (currentBattlePlayer !== player) {
        throw Rune.invalidAction()
    }
}

const movePiece = (
    { squareId, newSquareId }: { squareId: SquareId; newSquareId: SquareId },
    { game }: { game: GameState }
) => {
    game.board[newSquareId] = game.board[squareId]
    delete game.board[squareId]
}

const removePiece = ({ squareId }: { squareId: SquareId }, { game }: { game: GameState }) => {
    delete game.board[squareId]
}

const createNotification = (message: string) => {
    return {
        message,
        timestamp: Rune.gameTimeInSeconds()
    }
}

const checkIfGameOver = (game: GameState, deadPieceSquareId: SquareId) => {
    const battle = game.battle

    if (!battle) {
        throw Rune.invalidAction()
    }

    const [deadPlayer, deadPiece] = getPiece(game.board[deadPieceSquareId])

    const { player1, player2 } = battle

    const winningPlayer = deadPlayer === player1 ? player2 : player1
    const losingPlayer = deadPlayer === player1 ? player1 : player2

    if (deadPiece === Piece.King) {
        game.notification = undefined

        Rune.gameOver({
            players: {
                [game.playerToId[winningPlayer]]: 'WON',
                [game.playerToId[losingPlayer]]: 'LOST'
            }
        })
    } else {
        game.notification = createNotification(`${playerName[winningPlayer]} wins the battle!`)
    }
}

const endBattle = (game: GameState) => {
    game.battle = undefined
    game.selectedSquare = undefined
    endTurn(game)
}

Rune.initLogic({
    minPlayers: 2,
    maxPlayers: 2,
    setup: allPlayerIds => {
        return {
            players: {
                [allPlayerIds[0]]: Player.White,
                [allPlayerIds[1]]: Player.Black
            },
            playerToId: {
                [Player.White]: allPlayerIds[0],
                [Player.Black]: allPlayerIds[1]
            },
            board: {
                ...initialBoardState
            },
            selectedSquare: undefined,
            currentPlayer: Player.White,
            battle: undefined
        }
    },
    actions: {
        movePiece: ({ squareId, newSquareId }, { game }) => {
            if (game.board[squareId] === undefined) {
                throw Rune.invalidAction()
            }

            const [currentPlayer] = getPiece(game.board[squareId])

            if (currentPlayer !== game.currentPlayer) {
                throw Rune.invalidAction()
            }

            if (game.board[newSquareId] !== undefined) {
                // this requires battle

                throw Rune.invalidAction()
            }

            movePiece({ squareId, newSquareId }, { game })

            endTurn(game)
        },
        startBattle: (battle: BattleState, { game }) => {
            if (battle.player1 !== game.currentPlayer) {
                throw Rune.invalidAction()
            }

            game.battle = battle
        },
        makeBattleMove: ({ playerMove }, { game, playerId }) => {
            if (!game.battle) {
                throw Rune.invalidAction()
            }

            const player = game.players[playerId]
            checkPlayerAccess(game, player)

            if (player === game.battle.player1) {
                game.battle.player1Move = playerMove
            } else {
                game.battle.player2Move = playerMove
            }

            const { player1Move, player2Move } = game.battle

            if (game.battle.player1Move && game.battle.player2Move) {
                if (player1Move === player2Move) {
                    game.notification = createNotification("It's a tie! Go again.")
                } else if (
                    (player1Move === 'rock' && player2Move === 'scissors') ||
                    (player1Move === 'paper' && player2Move === 'rock') ||
                    (player1Move === 'scissors' && player2Move === 'paper')
                ) {
                    game.battle.player1Score += 1
                    game.notification = createNotification(`${playerName[game.battle.player1]} wins this round!`)
                } else {
                    game.battle.player2Score += 1
                    game.notification = createNotification(`${playerName[game.battle.player2]} wins this round!`)
                }

                game.battle.player1Move = undefined
                game.battle.player2Move = undefined

                const {
                    player1TargetScore,
                    player2TargetScore,
                    attackingSquareState,
                    attackedSquareState,
                    player1Score,
                    player2Score
                } = game.battle

                if (player1Score === player1TargetScore) {
                    checkIfGameOver(game, attackedSquareState.id)
                    movePiece({ squareId: attackingSquareState.id, newSquareId: attackedSquareState.id }, { game })
                    endBattle(game)
                } else if (player2Score === player2TargetScore) {
                    checkIfGameOver(game, attackingSquareState.id)
                    removePiece({ squareId: attackingSquareState.id }, { game })
                    endBattle(game)
                }
            }
        }
    }
})
