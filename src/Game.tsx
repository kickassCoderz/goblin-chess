import styles from './Game.module.css'
import { composeCssClass } from '@kickass-coderz/utils'
import { ReactElement, useCallback, useEffect, useState } from 'react'

const boardSize = [8, 8]

/* eslint-disable no-unused-vars*/
enum Piece {
    Pawn = 'P',
    Rook = 'R',
    Knight = 'N',
    Bishop = 'B',
    Queen = 'Q',
    King = 'K'
}

enum Player {
    White = 'W',
    Black = 'B'
}

const playerName = {
    [Player.White]: 'White',
    [Player.Black]: 'Black'
}

const piecePower = {
    [Piece.Pawn]: 1,
    [Piece.Rook]: 2,
    [Piece.Knight]: 2,
    [Piece.Bishop]: 2,
    [Piece.Queen]: 3,
    [Piece.King]: 1
}

const pieceName = {
    [Piece.Pawn]: 'Pawn',
    [Piece.Rook]: 'Rook',
    [Piece.Knight]: 'Knight',
    [Piece.Bishop]: 'Bishop',
    [Piece.Queen]: 'Queen',
    [Piece.King]: 'King'
}
/* eslint-enable no-unused-vars*/

type OwnedPiece = `${Player}${Piece}`

const oWhite = (piece: Piece): OwnedPiece => `${Player.White}${piece}`
const oBlack = (piece: Piece): OwnedPiece => `${Player.Black}${piece}`

const initialBoardState: BoardState = {
    '0,0': oWhite(Piece.Rook),
    '0,1': oWhite(Piece.Knight),
    '0,2': oWhite(Piece.Bishop),
    '0,3': oWhite(Piece.Queen),
    '0,4': oWhite(Piece.King),
    '0,5': oWhite(Piece.Bishop),
    '0,6': oWhite(Piece.Knight),
    '0,7': oWhite(Piece.Rook),
    '1,0': oWhite(Piece.Pawn),
    '1,1': oWhite(Piece.Pawn),
    '1,2': oWhite(Piece.Pawn),
    '1,3': oWhite(Piece.Pawn),
    '1,4': oWhite(Piece.Pawn),
    '1,5': oWhite(Piece.Pawn),
    '1,6': oWhite(Piece.Pawn),
    '1,7': oWhite(Piece.Pawn),
    '6,0': oBlack(Piece.Pawn),
    '6,1': oBlack(Piece.Pawn),
    '6,2': oBlack(Piece.Pawn),
    '6,3': oBlack(Piece.Pawn),
    '6,4': oBlack(Piece.Pawn),
    '6,5': oBlack(Piece.Pawn),
    '6,6': oBlack(Piece.Pawn),
    '6,7': oBlack(Piece.Pawn),
    '7,0': oBlack(Piece.Rook),
    '7,1': oBlack(Piece.Knight),
    '7,2': oBlack(Piece.Bishop),
    '7,3': oBlack(Piece.Queen),
    '7,4': oBlack(Piece.King),
    '7,5': oBlack(Piece.Bishop),
    '7,6': oBlack(Piece.Knight),
    '7,7': oBlack(Piece.Rook)
}

type SquareId = `${number},${number}`

type BoardState = Record<SquareId, OwnedPiece>

type RenderBoardProps = {
    state: BoardState
    selectedSquare?: SquareId
    onSquareClick: ({ square, squareState }: { square: SquareId; squareState: [Player, Piece] }) => void
    battle?: BattleState
}

const getReachableFields = (selectedSquare: SquareId, state: BoardState, distance: number): SquareId[] => {
    const [x, y] = selectedSquare.split(',').map(Number)
    const [selectedPlayer] = getPiece(state[selectedSquare])
    const fields: SquareId[] = []

    for (let i = 0; i < boardSize[0]; i++) {
        for (let j = 0; j < boardSize[1]; j++) {
            const squareId = `${i},${j}` as SquareId
            const [player] = getPiece(state[squareId])

            if (selectedPlayer !== player && Math.max(Math.abs(x - i), Math.abs(y - j)) <= distance) {
                let blocked = false
                const dx = Math.sign(i - x)
                const dy = Math.sign(j - y)
                for (let k = 1; k < Math.max(Math.abs(x - i), Math.abs(y - j)); k++) {
                    const [, piece] = getPiece(state[`${x + dx * k},${y + dy * k}` as SquareId])
                    if (piece) {
                        blocked = true
                        break
                    }
                }
                if (!blocked) {
                    fields.push(squareId)
                }
            }
        }
    }

    return fields
}

const RenderBoard = ({ state, selectedSquare, onSquareClick, battle }: RenderBoardProps): ReactElement => {
    const board = []
    const fieldsInRadiusOfPower = selectedSquare
        ? getReachableFields(selectedSquare, state, piecePower[getPiece(state[selectedSquare])[1]])
        : []

    for (let i = 0; i < boardSize[0]; i++) {
        for (let j = 0; j < boardSize[1]; j++) {
            const squareId = `${i},${j}` as `${number},${number}`
            const square = state[squareId]
            const [player, piece] = getPiece(square)

            board.push(
                <div
                    key={squareId}
                    className={composeCssClass(
                        styles.square,
                        player === Player.White ? styles.squareWhite : styles.squareBlack,
                        selectedSquare === squareId && styles.squareSelected,
                        battle?.attackedSquareState.id === squareId && styles.squareSelected,
                        !battle && fieldsInRadiusOfPower.includes(squareId) && styles.squareOption
                    )}
                    onClick={() => {
                        onSquareClick({ square: squareId, squareState: [player, piece] })
                    }}
                >
                    {piece}
                </div>
            )
        }
    }

    return <>{board}</>
}

const getPiece = (piece: OwnedPiece): [Player, Piece] => {
    return (piece || '').split('') as [Player, Piece]
}

const notify = (message: string) => {
    alert(message)
}

type BattleState = {
    player1: Player
    player2: Player
    player1TargetScore: number
    player2TargetScore: number
    attackingSquareState: { id: SquareId; state: [Player, Piece] }
    attackedSquareState: { id: SquareId; state: [Player, Piece] }
}

let seenBattleModeTutorial = false

const Game = () => {
    const [state, setState] = useState<BoardState>(() => ({ ...initialBoardState }))
    const [selectedSquare, setSelectedSquare] = useState<SquareId>()
    const [currentPlayer, setCurrentPlayer] = useState<Player>(Player.White)
    const currentPlayerName = playerName[currentPlayer]
    const [battle, setBattle] = useState<BattleState>()

    const endTurn = useCallback(
        () =>
            setCurrentPlayer(currentPlayerState => (currentPlayerState === Player.White ? Player.Black : Player.White)),
        []
    )

    const onSquareClick: RenderBoardProps['onSquareClick'] = ({ square, squareState }) => {
        if (battle) {
            notify('Finish the battle first to continue')

            return
        }

        const [squarePlayer] = squareState

        if (!selectedSquare) {
            if (squarePlayer === currentPlayer) {
                setSelectedSquare(square)
            }

            return
        }

        if (square === selectedSquare) {
            setSelectedSquare(undefined)

            return
        }

        const [nextSquarePlayer, nextSquarePiece] = squareState

        const allowedFields = getReachableFields(selectedSquare, state, piecePower[getPiece(state[selectedSquare])[1]])

        if (!allowedFields.includes(square)) {
            if (nextSquarePlayer === currentPlayer) {
                notify('You cannot move to a square occupied by your own piece')
            } else {
                notify('You cannot move to this square')
            }

            return
        }

        if (nextSquarePlayer && nextSquarePlayer !== currentPlayer) {
            const [, selectedSquarePiece] = getPiece(state[selectedSquare])
            const battleState = {
                player1: currentPlayer,
                player2: nextSquarePlayer,
                player1TargetScore: piecePower[nextSquarePiece],
                player2TargetScore: piecePower[selectedSquarePiece],
                attackingSquareState: { id: selectedSquare, state: getPiece(state[selectedSquare]) },
                attackedSquareState: { id: square, state: squareState }
            }

            setBattle(battleState)

            if (!seenBattleModeTutorial) {
                notify(`
You will now play rock paper scissors to determine the winner of the battle! (scroll this prompt to read more)

Since you are battling against the ${pieceName[nextSquarePiece]} (power: ${
                    piecePower[nextSquarePiece]
                }), you need to win ${piecePower[nextSquarePiece]} times to win the battle.

Since you are fighting with the ${pieceName[selectedSquarePiece]} (power: ${
                    piecePower[selectedSquarePiece]
                }), your opponent needs to win ${piecePower[selectedSquarePiece]} times to win the battle.

Different pieces have different levels of power. The power of a piece is the number of times you need to win rock paper scissors to kill it.

Pieces powers are:
${Object.entries(piecePower)
    .map(([piece, power]) => `${pieceName[piece as Piece]}: ${power}`)
    .join('\n')}

If you win the battle opponents piece is destroyed and you get to move to the square it was occupying.

If you lose the battle your piece is destroyed and it's your opponents turn.
                `)
                seenBattleModeTutorial = true
            }
        } else {
            setState(prevState => {
                const nextState = { ...prevState } as BoardState

                delete nextState[selectedSquare]
                nextState[`${square}`] = prevState[selectedSquare]

                return nextState
            })
            setSelectedSquare(undefined)
            endTurn()
        }
    }

    const [score, setScore] = useState([0, 0])
    const [playerMoves, setPlayerMoves] = useState<string[]>([])
    const currentBattlePlayer =
        playerMoves.length === 0
            ? currentPlayerName
            : playerName[currentPlayer === Player.White ? Player.Black : Player.White]

    const onFightMoveClick = (playerMove: string) => {
        setPlayerMoves(current => [...current, playerMove])
    }

    useEffect(() => {
        if (!battle) {
            return
        }

        if (playerMoves.length < 2) {
            return
        }

        const { player1, player2 } = battle
        const [player1Move, player2Move] = playerMoves

        if (player1Move === player2Move) {
            notify('Draw!')
        } else if (
            (player1Move === 'rock' && player2Move === 'scissors') ||
            (player1Move === 'paper' && player2Move === 'rock') ||
            (player1Move === 'scissors' && player2Move === 'paper')
        ) {
            setScore(prevScore => [prevScore[0] + 1, prevScore[1]])
            notify(`${playerName[player1]} wins this round!`)
        } else {
            setScore(prevScore => [prevScore[0], prevScore[1] + 1])
            notify(`${playerName[player2]} wins this round!`)
        }

        setPlayerMoves([])
    }, [battle, playerMoves])

    useEffect(() => {
        if (!battle) {
            return
        }

        const { player1TargetScore, player2TargetScore, attackingSquareState, attackedSquareState, player1, player2 } =
            battle

        const endBattle = ({ killedState }: { killedState: [Player, Piece] }) => {
            if (killedState[1] === Piece.King) {
                const winner = killedState[0] === Player.White ? Player.Black : Player.White

                notify(`${playerName[winner]} wins the game! (game will now restart)`)
                window.location.reload()
            }

            setBattle(undefined)
            setScore([0, 0])
            setPlayerMoves([])
            setSelectedSquare(undefined)
        }

        if (score[0] === player1TargetScore) {
            notify(`${playerName[player1]} wins the battle!`)
            setState(prevState => {
                const nextState = { ...prevState } as BoardState

                delete nextState[attackingSquareState.id]
                nextState[attackedSquareState.id] = prevState[attackingSquareState.id]

                return nextState
            })

            endBattle({ killedState: attackedSquareState.state })
            endTurn()
        } else if (score[1] === player2TargetScore) {
            notify(`${playerName[player2]} wins the battle!`)
            setState(prevState => {
                const nextState = { ...prevState } as BoardState

                delete nextState[attackingSquareState.id]

                return nextState
            })

            endBattle({ killedState: attackingSquareState.state })
            endTurn()
        }
    }, [battle, score, endTurn])

    return (
        <div className={styles.root}>
            <h1>Goblin Chess</h1>
            <p>Kill the King to win (marked with K)</p>
            <h2>{currentPlayerName}&apos;s turn</h2>
            {battle && (
                <>
                    <br />
                    <div className={styles.fight}>
                        <h2>Battle mode</h2>
                        <p>Current player: {currentBattlePlayer}</p>

                        <p>Note: Hide the phone from other player while making a choice</p>
                        <div className={styles.fightMoves}>
                            <div
                                className={styles.fightMove}
                                onClick={() => {
                                    onFightMoveClick('rock')
                                }}
                            >
                                Rock
                            </div>
                            <div
                                className={styles.fightMove}
                                onClick={() => {
                                    onFightMoveClick('paper')
                                }}
                            >
                                Paper
                            </div>
                            <div
                                className={styles.fightMove}
                                onClick={() => {
                                    onFightMoveClick('scissors')
                                }}
                            >
                                Scissors
                            </div>
                        </div>
                    </div>
                </>
            )}
            <br />
            <div className={styles.board}>
                <div className={styles.boardTop}>
                    <div className={styles.boardInner}>
                        <div className={styles.squareInner}>Z</div>
                        <div className={styles.squareInner}>Y</div>
                        <div className={styles.squareInner}>X</div>
                        <div className={styles.squareInner}>W</div>
                        <div className={styles.squareInner}>V</div>
                        <div className={styles.squareInner}>U</div>
                        <div className={styles.squareInner}>T</div>
                        <div className={styles.squareInner}>S</div>
                    </div>
                </div>
                <RenderBoard
                    state={state}
                    selectedSquare={selectedSquare}
                    onSquareClick={onSquareClick}
                    battle={battle}
                />
                <div className={styles.boardBottom}>
                    <div className={styles.boardInner}>
                        <div className={styles.squareInner}>Z</div>
                        <div className={styles.squareInner}>Y</div>
                        <div className={styles.squareInner}>X</div>
                        <div className={styles.squareInner}>W</div>
                        <div className={styles.squareInner}>V</div>
                        <div className={styles.squareInner}>U</div>
                        <div className={styles.squareInner}>T</div>
                        <div className={styles.squareInner}>S</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Game
