import {StateTableRow, StateTable} from '../ai/behaviour/state';
import Slime from "./slime";
import Human from "./human";
import cyberpunkConfigJson from "../../assets/animations/cyberpunk.json";
import slimeConfigJson from "../../assets/animations/slime.json";
import AnimationLoader from "../utils/animation-loader";
import UserControlled from '../ai/behaviour/user_controlled'
import auroraSpriteSheet from '../../assets/sprites/characters/aurora.png'
import punkSpriteSheet from '../../assets/sprites/characters/punk.png'
import blueSpriteSheet from '../../assets/sprites/characters/blue.png'
import yellowSpriteSheet from '../../assets/sprites/characters/yellow.png'
import greenSpriteSheet from '../../assets/sprites/characters/green.png'
import slimeSpriteSheet from '../../assets/sprites/characters/slime.png'
import Footsteps from "../../assets/audio/footstep_ice_crunchy_run_01.wav";
import SteeringDriven from "../../src/ai/behaviour/steering_driven";


export default class CharacterFactory {

    constructor(scene) {
        const characterFrameConfig = {frameWidth: 31, frameHeight: 31};
        const slimeFrameConfig = {frameWidth: 32, frameHeight: 32};
        this.scene = scene;

        this.cyberSpritesheets =  ['aurora', 'blue', 'yellow', 'green', 'punk'];
        this.slimeSpriteSheet = 'slime';
        //loading spitesheets
        scene.load.spritesheet('aurora', auroraSpriteSheet, characterFrameConfig);
        scene.load.spritesheet('blue', blueSpriteSheet, characterFrameConfig);
        scene.load.spritesheet('green', greenSpriteSheet, characterFrameConfig);
        scene.load.spritesheet('yellow', yellowSpriteSheet, characterFrameConfig);
        scene.load.spritesheet('punk', punkSpriteSheet, characterFrameConfig);
        scene.load.spritesheet('slime', slimeSpriteSheet, slimeFrameConfig);
        scene.load.audio('footsteps', Footsteps);

        // const slimeStateTable = new StateTable(this);
        // slimeStateTable.addState(new StateTableRow('searching', this.foundTarget, 'jumping'));
        // slimeStateTable.addState(new StateTableRow('jumping', this.lostTarget, 'searching'));
    }

    loadAnimations()
    {
        let animationLibrary =  new Map();
        let scene = this.scene;
        this.cyberSpritesheets.forEach(
            function (element) {
                animationLibrary.set(element, new AnimationLoader(scene,
                    element,
                    cyberpunkConfigJson,
                    element).createAnimations());
            }
        );
        animationLibrary.set(this.slimeSpriteSheet,
            new AnimationLoader(scene, this.slimeSpriteSheet, slimeConfigJson, this.slimeSpriteSheet).createAnimations());
        this.animationLibrary = animationLibrary;
    }
    buildCharacter(spriteSheetName, x, y, params = {}) {
        switch (spriteSheetName) {
            case 'aurora':
            case 'blue':
            case 'punk':
            case 'yellow':
            case 'green':
                if (params.player)
                    return this.buildPlayerCharacter(spriteSheetName, x, y);
                else
                    return this.buildCyberpunkCharacter(spriteSheetName, x, y, params);
            case "slime":
                return this.buildSlime(x, y, params);
        }
    }

    buildPlayerCharacter(spriteSheetName, x, y) {

        let character = new Human(this.scene, x, y, spriteSheetName, 2);
        character.animationSets = this.animationLibrary.get(spriteSheetName);
        character.addBehaviour(new UserControlled(300, this.scene.input.keyboard.createCursorKeys()));

        //todo: not here
        character.footstepsMusic = this.scene.sound.add('footsteps', {
          mute: false,
          volume: 1,
          rate: 1,
          detune: 0,
          seek: 0,
          loop: true,
          delay: 0
      });
      //todo uncomment at your won risk - these footsteps will get you insane
     // character.footstepsMusic.play();
        return character;

    }

    buildCyberpunkCharacter(spriteSheetName, x, y, params) {
        let human = new Human(this.scene, x, y, spriteSheetName, 2);
        human.setCollideWorldBounds(true);
        human.animationSets = this.animationLibrary.get(spriteSheetName);
        human.speed = 40;
        return human;
    }   

    buildSteeringDrivenHuman(spriteSheetName, x, y, steerings)
    {
        let human = this.buildCyberpunkCharacter(spriteSheetName, x, y, {});
        human.addBehaviour(new SteeringDriven(steerings));
        return human;
    }
    buildSlime(x, y, params) {
        const slimeType = params.slimeType || 1;
        let slime = new Slime(this.scene, x, y, this.slimeSpriteSheet, 9 * slimeType);
        slime.animations = this.animationLibrary.get(this.slimeSpriteSheet).get(this.slimeNumberToName(slimeType));
        slime.setCollideWorldBounds(true);
        slime.speed = 20;
        return slime;
    }
    slimeNumberToName(n)
    {
        switch (n) {
            case 0: return 'Blue';
            case 1: return 'Green';
            case 2: return 'Orange';
            case 3: return 'Pink';
            case 4: return 'Violet';
        }
    }
}