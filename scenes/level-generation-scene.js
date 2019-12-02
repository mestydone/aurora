import CharacterFactory from "../src/characters/character_factory";
import * as LevelGenerator from '../src/utils/level-generator';
import SteeringDriven from '../src/ai/behaviour/steering_driven';
import Wander from '../src/ai/steerings/wander';


let LevelGeneration = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize: function LevelGeneration() {
        Phaser.Scene.call(this, {key: 'LevelGeneration'});
    },
    preload: function () {
        this.characterFactory = new CharacterFactory(this);
        this.generatedLevel = new LevelGenerator.Level(this);
        this.generatedLevel.preload();
    },
    create: function () {
        this.characterFactory.loadAnimations();
        this.hasPlayerReachedStairs = false;
        this.currentRoom = null;
        this.gameObjects = [];

        this.level++;
        this.generatedLevel.generate(96, 96, 16, 10);

        this.physics.world.bounds.width = this.generatedLevel.widthInPixels;
        this.physics.world.bounds.height = this.generatedLevel.heightInPixels;

        // create player
        const startRoom = this.generatedLevel.rooms[0];
        const [x,y] = [(startRoom.x + startRoom.w/2) * 32, (startRoom.y + startRoom.h/2) * 32];
        this.player = this.characterFactory.buildCharacter('aurora', x, y, {player: true});
        this.player.room = startRoom;
        this.currentRoom = startRoom;
        this.physics.add.collider(this.player, this.generatedLevel.worldLayer);
        this.physics.add.collider(this.player, this.generatedLevel.stuffLayer);

        this.generatedLevel.npcs.forEach(npc => {
            this.addNPCtoRoom(npc);
        });

        this.physics.add.collider(this.player, this.gameObjects);
        this.physics.add.collider(this.gameObjects);
        this.physics.add.collider(this.gameObjects, this.generatedLevel.worldLayer);
        this.physics.add.collider(this.gameObjects, this.generatedLevel.stuffLayer);

        this.generatedLevel.stuffLayer.setTileIndexCallback(LevelGenerator.TILES.STAIRS, (object) => {
            if (this.player === object)
            {
                this.generatedLevel.stuffLayer.setTileIndexCallback(LevelGenerator.TILES.STAIRS, null);
                this.hasPlayerReachedStairs = true;
                this.player.body.moves = false;
                const cam = this.cameras.main;
                cam.fade(250, 0, 0, 0);
                cam.once("camerafadeoutcomplete", () => {
                    this.player.destroy();
                    this.scene.restart();
                });
            }
        });

        this.generatedLevel.setRoomEnterCallback((object, room) => {
            if (this.player === object) {
                this.currentRoom = room;
            }
        });

        this.generatedLevel.setRoomLeaveCallback((object) => {
            if (this.player === object) {
                this.currentRoom = null;
            } 
        });

        // camera settings
        const camera = this.cameras.main;
        camera.setBounds(0, 0, this.generatedLevel.widthInPixels, this.generatedLevel.heightInPixels);
        camera.startFollow(this.player);
        camera.setZoom(1);

        // debug graphics
        this.input.keyboard.once("keydown_D", event => {
            this.physics.world.createDebugGraphic();
            const graphics = this.add
                .graphics()
                .setAlpha(0.75)
                .setDepth(20);
        });
    },
    addNPCtoRoom: function(npc)
    {
        const x = npc.x * 32;
        const y = npc.y * 32;
        let wanderer = this.characterFactory.buildCharacter(npc.type == LevelGenerator.NPC.YELLOW ? "yellow" : "blue", x, y, {player: false});
        wanderer.addBehaviour(new SteeringDriven([ new Wander(wanderer) ])) ;
        wanderer.room = npc.room;
        wanderer.isActive = false;
        this.gameObjects.push(wanderer);
        this.physics.add.collider(wanderer, this.worldLayer);
        this.physics.add.collider(wanderer, this.stuffLayer);
    },
    update: function () {
        if (this.gameObjects) {
            this.gameObjects.forEach(e => {
                if (e.isActive || e.room === this.currentRoom) {
                    e.update();
                    e.isActive = true;
                }
            });
        }

        if (this.hasPlayerReachedStairs) return;

        this.player.update();

    },
    tilesToPixels(tileX, tileY) {
        return [tileX*this.tileSize, tileY*this.tileSize];
    }
});

export default LevelGeneration