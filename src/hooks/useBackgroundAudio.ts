import { useEffect } from 'react'
import backgroundSound1 from '../assets/sounds/background_1.mp3'

let didInteractWithGame = false

export const useBackgroundAudio = () => {
    useEffect(() => {
        const audioTracks = [new Audio(backgroundSound1)]

        const startBackgroundMusic = () => {
            didInteractWithGame = true

            audioTracks.forEach(audio => {
                audio.loop = true
                audio.play()
            })
        }

        if (didInteractWithGame) {
            startBackgroundMusic()
        } else {
            document.body.addEventListener('mousedown', startBackgroundMusic, { once: true })
        }

        return () => {
            document.body.removeEventListener('mousedown', startBackgroundMusic)

            audioTracks.forEach(audio => {
                audio.pause()
            })
        }
      }, [])
}
