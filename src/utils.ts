import { SquareId, BoardState, boardSize, OwnedPiece, Player, Piece } from './types'

export const getReachableFields = (selectedSquare: SquareId, state: BoardState, distance: number): SquareId[] => {
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

export const getPiece = (piece: OwnedPiece): [Player, Piece] => {
    return (piece || '').split('') as [Player, Piece]
}

export const notify = (message: string) => {
    alert(message)
}
