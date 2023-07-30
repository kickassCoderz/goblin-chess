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
import { getReachableFields, getPiece, notify } from './utils'
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
    const [battle, setBattle] = useState<BattleState>()
    const { play: playBackgroundAudio } = useAudio({ src: backgroundSound1 })
    const [player, setPlayer] = useState<Player>()
    const isMyTurn = currentPlayer === player
    const [notification, setNotification] = useState<string>()

    const endTurn = useCallback(
        () =>
            setCurrentPlayer(currentPlayerState => (currentPlayerState === Player.White ? Player.Black : Player.White)),
        []
    )

    const onSquareClick: RenderBoardProps['onSquareClick'] = ({ square, squareState }) => {
        if (battle) {
            notify('Finish the battle first!', setNotification)

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
                notify('You cannot move to a square occupied by your own piece!', setNotification)
            } else {
                notify('This square is out of reach!', setNotification)
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
                attackedSquareState: { id: square, state: squareState },
                player1Score: 0,
                player2Score: 0
            }

            setBattle(battleState)
            Rune.actions.startBattle(battleState)
        } else {
            setState(prevState => {
                const nextState = { ...prevState } as BoardState

                delete nextState[selectedSquare]
                nextState[`${square}`] = prevState[selectedSquare]

                return nextState
            })
            setSelectedSquare(undefined)
            endTurn()
            Rune.actions.movePiece({ squareId: selectedSquare, newSquareId: square })
        }
    }

    const playerMoves = [battle?.player1Move, battle?.player2Move].filter(Boolean)

    const currentBattlePlayer =
        playerMoves.length === 0 ? currentPlayer : currentPlayer === Player.White ? Player.Black : Player.White

    const onFightMoveClick = (playerMove: string) => {
        if (currentPlayer === Player.White) {
            setBattle(current => {
                if (!current) {
                    return undefined
                }

                return {
                    ...current,
                    player1Move: playerMove
                }
            })
        } else {
            setBattle(current => {
                if (!current) {
                    return undefined
                }

                return {
                    ...current,
                    player1Move: playerMove
                }
            })
        }

        Rune.actions.makeBattleMove({ playerMove })
    }

    useEffect(() => {
        const pause = playBackgroundAudio({ loop: true })

        return () => {
            pause()
        }
    }, [playBackgroundAudio])

    useEffect(() => {
        Rune.initClient({
            onChange: ({ newGame, oldGame, yourPlayerId }) => {
                if (!yourPlayerId) {
                    setCurrentPlayer(newGame.currentPlayer)
                } else {
                    setCurrentPlayer(newGame.currentPlayer)
                    setPlayer(newGame.players[yourPlayerId])
                }

                setState(newGame.board)
                setBattle(newGame.battle)
                setSelectedSquare(newGame.selectedSquare)

                if (newGame.notification && newGame.notification.timestamp != oldGame.notification?.timestamp) {
                    setNotification(newGame.notification.message)
                }
            }
        })
    }, [])

    useEffect(() => {
        if (!battle) {
            return
        }

        const { player1, attackedSquareState, attackingSquareState } = battle
        const isAttacking = player1 === player

        if (!seenBattleModeTutorial) {
            notify(
                `
You will now play "Rock Paper Scissors" to determine the winner of the battle!

Since you ${isAttacking ? 'attacked' : 'have been attacked by'} the ${
                    pieceName[isAttacking ? attackedSquareState.state[1] : attackingSquareState.state[1]]
                } (power: ${
                    piecePower[isAttacking ? attackedSquareState.state[1] : attackingSquareState.state[1]]
                }), you need to win ${
                    piecePower[isAttacking ? attackedSquareState.state[1] : attackingSquareState.state[1]]
                } times to win the battle.
<br /><br />
Since your opponent ${isAttacking ? 'is attacked by' : 'has attacked'} your ${
                    pieceName[isAttacking ? attackingSquareState.state[1] : attackedSquareState.state[1]]
                } (power: ${
                    piecePower[isAttacking ? attackingSquareState.state[1] : attackedSquareState.state[1]]
                }), your opponent needs to win ${
                    piecePower[isAttacking ? attackingSquareState.state[1] : attackedSquareState.state[1]]
                } times to win the battle.
<br /><br />
Different pieces have different levels of power. The power of a piece is the number of times you need to win "Rock Paper Scissors" to kill it.
<br /><br />
Pieces powers are:
<br />
${Object.entries(piecePower)
    .map(([piece, power]) => `${pieceName[piece as Piece]}: ${power}`)
    .join('<br />')}
<br /><br />
If you win the battle your opponents piece is ${
                    isAttacking ? 'destroyed and you get to move to the square it was occupying' : 'destroyed'
                }.

If you lose the battle your piece is destroyed${
                    isAttacking ? '' : ' and your opponent gets to move to the square it was occupying'
                }. After battle ${isAttacking ? 'your turn is over' : 'it is your turn'}.
            `,
                setNotification
            )

            seenBattleModeTutorial = true
        }
    }, [battle, player])

    const isMyBattleTurn = currentBattlePlayer === player

    return (
        <div
            className={styles.root}
            style={{
                pointerEvents: player ? 'all' : 'none'
            }}
        >
            {/* <h2>{currentPlayerName}&apos;s turn</h2> */}
            {isGameStarted && <div className={styles.logoBackground} />}
            {isGameStarted && notification && (
                <div className={styles.modal}>
                    <div className={styles.notification}>
                        <p
                            className={styles.notificationText}
                            dangerouslySetInnerHTML={{
                                __html: notification
                            }}
                        />
                        <button
                            className={styles.button}
                            type="button"
                            onClick={() => {
                                setNotification(undefined)
                            }}
                        >
                            Ok
                        </button>
                    </div>
                </div>
            )}
            {!notification && battle && (
                <div
                    className={styles.modal}
                    style={{
                        pointerEvents: isMyBattleTurn ? 'all' : 'none'
                    }}
                >
                    <div className={styles.fight}>
                        <h2>Battle mode</h2>
                        <h3 className={styles.fightScore}>
                            <span className={styles[`fightScore-${Player.White}`]}>{battle.player1Score}</span> -{' '}
                            <span className={styles[`fightScore-${Player.Black}`]}>{battle.player2Score}</span>
                        </h3>
                        {isMyBattleTurn && <p className={styles.figthCurrentPlayerText}>Choose your sign</p>}
                        {!isMyBattleTurn && (
                            <p className={styles.figthCurrentPlayerText}>
                                {playerName[currentBattlePlayer]} is choosing...
                            </p>
                        )}
                        {isMyBattleTurn && (
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
                        )}
                    </div>
                </div>
            )}
            <div
                className={composeCssClass(styles.board, !isGameStarted && styles.boardDisabled)}
                style={{
                    pointerEvents: isMyTurn ? 'all' : 'none'
                }}
            >
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
                    player={player}
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
                            Play
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Game
