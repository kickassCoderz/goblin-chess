import {  Piece, RenderPieceProps, pieceName } from "../types"
import Pawn from '../assets/pieces/pawn.png'
import Bishop from '../assets/pieces/bishop.png'
import Knight from '../assets/pieces/knight.png'
import Rook from '../assets/pieces/rook.png'
import Queen from '../assets/pieces/queen.png'
import King from '../assets/pieces/king.png'
import styles from "../Game.module.css"
import { composeCssClass } from "@kickass-coderz/utils"

const pieceImage: Record<Piece, string> = {
    [Piece.Pawn]: Pawn,
    [Piece.Bishop]: Bishop,
    [Piece.Knight]: Knight,
    [Piece.Rook]: Rook,
    [Piece.Queen]: Queen,
    [Piece.King]: King,

}

export const RenderPiece = ({ piece, state }: RenderPieceProps) => {
    const image = pieceImage[piece]

    if (!image) {
        return null
    }

    return <img className={composeCssClass(styles.pieceImage, styles[`pieceState-${state}`])} src={image} alt={pieceName[piece]} />
}
