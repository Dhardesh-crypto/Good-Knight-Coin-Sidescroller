import Phaser from 'phaser';
import StateMachine from '../statemachine/StateMachine';
import { sharedInstance as events } from './EventCenter';
import ObstaclesController from './ObstaclesController';

export default class PlayerController
{
    private sprite: Phaser.Physics.Matter.Sprite;
    private stateMachine: StateMachine
    private movementSpeed! : integer; 
    private jumpHeight! : integer;
    private scene: Phaser.Scene;
    private obstacles: ObstaclesController
    private start!: integer;

    constructor(
        sprite: Phaser.Physics.Matter.Sprite, 
        movementSpeed: integer,
        jumpHeight: integer,
        obstacles: ObstaclesController,
        scene: Phaser.Scene) 
    {
        this.sprite = sprite;
        this.movementSpeed = movementSpeed;
        this.jumpHeight = jumpHeight;
        this.obstacles = obstacles;
        this.scene = scene;
        this.createAnimations();
        this.stateMachine = new StateMachine(this, 'monster');

        this.stateMachine
        .addState('idle', {
            onEnter: this.idleOnEnter,
            onUpdate: this.idleOnUpdate
        })
        .addState('walking', {
            onEnter: this.walkingOnEnter,
            onUpdate: this.walkingOnUpdate
        })
        .setState('idle');
    }

    update(dt: number)
    {
        this.stateMachine.update(dt)
    }

    private idleOnEnter() {
        this.sprite.play('idle');
    }
    private idleOnUpdate() {
    }
    private walkingOnEnter() {
        this.sprite.play('walking');
    }
    private walkingOnUpdate() {
        this.sprite.setVelocityX(this.movementSpeed);
    }

    private createAnimations() 
    {
        // Walk 1 - 2 monster02_walk_01.png
        this.sprite.anims.create({
            key: 'walking',
            frameRate: 10,
            frames: this.sprite.anims.generateFrameNames('monster1', {
                start: 1,
                end: 2,
                prefix: 'monster02_walk_0',
                suffix: '.png'
            }),
            repeat: -1
        });
        // Idle 1 - 2 NinjaCat_idle_01.png
        this.sprite.anims.create({
            key: 'idle',
            frameRate: 1,
            frames: this.sprite.anims.generateFrameNames('monster1', {
                start: 1,
                end: 3,
                prefix: 'monster02_idle_0',
                suffix: '.png'
            }),
            repeat: -1
        });




}