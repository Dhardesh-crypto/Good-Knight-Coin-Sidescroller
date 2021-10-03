import Phaser from 'phaser'
import { sharedInstance as events } from './EventCenter'

export default class UI extends Phaser.Scene
{
    private pointsLabel!: Phaser.GameObjects.Text;
    private healthLabel!: Phaser.GameObjects.Text;
    private points: integer = 0;
    private healthBar!: Phaser.GameObjects.Graphics;

    constructor()
    {
        super('ui');
    }

    create() {
        this.healthBar = this.add.graphics();
        this.setHealthBar(100);

        this.pointsLabel = this.add.text(10,35, 'Points: 0', { fontSize: '32px'} );

        events.on('star-collected', this.handleStarCollected, this);
        events.on('coin-collected', this.handleCoinCollected, this);
        events.on('health-changed', this.handleHealthChanged, this);
        events.on('gem-collected', this.handleGemCollected, this);
        events.on('damage-collected', this.handleDamageCollected, this);
        events.on('monster-collected', this.handleMonsterCollected, this);

        this.events.once(Phaser.Scenes.Events.DESTROY, () => {
            events.off('star-collected', this.handleStarCollected, this);
            events.off('coin-collected', this.handleCoinCollected, this);
            events.off('health-changed', this.handleHealthChanged, this);
            events.off('gem-collected', this.handleGemCollected, this);
            events.off('damage-collected', this.handleDamageCollected, this);
            events.off('monster-collected', this.handleMonsterCollected, this);
        })

    }

    private setHealthBar(value: number) 
    {
        const width = 200;
        const healthWidth = Phaser.Math.Clamp(value*width/100, 0, 200);
        this.healthBar.clear()
            .fillStyle(0x808080) // grey
            .fillRoundedRect(10,10, width, 20, 5);
        if (healthWidth > 0) {
            this.healthBar.fillStyle(0x00ff00)
            .fillRoundedRect(10,10,healthWidth,20,5);
        }
    }

    private handleStarCollected() 
    {
        this.pointsLabel.setText(`Points: ${++this.points}`);
    }

    private handleCoinCollected() 
    {
        this.pointsLabel.setText(`Points: ${++this.points}`);
    }

    private handleHealthChanged(health: number)
    {
        this.setHealthBar(health);
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

    private handleMonsterCollected()
    {
        console.log('Monster collected');
    }
}