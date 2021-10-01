import Phaser from 'phaser'

import GameScene from './scenes/GameScene'
import UI from './scenes/UI'

const config = {
    type: Phaser.AUTO,
    parent: 'game',
    dom: {
        createContainer: true
    },
    width: 1200,
    height: 800,
    physics: {
        default: 'matter',
        matter: {
            debug: false
        }
    },
    
	scene: [
        GameScene,
        UI
    ]
}

export default new Phaser.Game(config)
