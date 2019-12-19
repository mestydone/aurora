import EasyStar from "easystarjs";

import tilemapPng from '../assets/tileset/Dungeon_Tileset.png';
import dungeonRoomJson from '../assets/dungeon_room.json';
import CharacterFactory from "../src/characters/character_factory";
import Vector2 from "phaser/src/math/Vector2";

import OffsetPursuit from "../src/ai/steerings/offset_pursuit";
import SteeringDriven from "../src/ai/behaviour/steering_driven";
import  Wander from "../src/ai/steerings/wander";

let SteeringOffsetPursuitScene = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

        function StartingScene() {
            Phaser.Scene.call(this, {key: 'SteeringOffsetPursuitScene'});
        },

    preload: function () {
        //loading map tiles and json with positions
        this.load.image("tiles", tilemapPng);
        this.load.tilemapTiledJSON("map", dungeonRoomJson);
        this.characterFactory = new CharacterFactory(this);
    },
    create: function () {
        this.characterFactory.loadAnimations();

        this.gameObjects = [];
        const map = this.make.tilemap({key: "map"});

        // Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
        // Phaser's cache (i.e. the name you used in preload)
        const tileset = map.addTilesetImage("Dungeon_Tileset", "tiles");

        // Parameters: layer name (or index) from Tiled, tileset, x, y
        const belowLayer = map.createStaticLayer("Floor", tileset, 0, 0);
        const worldLayer = map.createStaticLayer("Walls", tileset, 0, 0);
        const aboveLayer = map.createStaticLayer("Upper", tileset, 0, 0);
        this.tileSize = 32;
        this.finder = new EasyStar.js();
        let grid = [];
        for(let y = 0; y < worldLayer.tilemap.height; y++){
            let col = [];
            for(let x = 0; x < worldLayer.tilemap.width; x++) {
                const tile = worldLayer.tilemap.getTileAt(x, y);
                col.push(tile ? tile.index : 0);
            }
            grid.push(col);
        }

        this.finder.setGrid(grid);
        this.finder.setAcceptableTiles([0]);

        worldLayer.setCollisionBetween(1, 500);
        aboveLayer.setDepth(10);

        this.physics.world.bounds.width = map.widthInPixels;
        this.physics.world.bounds.height = map.heightInPixels;

        this.leader = this.characterFactory.buildCharacter('green', 300, 150, {player: true});
        //this.leader.addBehaviour(new SteeringDriven([ new Wander(this.leader) ])) ;
        this.gameObjects.push(this.leader);
        this.physics.add.collider(this.leader, worldLayer);
        const offset = new Vector2(50, 30);

        // Creating characters
        let neighbors = [];
        let punks = [];
        let x = 200;
        let y = 100;
        for(let i = 0; i < 3; i++) {
            this.punk = this.characterFactory.buildCharacter("punk", x, y, {player: false});
            //this.punk.addBehaviour(new SteeringDriven([new OffsetPursuit(this.punk, this.leader, 1, offset)]));
            this.gameObjects.push(this.punk);
            this.physics.add.collider(this.punk, worldLayer);
            this.physics.add.collider(this.punk, this.leader);
            neighbors.push(this.punk);
            punks.push(this.punk);
            x += 50;
            y += 50;
        }

        // Add OffsetPursuit steering and neighbors
        for(let i = 0; i < punks.length; i++) {
            punks[i].addBehaviour(new SteeringDriven([new OffsetPursuit(this.punk, this.leader, 1, offset, neighbors)]));
        }

        // Add punks collision
        for(let i = 0; i < punks.length; i++) {
            for (let j = 0; j < punks.length; j++) {
                if (i == j) continue;
                this.physics.add.collider(punks[i], punks[j]);
            }
        }

        this.input.keyboard.once("keydown_D", event => {
            // Turn on physics debugging to show player's hitbox
            this.physics.world.createDebugGraphic();

            const graphics = this.add
                .graphics()
                .setAlpha(0.75)
                .setDepth(20);
        });
    },
    update: function () {
        if (this.gameObjects)
        {
            this.gameObjects.forEach( function(element) {
                element.update();
            });
        }

    },
    tilesToPixels(tileX, tileY)
    {
        return [tileX*this.tileSize, tileY*this.tileSize];
    }
});

export default SteeringOffsetPursuitScene