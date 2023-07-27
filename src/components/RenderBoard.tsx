import { composeCssClass } from "@kickass-coderz/utils"
import { ReactElement } from "react"
import { RenderBoardProps, piecePower, boardSize, Player, PieceState, SquareId } from "../types"
import { getReachableFields, getPiece } from "../utils"
import styles from "../Game.module.css"
import { RenderPiece } from "."

export const RenderBoard = ({ state, selectedSquare, onSquareClick, battle, currentPlayer }: RenderBoardProps): ReactElement => {
    const board: ReactElement[] = []
    const fieldsInRadiusOfPower = selectedSquare
        ? getReachableFields(selectedSquare, state, piecePower[getPiece(state[selectedSquare])[1]])
        : []

    const render = ({ squareId }: {squareId: SquareId}) => {
        const square = state[squareId]
        const [player, piece] = getPiece(square)
        let pieceState = PieceState.Idle

        if (player === currentPlayer) {
            pieceState = PieceState.Ready
        }

        board.push(
            <div
                key={squareId}
                className={composeCssClass(
                    styles.square,
                    player === Player.White ? styles.squareWhite : styles.squareBlack,
                    selectedSquare === squareId && styles.squareSelected,
                    battle?.attackedSquareState.id === squareId && styles.squareSelected,
                    !battle && fieldsInRadiusOfPower.includes(squareId) && styles.squareOption,
                    player === Player.White ? styles.squareWhite : styles.squareBlack,
                )}
                onClick={() => {
                    onSquareClick({ square: squareId, squareState: [player, piece] })
                }}
            >
                <RenderPiece state={pieceState} piece={piece} />
            </div>
        )
    }

    const reverseBoard = currentPlayer === Player.Black

    if (reverseBoard) {
        for (let i = boardSize[0] - 1; i >= 0; i--) {
            for (let j = boardSize[1] - 1; j >= 0; j--) {
                const squareId = `${i},${j}` as SquareId
                render({squareId})
            }
        }
    } else {
        for (let i = 0; i < boardSize[0]; i++) {
            for (let j = 0; j < boardSize[1]; j++) {
                const squareId = `${i},${j}` as SquareId
                render({squareId})
            }
        }
    }

    return <>{board}</>
}
