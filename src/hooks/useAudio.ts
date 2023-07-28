import { useCallback } from 'react'
import { UseAudio, UseAudioProps } from '../types'

let didInteractWithGame = false

const audioCache: Record<string, HTMLAudioElement> = {}

const getAudio = (src: string) => {
    if (!audioCache[src]) {
        audioCache[src] = new Audio(src)
    }

    return audioCache[src]
}

export const useAudio = ({ src }: UseAudioProps): UseAudio => {
    const play = useCallback(
        ({ loop = false }) => {
            const audio = getAudio(src)
            audio.loop = loop

            const playAudio = () => {
                didInteractWithGame = true

                audio.play()
            }

            if (didInteractWithGame) {
                playAudio()
            } else {
                document.body.addEventListener('mousedown', playAudio, { once: true })
            }

            return () => {
                audio.pause()
            }
        },
        [src]
    )

    const pause = useCallback(() => {
        const audio = getAudio(src)

        audio.pause()
    }, [src])

    return { play, pause }
}
