import Phaser from 'phaser'
import PlayerController from './PlayerController';

export default class GameScene extends Phaser.Scene {

    private cursors! : Phaser.Types.Input.Keyboard.CursorKeys;
    private cursorsWASD! : Phaser.Types.Input.Keyboard.CursorKeys;
    private ninjaCat? : Phaser.Physics.Matter.Sprite;
    private playerController?: PlayerController
    private movementSpeed! : integer; 
    private jumpHeight! : integer;

    constructor()
    {
        super('game-scene');
    }

    init() 
    {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.cursorsWASD = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            shift: Phaser.Input.Keyboard.KeyCodes.B
        }) as Phaser.Types.Input.Keyboard.CursorKeys;

        this.movementSpeed = 5;
        this.jumpHeight = -13;
    }

    preload() 
    {
        this.load.atlas('ninjacat', 'assets/NinjaCat.png', 'assets/NinjaCat.json');
        this.load.image('level-1', 'assets/tilesheet/sheet-snow.png');
        this.load.tilemapTiledJSON('tilemap-level-1', 'assets/level-1.json');
    }

    create() 
    {

        const map = this.make.tilemap({ key: 'tilemap-level-1' });
        const tileset = map.addTilesetImage('Snow', 'level-1');
        const ground = map.createLayer('ground', tileset);
        ground.setCollisionByProperty({ collides: true });
        this.matter.world.convertTilemapLayer(ground);
        // Change the label of the Matter body on tiles that do damage when the player touches.
        // This makes it easier to check Matter collisions.
        ground.forEachTile(function (tile) {
            // In Tiled, the dangerous tiles have been given a "doesDamage" property
            if (tile.properties.doesDamage)
            {
                tile.physics.matterBody.body.label = 'doesDamage';
            }
        });
       
        const objectsLayer = map.getObjectLayer('objects');
        objectsLayer.objects.forEach(objData => {
            const { x = 0, y = 0, name, width = 0 } = objData;

            switch(name) {
                case 'ninjaCat-Spawn': {
                    this.ninjaCat = this.matter.add.sprite(x + (width * 0.5), y, 'ninjacat')
                    .setScale(0.5)
                    .setFixedRotation();

                    this.playerController = new PlayerController(this.ninjaCat, this.cursors, this.cursorsWASD, this.movementSpeed, this.jumpHeight, this);

                    this.cameras.main.startFollow(this.ninjaCat);        
                    break;
                } 
            }

        })


    }

    update(t: number, dt: number) 
    {
        if (!this.playerController) 
        {
            return;
        }

        this.playerController.update(dt);
    }

}