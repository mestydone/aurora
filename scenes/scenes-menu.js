import tilemapPng from '../assets/tileset/Dungeon_Tileset.png'
import menuBackgroundJson from '../assets/menu_background.json'

import StartingScene from '../scenes/starting-scene';
import SteeringWanderScene from '../scenes/steering-wander-scene';
import SteeringEvadeScene from '../scenes/steering-evade-scene';
import SteeringEvadeVsPursuitScene from '../scenes/steering-evade-vs-pursuit';
import GroupAlignmentScene from '../scenes/group-alignment-scene';
import SteeringSeekScene from '../scenes/steering-seek-scene';
import SteeringFleeScene from '../scenes/steering-flee-scene';
import ProceduralScene from '../scenes/procedural-scene';
import EffectsScene from "../scenes/effects-scene";
import SteeringInterposeScene from '../scenes/steering-interpose-scene';
import GroupSeparationScene from '../scenes/group-separation-scene';
import SteeringPathFollowingScene from '../scenes/steering-path-following-scene';
import TrapsTilesScene from '../scenes/traps-tiles-scene';
import EndlessAdventureScene from '../scenes/endless-adventure-scene';
import SteeringOffsetPursuitScene from '../scenes/steering-offset-pursuit-scene';
import SlimeRushScene from '../scenes/slime-rush-scene';

const scenes = [
    [ 'StartingScene', StartingScene ],
    [ 'SlimeRushScene', SlimeRushScene],
    [ 'GroupAlignmentScene', GroupAlignmentScene ],
    [ 'SteeringWanderScene', SteeringWanderScene ],
    [ 'SteeringEvadeScene', SteeringEvadeScene ],
    [ 'SteeringEvadeVsPursuitScene', SteeringEvadeVsPursuitScene ],
    [ 'SteeringSeekScene', SteeringSeekScene ],
    [ 'SteeringFleeScene', SteeringFleeScene ],
    [ 'ProceduralScene', ProceduralScene ],
    [ 'EffectsScene', EffectsScene],
    [ 'SteeringInterposeScene', SteeringInterposeScene],
    [ 'GroupSeparationScene', GroupSeparationScene],
    [ 'SteeringPathFollowingScene', SteeringPathFollowingScene],
    [ 'TrapsTilesScene', TrapsTilesScene],
    [ 'SteeringOffsetPursuitScene', SteeringOffsetPursuitScene],
    [ 'SlimeRushScene', SlimeRushScene],
    [ 'EndlessAdventureScene', EndlessAdventureScene]
];




let MenuScene = new Phaser.Class({
    Extends: Phaser.Scene,
    scenesButtons: [],
    _runningScene: null,

    initialize: function MenuScene() {
        Phaser.Scene.call(this, {key: 'MenuScene'});
        this._scroll = 0;
    },

    preload: function () {
        scenes.forEach(s => {
            this.scene.add(s[0], s[1], false);
        });

        //loading map tiles and json with positions
        this.load.image('tiles', tilemapPng);
        this.load.tilemapTiledJSON('menu_map', menuBackgroundJson);
    },

    create: function () {
        const map = this.make.tilemap({key: 'menu_map'});
        const tileset = map.addTilesetImage('Dungeon_Tileset', 'tiles');
        map.createStaticLayer('Main', tileset, 0, 0);


        this.add.text(32 * 7 - 4, 32 * 2 + 4, 'SCENES', {fill: '#FFF', fontSize : 28})
            .setShadow(2,2,'#000', true);

        // creating list of buttons
        let k = 0;
        this.scenesButtons = scenes.map(s => {
            return this.add.text(0, k++ * 32, s[0], {fill: '#AAA'})
                .setInteractive()
                .setFixedSize(32 * 10, 32)
                .setPadding({ top: 8 })
                .setShadow(1,1,'#000')
                .on('pointerdown', () => this.actionOnClick(s[0]));
        });

        this.input.keyboard.on("keydown_ESC", event => {
            if (this._runningScene !== null) {
                this.scene.pause(this._runningScene);
                this.scene.stop(this._runningScene);
                this._runningScene = null;
            }
        });


        // Scrolling container
        const mask = this.add.graphics(0, 0).fillRect(32*7, 32*3, 32*10, 32*12);
        this.add.container(32*7, 32*3,this.scenesButtons)
            .setMask(new Phaser.Display.Masks.GeometryMask(this, mask));

        this.input.on('wheel', (pointer, currentlyOver, dx, dy, dz, event) => {
            if (this._runningScene !== null
                || this._scroll <= 0 && dy < 0
                || this._scroll >= (this.scenesButtons.length - 12) * 32 && dy > 0) return;

                this.scenesButtons.forEach(e => e.y -= Math.floor(dy/5));
                this._scroll += Math.floor(dy/5);
        });
    },

    update: function () {
        if (this._runningScene == null) {
            this.scenesButtons.forEach(e => {
                const [x, y] = [this.input.x, this.input.y]
                if (e.input.hitArea.contains(x-e.x - 32*7,y-e.y - 32*3)) {
                    e.setFill('#FFF')
                } else {
                    e.setFill('#AAA')
                }
            });
        }
    },

    actionOnClick: function (sceneName) {
        if (this._runningScene == null) {
            this._runningScene = sceneName;
            this.scene.run(sceneName);

            const hint = new Hint(32, 32, 'Press ESC to return', 2000);

            try {
                this.scene.add('HintScene_' + hint.index, hint, true);
            } catch (error) { /* Error: Cannot add a Scene with duplicate key */ }
        }
    },
});

class Hint extends Phaser.Scene {
    constructor(x = 0, y = 0, text = '', time = 2000) {
        super();
        this.pos = {x, y};
        this.text = text;
        this.ttl = time; // in milliseconds

        //this._drawingText
        this._index = Phaser.Math.RND.integer();
    }

    get index() {
        return this._index;
    }

    preload() {
        this._startTime = this.time.now;
    }

    create() {
        const pos = this.pos;
        this._drawingText = this.add.text(
            pos.x, pos.y,
            this.text, 
            { 
                fill: '#fff',
                backgroundColor: '#333',
                padding: {
                    x : 8,
                    y : 8
                },
                alpha : 0
            }
        );

        this.tweens.add({
            targets: this._drawingText,
            alpha: {from : 0, to : 1},
            y: '+=4',
            ease: 'Linear',
            duration: 200,
            repeat: 0
        });    

        this.tweens.add({
            targets: this._drawingText,
            alpha: {from : 1, to : 0},
            ease: 'Linear',
            y: '+=4',
            delay: this.ttl - 400,
            duration: 200,
            repeat: 0
        });    
    }

    update(time) {
        if (time > this._startTime + this.ttl) {
            this.scene.remove(this);
        }
    }
}

export default MenuScene
