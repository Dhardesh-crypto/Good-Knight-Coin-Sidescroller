import Phaser from 'phaser'
import { sharedInstance as events } from './EventCenter'

export default class UI extends Phaser.Scene
{
    private pointsLabel!: Phaser.GameObjects.Text;
    private healthLabel!: Phaser.GameObjects.Text;
    private points: integer = 0;
    private health: integer = 100;

    constructor()
    {
        super('ui');
    }

    create() {
        this.pointsLabel = this.add.text(10,10, 'Points: 0', { fontSize: '32px'} );
        this.healthLabel = this.add.text(10,50, 'Health: 100%', { fontSize: '32px' });

        events.on('star-collected', this.handleStarCollected, this);
        events.on('coin-collected', this.handleCoinCollected, this);
        events.on('health-collected', this.handleHealthCollected, this);
        events.on('gem-collected', this.handleGemCollected, this);
        events.on('damage-collected', this.handleDamageCollected, this);

        this.events.once(Phaser.Scenes.Events.DESTROY, () => {
            events.off('star-collected', this.handleStarCollected, this);
            events.off('coin-collected', this.handleCoinCollected, this);
            events.off('health-collected', this.handleHealthCollected, this);
            events.off('gem-collected', this.handleGemCollected, this);
            events.off('damage-collected', this.handleDamageCollected, this);
        })

    }

    private handleStarCollected() 
    {
        console.log('Star collected');
        this.points += 1;
        this.pointsLabel.setText(`Points: ${this.points}`);
    }

    private handleCoinCollected() 
    {
        console.log('Coin collected');
        this.points += 1;
        this.pointsLabel.setText(`Points: ${this.points}`);
    }

    private handleHealthCollected()
    {
        console.log('Health collected');
        this.points += 1;
        this.pointsLabel.setText(`Points: ${this.points}`);
    }

    private handleGemCollected()
    {
        console.log('Gem collected');
        this.points += 1;
        this.pointsLabel.setText(`Points: ${this.points}`);
    }

    private handleDamageCollected() 
    {
        console.log('Gem collected');
        this.health -= 10;
        this.healthLabel.setText(`Health: ${this.health}%`);
    }
}