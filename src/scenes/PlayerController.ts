import Phaser from 'phaser';
import StateMachine from '../statemachine/StateMachine';
import { sharedInstance as events } from './EventCenter';
import ObstaclesController from './ObstaclesController';

export default class PlayerController
{
    private sprite: Phaser.Physics.Matter.Sprite;
    private stateMachine: StateMachine
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private cursorsWASD: Phaser.Types.Input.Keyboard.CursorKeys;
    private movementSpeed! : integer; 
    private jumpHeight! : integer;
    private scene: Phaser.Scene;
    private pc: object;
    private playerBody:  Phaser.Physics.Matter.Matter.Bodies.rectangle;
    private attackHitbox: Phaser.Physics.Matter.MatterPhysics.Bodies.rectangle;
    private obstacles: ObstaclesController
    private health = 100

    constructor(sprite: Phaser.Physics.Matter.Sprite, 
            cursors: Phaser.Types.Input.Keyboard.CursorKeys, 
            cursorsWASD: Phaser.Types.Input.Keyboard.CursorKeys,
            movementSpeed: integer,
            jumpHeight: integer,
            obstacles: ObstaclesController,
            scene: Phaser.Scene) 
    {
        this.sprite = sprite;
        this.cursors = cursors;
        this.cursorsWASD = cursorsWASD;
        this.movementSpeed = movementSpeed;
        this.jumpHeight = jumpHeight;
        this.obstacles = obstacles;
        this.createAnimations();
        this.stateMachine = new StateMachine(this, 'player');
        this.scene = scene;

        this.setInitialPlayerBodySize(); 
        this.handleMatterCollisions();

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
            .addState('spike-hit', {
                onEnter: this.spikeHitOnEnter
            })
            .setState('idle');

    }

    update(dt: number)
    {
        this.stateMachine.update(dt)
    }

    private setInitialPlayerBodySize() {
        // The player is a collection of bodies and sensors. See "matter platformer with wall jumping"
        // example for more explanation.
        this.pc = {
            matterSprite: this.sprite,
            hitBox: this.attackHitbox,
            blocked: {
                left: false,
                right: false,
                bottom: false
            },
            numTouching: {
                left: 0,
                right: 0,
                bottom: 0
            },
            sensors: {
                bottom: null,
                left: null,
                right: null
            },
            time: {
                leftDown: 0,
                rightDown: 0
            },
            lastJumpedAt: 0,
            speed: {
                run: 5,
                jump: 12
            }
        };

        var M = Phaser.Physics.Matter.Matter;
        var w = this.sprite.width / 4;
        var h = (this.sprite.height /2) - 20;
        var origX = this.sprite.x;
        var origY = this.sprite.y;

        // Move the sensor to player center
        var sx = (w / 2)+20;
        var sy = (h / 2)+15;

        // The player's body is going to be a compound body.
        this.playerBody = M.Bodies.rectangle(sx, sy, w, h, { chamfer: { radius: 10 } });
        this.pc.sensors.bottom = M.Bodies.rectangle(sx, h+15, sx, 5, { isSensor: true });
        this.pc.sensors.left = M.Bodies.rectangle(sx - w * 0.45, sy, 5, h * 0.25, { isSensor: true });
        this.pc.sensors.right = M.Bodies.rectangle(sx + w * 0.45, sy, 5, h * 0.25, { isSensor: true });
        var compoundBody = M.Body.create({
            parts: [
                this.playerBody, this.pc.sensors.bottom, this.pc.sensors.left,
                this.pc.sensors.right
            ],
            restitution: 0.05 // Prevent body from sticking against a wall
        });

        this.pc.matterSprite
            .setExistingBody(compoundBody)
            .setFixedRotation() // Sets max inertia to prevent rotation
            .setPosition(origX, origY);

        // this.attackHitbox = this.scene.matter.add.rectangle(0,0, 32, 64, { isSensor: true } );
    }

    private handleMatterCollisions() {
        // Loop over the active colliding pairs and count the surfaces the player is touching.
        this.scene.matter.world.on('collisionstart', (event) => {
            for (var i = 0; i < event.pairs.length; i++)
            {                
                var bodyA = event.pairs[i].bodyA;
                var bodyB = event.pairs[i].bodyB;

                if ((bodyA === this.playerBody && this.obstacles.is('spikes', bodyB)) ||
                    (bodyB === this.playerBody && this.obstacles.is('spikes', bodyA))
                {
                    this.stateMachine.setState('spike-hit');
                }
                else if (bodyA.gameObject instanceof Phaser.Physics.Matter.Sprite && bodyB.gameObject instanceof Phaser.Physics.Matter.Sprite) {
                    const type = (bodyB.gameObject as Phaser.Physics.Matter.Sprite).getData('type');
                   // console.log(type);
                    switch(type) {
                        case 'star': 
                        {
                            events.emit('star-collected');
                            bodyB.gameObject.destroy();
                            break;
                        }
                        case 'coin': 
                        {
                            events.emit('coin-collected');
                            bodyB.gameObject.destroy();
                            break;
                        }
                        case 'health': 
                        {
                            const healthBonus = (bodyB.gameObject as Phaser.Physics.Matter.Sprite).getData('healthPoints') ?? 30;  
                            this.health = Phaser.Math.Clamp(this.health + healthBonus, 0, 100); 
                            events.emit('health-changed', this.health);
                            bodyB.gameObject.destroy();
                            break;
                        }
                        case 'gem': 
                        {
                            events.emit('gem-collected');
                            bodyB.gameObject.destroy();
                            break;
                        }
                        case 'monster':
                        {
                            events.emit('monster-collected');
                            break;
                        }
                    }
                }
            }
        }, this);

        // Using matter events to detect whether the player is touching a surface to the left, right or
        // bottom.

        // Before matter's update, reset the player's count of what surfaces it is touching.
        this.scene.matter.world.on('beforeupdate', (event) => {
            this.pc.numTouching.left = 0;
            this.pc.numTouching.right = 0;
            this.pc.numTouching.bottom = 0;
        });

        // Loop over the active colliding pairs and count the surfaces the player is touching.
        this.scene.matter.world.on('collisionactive', (event) =>
        {
            var left = this.pc.sensors.left;
            var right = this.pc.sensors.right;
            var bottom = this.pc.sensors.bottom;

            for (var i = 0; i < event.pairs.length; i++)
            {
                var bodyA = event.pairs[i].bodyA;
                var bodyB = event.pairs[i].bodyB;

                if (bodyA === bottom || bodyB === bottom)
                {
                    // Standing on any surface counts (e.g. jumping off of a non-static crate).
                    this.pc.numTouching.bottom += 1;
                }
                else if ((bodyA === left && bodyB.isStatic) || (bodyB === left && bodyA.isStatic))
                {
                    // Only static objects count since we don't want to be blocked by an object that we
                    // can push around.
                    this.pc.numTouching.left += 1;
                }
                else if ((bodyA === right && bodyB.isStatic) || (bodyB === right && bodyA.isStatic))
                {
                    this.pc.numTouching.right += 1;
                }
            }
        });

        // Update over, so now we can determine if any direction is blocked
        this.scene.matter.world.on('afterupdate', (event) => {
            this.pc.blocked.right = this.pc.numTouching.right > 0 ? true : false;
            this.pc.blocked.left = this.pc.numTouching.left > 0 ? true : false;
            this.pc.blocked.bottom = this.pc.numTouching.bottom > 0 ? true : false;
        });

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

        const spaceKeyPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space);
        if (spaceKeyPressed) 
        {
            this.stateMachine.setState('kicking');
        }

        const bKeyPressed = Phaser.Input.Keyboard.JustDown(this.cursorsWASD.shift);
        if (bKeyPressed) 
        {
            this.stateMachine.setState('punching');
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

        const spaceKeyPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space);
        if (spaceKeyPressed) 
        {
            this.stateMachine.setState('kicking');
        }

        const bKeyPressed = Phaser.Input.Keyboard.JustDown(this.cursorsWASD.shift);
        if (bKeyPressed) 
        {
            this.stateMachine.setState('punching');
        }
    }
    private jumpingOnEnter()
    {
        this.sprite.play('jumping');
        // This prevents double jumping right after kicking mid air
        if (this.pc.numTouching.bottom > 0) 
        {
            this.sprite.setVelocityY(this.jumpHeight);
        }
    }
    private jumpingOnUpdate() 
    {
        const downKeyJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.down);
        const sKeyJustPressed = Phaser.Input.Keyboard.JustDown(this.cursorsWASD.down);

        if (downKeyJustPressed || sKeyJustPressed)
        {                
            this.sprite.setVelocityY(-this.jumpHeight*0.5);
        }
        
        if (this.cursors.left.isDown || this.cursorsWASD.left.isDown) 
        {
            this.sprite.setVelocityX(-this.movementSpeed);
            this.sprite.flipX = true;
        }
        else if (this.cursors.right.isDown || this.cursorsWASD.right.isDown) 
        {
            this.sprite.setVelocityX(this.movementSpeed);
            this.sprite.flipX = false;
        }
        
        if (this.pc.numTouching.bottom > 0) 
        {
            this.stateMachine.setState('idle');
        }

        const spaceKeyPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space);
        if (spaceKeyPressed) 
        {
            this.stateMachine.setState('kicking');
        }

        const bKeyPressed = Phaser.Input.Keyboard.JustDown(this.cursorsWASD.shift);
        if (bKeyPressed) 
        {
            this.stateMachine.setState('punching');
        }
    }
    private kickingOnEnter()
    {
        this.sprite.play('kicking');
    }
    private kickingOnUpdate() {
        this.sprite.on('animationcomplete', this.animComplete, this);
    }
    private punchingOnEnter()
    {
        this.sprite.play('punching');
    }
    private punchingOnUpdate() 
    {
        this.sprite.on('animationcomplete', this.animComplete, this);
    }
    private spikeHitOnEnter() 
    {
        // Now color our player red to show damage has been done
        const primaryColor = Phaser.Display.Color.ValueToColor('0xffffff'); // white
        const woundedColor = Phaser.Display.Color.ValueToColor('0xff0000'); // red

        this.scene.tweens.addCounter({
            from: 0,
            to: 100,
            duration: 300,
            ease: Phaser.Math.Easing.Sine.InOut,
            yoyo: true,
            onUpdate: tween => {
                const value = tween.getValue();
                const colorObject = Phaser.Display.Color.Interpolate.ColorWithColor(primaryColor, woundedColor, 100, value);
                const color = Phaser.Display.Color.GetColor(colorObject.r, colorObject.g, colorObject.b);
                this.pc.matterSprite.setTint(color);
            }            
        })
        this.health = Phaser.Math.Clamp(this.health - 10, 0, 100); 
        events.emit('health-changed', this.health);
        this.scene.cameras.main.shake(500, 0.005);
        this.sprite.setVelocityY(-7); // Throw character back 
        this.stateMachine.setState('idle');
    }

    private animComplete(animation, frame)
    {
        if(animation.key === 'kicking')
        {
           this.stateMachine.setState('idle');
        }
        else if(animation.key === 'punching')
        {
           this.stateMachine.setState('idle');
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
            frameRate: 7,
            frames: this.sprite.anims.generateFrameNames('ninjacat', {
                start: 1,
                end: 4,
                prefix: 'NinjaCat_attack_kick_0',
                suffix: '.png'
            }),
            repeat: 0
        });

        // Attack Punch 1 - 4 NinjaCat_attack_punch_01.png
        this.sprite.anims.create({
            key: 'punching',
            frameRate: 7,
            frames: this.sprite.anims.generateFrameNames('ninjacat', {
                start: 1,
                end: 4,
                prefix: 'NinjaCat_attack_punch_0',
                suffix: '.png'
            }),
            repeat: 0
        });
    }

}