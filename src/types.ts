export const boardSize = [8, 8]

export enum Piece {
    Pawn = 'P',
    Rook = 'R',
    Knight = 'N',
    Bishop = 'B',
    Queen = 'Q',
    King = 'K'
}

export enum Player {
    White = 'W',
    Black = 'B'
}

export const playerName = {
    [Player.White]: 'White',
    [Player.Black]: 'Black'
}

export const piecePower = {
    [Piece.Pawn]: 1,
    [Piece.Rook]: 2,
    [Piece.Knight]: 2,
    [Piece.Bishop]: 2,
    [Piece.Queen]: 3,
    [Piece.King]: 1
}

export const pieceName = {
    [Piece.Pawn]: 'Pawn',
    [Piece.Rook]: 'Rook',
    [Piece.Knight]: 'Knight',
    [Piece.Bishop]: 'Bishop',
    [Piece.Queen]: 'Queen',
    [Piece.King]: 'King'
}

export type OwnedPiece = `${Player}${Piece}`

export type SquareId = `${number},${number}`

export type BoardState = Record<SquareId, OwnedPiece>

export type RenderBoardProps = {
    state: BoardState
    selectedSquare?: SquareId
    onSquareClick: ({ square, squareState }: { square: SquareId; squareState: [Player, Piece] }) => void
    battle?: BattleState
}

export type BattleState = {
    player1: Player
    player2: Player
    player1TargetScore: number
    player2TargetScore: number
    attackingSquareState: { id: SquareId; state: [Player, Piece] }
    attackedSquareState: { id: SquareId; state: [Player, Piece] }
}

export const oWhite = (piece: Piece): OwnedPiece => `${Player.White}${piece}`

export const oBlack = (piece: Piece): OwnedPiece => `${Player.Black}${piece}`

export const initialBoardState: BoardState = {
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
