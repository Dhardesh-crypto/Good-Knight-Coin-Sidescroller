import Phaser from 'phaser'
import StateMachine from '../statemachine/StateMachine';

export default class PlayerController
{
    private sprite: Phaser.Physics.Matter.Sprite;
    private stateMachine: StateMachine
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private cursorsWASD: Phaser.Types.Input.Keyboard.CursorKeys;
    private movementSpeed! : integer; 
    private jumpHeight! : integer;

    constructor(sprite: Phaser.Physics.Matter.Sprite, 
            cursors: Phaser.Types.Input.Keyboard.CursorKeys, 
            cursorsWASD: Phaser.Types.Input.Keyboard.CursorKeys,
            movementSpeed: integer,
            jumpHeight: integer) 
    {
        this.sprite = sprite;
        this.cursors = cursors;
        this.cursorsWASD = cursorsWASD;
        this.movementSpeed = movementSpeed;
        this.jumpHeight = jumpHeight;
        this.createAnimations();
        this.stateMachine = new StateMachine(this, 'player');

        this.stateMachine
            .addState('idle', {
                onEnter: this.idleOnEnter,
                onUpdate: this.idleOnUpdate
            })
            .addState('walking', {
                onEnter: this.walkingOnEnter,
                onUpdate: this.walkingOnUpdate
            })
            .addState('jumping', {
                onEnter: this.jumpingOnEnter,
                onUpdate: this.jumpingOnUpdate
            })
            .addState('kicking', {
                onEnter: this.kickingOnEnter,
                onUpdate: this.kickingOnUpdate
            })
            .addState('punching', {
                onEnter: this.punchingOnEnter,
                onUpdate: this.punchingOnUpdate
            })
            .addState('attacking', {
                onEnter: this.attackingOnEnter,
                onUpdate: this.attackingOnUpdate
            })
            .setState('idle');

            this.sprite.setOnCollide((data: MatterJS.ICollisionPair) => {
               if (this.stateMachine.isCurrentState('jumping'))
               {
                   this.stateMachine.setState('idle');
               }
            })
    }

    update(dt: number)
    {
        this.stateMachine.update(dt)
    }

    private idleOnEnter()
    {
        this.sprite.play('idle');
    }
    private idleOnUpdate() 
    {
        if (this.cursors.left.isDown || this.cursorsWASD.left.isDown || this.cursors.right.isDown || this.cursorsWASD.right.isDown)
        {
            this.stateMachine.setState('walking');
        }

        const upKeyJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up);
        const wKeyJustPressed = Phaser.Input.Keyboard.JustDown(this.cursorsWASD.up);
        const downKeyJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.down);
        const sKeyJustPressed = Phaser.Input.Keyboard.JustDown(this.cursorsWASD.down);

        if (upKeyJustPressed || wKeyJustPressed)
        {
            this.stateMachine.setState('jumping');
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) 
        {
            this.stateMachine.setState('attacking');
        }
    }
    private walkingOnEnter()
    {
        this.sprite.play('walking');
    }
    private walkingOnUpdate()
    {
        if (this.cursors.left.isDown || this.cursorsWASD.left.isDown) {
            this.sprite.setVelocityX(-this.movementSpeed);
            this.sprite.flipX = true;
        }
        else if (this.cursors.right.isDown || this.cursorsWASD.right.isDown) {
            this.sprite.setVelocityX(this.movementSpeed);
            this.sprite.flipX = false;
        }
        else {
            this.sprite.setVelocityX(0);
            this.stateMachine.setState('idle');
        }

        const upKeyJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up);
        const wKeyJustPressed = Phaser.Input.Keyboard.JustDown(this.cursorsWASD.up);
       
        if (upKeyJustPressed || wKeyJustPressed)
        {
            this.stateMachine.setState('jumping');
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) 
        {
            this.stateMachine.setState('attacking');
        }
    }
    private jumpingOnEnter()
    {
        this.sprite.play('jumping');
        // if (this.toggleMusic) { this.playerJump.play(); }
        this.sprite.setVelocityY(this.jumpHeight);
    }
    private jumpingOnUpdate() 
    {
        const downKeyJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.down);
        const sKeyJustPressed = Phaser.Input.Keyboard.JustDown(this.cursorsWASD.down);

        if (downKeyJustPressed || sKeyJustPressed)
        {                
            this.sprite.setVelocityY(-this.jumpHeight*0.5);
        }
        
        if (this.cursors.left.isDown || this.cursorsWASD.left.isDown) {
            this.sprite.setVelocityX(-this.movementSpeed);
            this.sprite.flipX = true;
        }
        else if (this.cursors.right.isDown || this.cursorsWASD.right.isDown) {
            this.sprite.setVelocityX(this.movementSpeed);
            this.sprite.flipX = false;
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) 
        {
            this.stateMachine.setState('attacking');
        }
        
    }
    private kickingOnEnter()
    {
        this.sprite.play('kicking');
    }
    private kickingOnUpdate() 
    {

    }
    private punchingOnEnter()
    {
        this.sprite.play('punching');
    }
    private punchingOnUpdate()
    {

    }
    private attackingOnEnter()
    {
        this.sprite.play('attacking');
    }
    private attackingOnUpdate()
    {
        if (this.cursors.left.isDown || this.cursorsWASD.left.isDown ||
            this.cursors.right.isDown || this.cursorsWASD.right.isDown) {
            this.stateMachine.setState('walking');
        }

        const upKeyJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up);
        const wKeyJustPressed = Phaser.Input.Keyboard.JustDown(this.cursorsWASD.up);
       
        if (upKeyJustPressed || wKeyJustPressed)
        {
            this.stateMachine.setState('jumping');
        }
    }

    private createAnimations() 
    {
        // Walk 1 - 8 NinjaCat_walk_01.png
        this.sprite.anims.create({
            key: 'walking',
            frameRate: 10,
            frames: this.sprite.anims.generateFrameNames('ninjacat', {
                start: 1,
                end: 8,
                prefix: 'NinjaCat_walk_0',
                suffix: '.png'
            }),
            repeat: -1
        });
        // Idle 1 - 2 NinjaCat_idle_01.png
        this.sprite.anims.create({
            key: 'idle',
            frameRate: 1,
            frames: this.sprite.anims.generateFrameNames('ninjacat', {
                start: 1,
                end: 2,
                prefix: 'NinjaCat_idle_0',
                suffix: '.png'
            }),
            repeat: -1
        });

        // Jump 1 - 6 NinjaCat_jump_01.png
        this.sprite.anims.create({
            key: 'jumping',
            frameRate: 5,
            frames: this.sprite.anims.generateFrameNames('ninjacat', {
                start: 1,
                end: 6,
                prefix: 'NinjaCat_jump_0',
                suffix: '.png'
            }),
            repeat: -1
        });

        // Attack Kick 1 - 4 NinjaCat_attack_kick_01.png
        this.sprite.anims.create({
            key: 'kicking',
            frameRate: 5,
            frames: this.sprite.anims.generateFrameNames('ninjacat', {
                start: 1,
                end: 4,
                prefix: 'NinjaCat_attack_kick_0',
                suffix: '.png'
            }),
            repeat: -1
        });

        // Attack Punch 1 - 4 NinjaCat_attack_punch_01.png
        this.sprite.anims.create({
            key: 'punching',
            frameRate: 5,
            frames: this.sprite.anims.generateFrameNames('ninjacat', {
                start: 1,
                end: 4,
                prefix: 'NinjaCat_attack_punch_0',
                suffix: '.png'
            }),
            repeat: -1
        });

        // Attack Sword 1 - 4 NinjaCat_attack_sword_01.png
        this.sprite.anims.create({
            key: 'attacking',
            frameRate: 5,
            frames: this.sprite.anims.generateFrameNames('ninjacat', {
                start: 1,
                end: 4,
                prefix: 'NinjaCat_attack_sword_0',
                suffix: '.png'
            }),
            repeat: -1
        });
    }
}