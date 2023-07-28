import styles from './Game.module.css'
import { useCallback, useEffect, useState } from 'react'
import {
    Piece,
    Player,
    BoardState,
    SquareId,
    RenderBoardProps,
    piecePower,
    playerName,
    BattleState,
    pieceName,
    initialBoardState,
    gameName
} from './types'
import { RenderBoard } from './components'
import { notify, getReachableFields, getPiece } from './utils'
import { useAudio } from './hooks'
import backgroundSound1 from './assets/sounds/background_1.mp3'
import rock from './assets/battle/rock.png'
import paper from './assets/battle/paper.png'
import scissors from './assets/battle/scissors.png'
import { composeCssClass } from '@kickass-coderz/utils'
import Logo from './assets/logo.png'

let seenBattleModeTutorial = false

const Game = () => {
    const [isGameStarted, setGameStarted] = useState(false)
    const [state, setState] = useState<BoardState>(() => ({ ...initialBoardState }))
    const [selectedSquare, setSelectedSquare] = useState<SquareId>()
    const [currentPlayer, setCurrentPlayer] = useState<Player>(Player.White)
    const currentPlayerName = playerName[currentPlayer]
    const [battle, setBattle] = useState<BattleState>()
    const { play: playBackgroundAudio } = useAudio({ src: backgroundSound1 })

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

    useEffect(() => {
        const pause = playBackgroundAudio({ loop: true })

        return () => {
            pause()
        }
    }, [playBackgroundAudio])

    return (
        <div className={styles.root}>
            {/* <h2>{currentPlayerName}&apos;s turn</h2> */}
            {isGameStarted && <div className={styles.logoBackground} />}
            {battle && (
                <div className={styles.modal}>
                    <div className={styles.fight}>
                        <h2>Battle mode</h2>
                        <p className={styles.figthCurrentPlayerText}>{currentBattlePlayer}&apos;s turn, choose sign:</p>
                        <div className={styles.fightMoves}>
                            <div className={styles.fightMovesRow}>
                                <div
                                    className={composeCssClass(styles.fightMove, styles.fightMoveRock)}
                                    onClick={() => {
                                        onFightMoveClick('rock')
                                    }}
                                >
                                    <img className={styles.fightMoveImage} src={rock} alt="rock" />
                                </div>
                                <div
                                    className={composeCssClass(styles.fightMove, styles.fightMovePaper)}
                                    onClick={() => {
                                        onFightMoveClick('paper')
                                    }}
                                >
                                    <img className={styles.fightMoveImage} src={paper} alt="paper" />
                                </div>
                            </div>
                            <div
                                className={composeCssClass(styles.fightMove, styles.fightMoveScissors)}
                                onClick={() => {
                                    onFightMoveClick('scissors')
                                }}
                            >
                                <img className={styles.fightMoveImage} src={scissors} alt="scissors" />
                            </div>
                        </div>
                        <p className={styles.fightNote}>
                            Tip: Hide the device from other player while making a choice!
                        </p>
                    </div>
                </div>
            )}
            <div className={composeCssClass(styles.board, !isGameStarted && styles.boardDisabled)}>
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
                    currentPlayer={currentPlayer}
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
            {!isGameStarted && (
                <div className={styles.modal}>
                    <div className={styles.gameStart}>
                        <img className={styles.logoImage} src={Logo} alt={gameName} />
                        <h1>Welcome</h1>
                        <p>This is an ancient game with few twists. Destroy your opponent&apos;s King to win.</p>
                        <button
                            className={styles.button}
                            type="button"
                            onClick={() => {
                                setGameStarted(true)
                            }}
                        >
                            Start game
                        </button>
                        <p>Requires 2 players</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Game
