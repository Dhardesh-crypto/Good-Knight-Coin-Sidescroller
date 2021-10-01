import Phaser from 'phaser'
import ObstaclesController from './ObstaclesController';
import PlayerController from './PlayerController';

export default class GameScene extends Phaser.Scene {

    private cursors! : Phaser.Types.Input.Keyboard.CursorKeys;
    private cursorsWASD! : Phaser.Types.Input.Keyboard.CursorKeys;
    private ninjaCat? : Phaser.Physics.Matter.Sprite;
    private playerController?: PlayerController
    private movementSpeed! : integer; 
    private jumpHeight! : integer;
    private obstacles!: ObstaclesController;

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

        this.obstacles = new ObstaclesController();
    }

    preload() 
    {
        this.load.atlas('ninjacat', 'assets/NinjaCat.png', 'assets/NinjaCat.json');
        this.load.image('level-one', 'assets/tilesheet/sheet-ice.png');
        this.load.tilemapTiledJSON('tilemap-level-one', 'assets/level-one.json');
        this.load.image('coin', 'assets/coin.png');
        this.load.image('health', 'assets/health.png');
        this.load.image('star', 'assets/star.png');
        this.load.image('sphere', 'assets/sphere.png');
        this.load.image('heart', 'assets/heart.png');
        this.load.image('tank', 'assets/tank.png');
        this.load.image('gem1', 'assets/gem_blue.png');
        this.load.image('gem2', 'assets/gem_green.png');
        this.load.image('gem3', 'assets/gem_red.png');
    }

    create() 
    {
        this.scene.launch('ui');

        const map = this.make.tilemap({ key: 'tilemap-level-one' });
        const tileset = map.addTilesetImage('ice', 'level-one');
        const ground = map.createLayer('ground', tileset);
        const obstacles = map.createLayer('obstacles', tileset);
        ground.setCollisionByProperty({ collides: true });
        this.matter.world.convertTilemapLayer(ground);
        // Change the label of the Matter body on tiles that do damage when the player touches.
        // This makes it easier to check Matter collisions.
        ground.forEachTile(function (tile) {
            // In Tiled, the dangerous tiles have been given a "doesDamage" property
            if (tile.properties.doesDamage)
            {
        //        tile.physics.matterBody.body.label = 'doesDamage';
            }
        });
       
        const objectsLayer = map.getObjectLayer('objects');
        objectsLayer.objects.forEach(objData => {
            const { x = 0, y = 0, name, width = 0, height = 0 } = objData;

            switch(name) {
                case 'ninjaCat-Spawn': {
                    this.ninjaCat = this.matter.add.sprite(x + (width * 0.5), y, 'ninjacat')
                        .setScale(0.5)
                        .setFixedRotation();

                    this.playerController = new PlayerController(
                        this.ninjaCat, 
                        this.cursors, 
                        this.cursorsWASD, 
                        this.movementSpeed, 
                        this.jumpHeight,
                        this.obstacles, 
                        this);

                    this.cameras.main.startFollow(this.ninjaCat);        
                    break;
                }
                case 'star': {
                    const star = this.matter.add.sprite(x, y, 'star', undefined, 
                    {   isStatic: true,
                        isSensor: true     
                    } )
                    .setScale(0.2);
                    star.setData('type', 'star');
                    break;
                }
                case 'health': {
                    const health = this.matter.add.sprite(x, y, 'health', undefined, 
                    {   isStatic: true,
                        isSensor: true     
                    } )
                    .setScale(0.2);
                    health.setData('type', 'health');
                    break;
                } 
                case 'coin': {
                    const coin = this.matter.add.sprite(x, y, 'coin', undefined, 
                    {   isStatic: true,
                        isSensor: true     
                    } )
                    .setScale(0.2);
                    coin.setData('type', 'coin');
                    break;
                } 
                case 'gem': {
                    const gem = this.matter.add.sprite(x, y, `gem${Phaser.Math.Between(1,3)}`, undefined, 
                    {   isStatic: true,
                        isSensor: true     
                    } )
                    .setScale(0.2);
                    gem.setData('type', 'gem');
                    break;
                }
                case 'spikes': {
                    const spike = this.matter.add.rectangle(x + (width * 0.5), y + (height * 0.5), width, height, {
                        isStatic: true
                    })
                    this.obstacles.add('spikes', spike);
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