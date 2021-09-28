import Phaser from 'phaser'

import GameScene from './scenes/GameScene'

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
            debug: true
        }
    },
    
	scene: [
        GameScene
    ]
}

export default new Phaser.Game(config)
