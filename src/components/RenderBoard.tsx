import { composeCssClass } from "@kickass-coderz/utils"
import { ReactElement } from "react"
import { RenderBoardProps, piecePower, boardSize, Player } from "../types"
import { getReachableFields, getPiece } from "../utils"
import styles from "../Game.module.css"

export const RenderBoard = ({ state, selectedSquare, onSquareClick, battle }: RenderBoardProps): ReactElement => {
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
