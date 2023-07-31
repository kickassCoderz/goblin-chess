import { Piece, PieceState, RenderPieceProps, pieceName } from '../types'
import Pawn from '../assets/pieces/pawn.png'
import Bishop from '../assets/pieces/bishop.png'
import Knight from '../assets/pieces/knight.png'
import Rook from '../assets/pieces/rook.png'
import Queen from '../assets/pieces/queen.png'
import King from '../assets/pieces/king.png'
import styles from '../Game.module.css'
import { composeCssClass } from '@kickass-coderz/utils'
import { useAudio } from '../hooks'
import pawnReadySound from '../assets/sounds/pawn.mp3'
import knightReadySound from '../assets/sounds/knight.mp3'
import queenReadySound from '../assets/sounds/queen.mp3'
import bishopReadySound from '../assets/sounds/bishop.mp3'
import rookReadySound from '../assets/sounds/rook.mp3'
import kingReadySound from '../assets/sounds/king.mp3'

const pieceImage: Record<Piece, string> = {
    [Piece.Pawn]: Pawn,
    [Piece.Bishop]: Bishop,
    [Piece.Knight]: Knight,
    [Piece.Rook]: Rook,
    [Piece.Queen]: Queen,
    [Piece.King]: King
}

const pieceReadySound: Record<Piece, string> = {
    [Piece.Pawn]: pawnReadySound,
    [Piece.Bishop]: bishopReadySound,
    [Piece.Knight]: knightReadySound,
    [Piece.Rook]: rookReadySound,
    [Piece.Queen]: queenReadySound,
    [Piece.King]: kingReadySound
}

export const RenderPiece = ({ piece, state }: RenderPieceProps) => {
    const image = pieceImage[piece]
    const readySoundSrc = pieceReadySound[piece]
    const { play: playReadySound } = useAudio({ src: readySoundSrc })

    if (!image) {
        return null
    }

    return (
        <img
            className={composeCssClass(styles.pieceImage, styles[`pieceState-${state}`], styles[`piece-${piece}`])}
            src={image}
            alt={pieceName[piece]}
            onClick={() => {
                if (state === PieceState.Ready) {
                    playReadySound({ loop: false })
                }
            }}
        />
    )
}
