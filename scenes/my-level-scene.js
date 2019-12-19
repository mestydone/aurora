import EasyStar from "easystarjs";

import gunPng from '../assets/sprites/gun.png'
import bulletPng from '../assets/sprites/bullet.png'
import cursorCur from '../assets/sprites/cursor.cur'
import tilemapPng from '../assets/tileset/Dungeon_Tileset.png'
import dungeonRoomJson from '../assets/mestydone_map.json'

import UserControlled from '../src/ai/behaviour/user_controlled'
import CharacterFactory from "../src/characters/character_factory";
import GroupAlignment from "../src/ai/steerings/group_alignment";
import SteeringDriven from "../src/ai/behaviour/steering_driven";
import EffectsFactory from "../src/utils/effects_factory";
import Vector2 from 'phaser/src/math/Vector2'



class PlayerWithGun extends Phaser.GameObjects.Container {
    constructor(scene, x, y, characterSpriteName, gunSpriteName) {
      super(scene, x, y)
      this.setSize(31, 31);
      scene.physics.world.enable(this);
      this.body.setCollideWorldBounds(true);
      scene.add.existing(this);
  
      this.character = new Phaser.GameObjects.Sprite(scene, 0, 0, characterSpriteName, 2);
      this.gun = new Phaser.GameObjects.Sprite(scene, 2, 8, gunSpriteName);
  
      this.add(this.character)
      this.add(this.gun)
  
      this.setViewDirectionAngle(0)
  
      this.behaviuors = [];
      this.steerings = [];
      this.hp = 100;
      this.radius = 100;
      this.groupId = 0;
  
      scene.input.on('pointermove', pointer => {
          const x = pointer.x + scene.cameras.main.scrollX;
          const y = pointer.y + scene.cameras.main.scrollY;
          this._onPointerMove(x, y);
        });
    }
  
    _onPointerMove(x, y) {
      this.setViewDirectionAngle(
        Phaser.Math.Angle.Between(
          this.x + this.gun.x,
          this.y + this.gun.y,
          x, y
        )
      )
    }
  
    addBehaviour(behaviour) {
      behaviour.character = this;
      this.behaviuors.push(behaviour);
    }
  
    update() {
      this.behaviuors.forEach(x => x.update());
      this.updateAnimation();
    };
  
    get bulletStartingPoint() {
      const angle = this.viewDirectionAngle;
      const approxGunWidth = this.gun.width - 2;
      const x = this.gun.x + (approxGunWidth * Math.cos(angle));
      const y = this.gun.y + (approxGunWidth * Math.sin(angle));
      return new Vector2(this.x + x, this.y + y);
    }
  
    setViewDirectionAngle(newAngle) {
      this.viewDirectionAngle = newAngle
  
      if(newAngle > 1.56 || newAngle < -1.56) {
        this.gun.setFlip(false, true)
        this.gun.setOrigin(0.4, 0.6)
        this.gun.x = -6
      } else {
        this.gun.setFlip(false, false)
        this.gun.setOrigin(0.4, 0.4)
        this.gun.x = 6
      }
      this.gun.setRotation(newAngle)
    }
  
    updateAnimation() {
      try {
        const animations = this.animationSets.get('WalkWithGun');
        const animsController = this.character.anims;
        const angle = this.viewDirectionAngle
  
        if (angle < 0.78 && angle > -0.78) {
          this.gun.y = 8
          this.bringToTop(this.gun)
          animsController.play(animations[1], true);
        } else if (angle < 2.35 && angle > 0.78) {
          this.gun.y = 8
          this.bringToTop(this.gun)
          animsController.play(animations[3], true);
        } else if (angle < -2.35 || angle > 2.35) {
          this.gun.y = 8
          this.bringToTop(this.gun)
          animsController.play(animations[0], true);
        } else if (angle > -2.35 && angle < -0.78) {
          this.gun.y = -4
          this.bringToTop(this.character)
          animsController.play(animations[2], true);
        } else {
          const currentAnimation = animsController.currentAnim;
          if (currentAnimation) {
            const frame = currentAnimation.getLastFrame();
            this.character.setTexture(frame.textureKey, frame.textureFrame);
          }
        }
      } catch (e) {
        console.error('[PlayerWithGun] updateAnimation failed')
      }
    }
  }
  
  class Bullet extends Phaser.Physics.Arcade.Sprite
  {
      constructor (scene, x, y)
      {
          super(scene, x, y, 'bullet');
      }
  
      fire (x, y, vx, vy)
      {
          this.body.reset(x, y);
          this.body.mass = 3;
  
          this.setActive(true);
          this.setVisible(true);
  
          this.setVelocityX(vx);
          this.setVelocityY(vy);
      }
  
      preUpdate (time, delta)
      {
          super.preUpdate(time, delta);
      }
  }
  
  class Bullets extends Phaser.Physics.Arcade.Group
  {
      constructor (scene)
      {
          super(scene.physics.world, scene);
  
          this.createMultiple({
            frameQuantity: 20,
            key: 'bullet',
            active: false,
            visible: false,
            classType: Bullet
          });
      }
  
      fireBullet(x, y, vx, vy)
      {
          let bullet = this.getFirstDead(false);
  
          if (bullet)
          {
              bullet.fire(x, y, vx, vy);
          }
      }
  }
  
  let MyLevelScene = new Phaser.Class({
      Extends: Phaser.Scene,
      effectsFrameConfig: {frameWidth: 32, frameHeight: 32},
      initialize: function GroupAligmentScene() {
          Phaser.Scene.call(this, {key: 'SlimeRushScene'});
      },
      preload: function () {
          //loading map tiles and json with positions
          this.load.image("tiles", tilemapPng);
          this.load.tilemapTiledJSON("map", dungeonRoomJson);
          this.characterFactory = new CharacterFactory(this);
          this.effectsFactory = new EffectsFactory(this);
  
          this.load.image("gun", gunPng);
          this.load.image("bullet", bulletPng);
      },
      create: function () {
          this.input.setDefaultCursor(`url(${cursorCur}), pointer`);
          this.characterFactory.loadAnimations();
          this.effectsFactory.loadAnimations();
          this.gameObjects = [];
          const map = this.make.tilemap({key: "map"});
  
          // Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
          // Phaser's cache (i.e. the name you used in preload)
          const tileset = map.addTilesetImage("Dungeon_Tileset", "tiles");
  
  
          // Parameters: layer name (or index) from Tiled, tileset, x, y
          const backgroundLayer = map.createStaticLayer("background", tileset, 0, 0);
          const floorLayer = map.createStaticLayer("floor", tileset, 0, 0);
          const worldLayer = map.createStaticLayer("world", tileset, 0, 0);
          const worlAbovedLayer = map.createStaticLayer("world_above", tileset, 0, 0);
          const decorationLayer = map.createStaticLayer("decoration", tileset, 0, 0);
  
          worldLayer.setCollisionBetween(1, 500);
          worlAbovedLayer.setDepth(10);
  
          this.physics.world.bounds.width = map.widthInPixels;
          this.physics.world.bounds.height = map.heightInPixels;
  
          // Player
          this.playerWithGun = new PlayerWithGun(this, 380, 260, 'aurora', 'gun')
          this.playerWithGun.animationSets = this.characterFactory.animationLibrary.get('aurora');
  
          const wasdCursorKeys = this.input.keyboard.addKeys({
            up:Phaser.Input.Keyboard.KeyCodes.W,
            down:Phaser.Input.Keyboard.KeyCodes.S,
            left:Phaser.Input.Keyboard.KeyCodes.A,
            right:Phaser.Input.Keyboard.KeyCodes.D
          });
  
          this.playerWithGun.addBehaviour(new UserControlled(150, wasdCursorKeys));
          this.gameObjects.push(this.playerWithGun);
          this.physics.add.collider(this.playerWithGun, worldLayer);
  
          // Bullets handling
          this.bullets = new Bullets(this);
          this.physics.add.collider(this.bullets, worldLayer, (bullet) => {
            bullet.setVisible(false);
            bullet.setActive(false);
          });
  
          this.input.on('pointerdown', (pointer) => {
            const {x, y} = this.playerWithGun.bulletStartingPoint
  
            const vx = pointer.x + this.cameras.main.scrollX - x
            const vy = pointer.y + this.cameras.main.scrollY - y
  
            const BULLET_SPEED = 400
            const mult = BULLET_SPEED / Math.sqrt(vx*vx + vy*vy)
  
            this.bullets.fireBullet(x, y, vx * mult, vy * mult);
          });
  
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
  
          this.physics.world.bounds.width = map.widthInPixels;
          this.physics.world.bounds.height = map.heightInPixels;
  
          this.slimes =  this.physics.add.group();
          let params = {};
          for(let i = 0; i < 14; i++) {
              const x = Phaser.Math.RND.between(50, this.physics.world.bounds.width - 50 );
              const y = Phaser.Math.RND.between(50, this.physics.world.bounds.height -50 );
              params.slimeType = Phaser.Math.RND.between(0, 4);
              const slime = this.characterFactory.buildSlime(x, y, params);
              this.slimes.add(slime);
              this.physics.add.collider(slime, worldLayer);
              this.gameObjects.push(slime);
          }
          this.physics.add.collider(this.playerWithGun, this.slimes);
  
          // Slime damage
          this.physics.add.collider(this.bullets, this.slimes, (bullet, slime) => {
            if (bullet.active) { /* very important */
              slime.damage()
              bullet.setActive(false)
              bullet.setVisible(false)
            }
          });

          const camera = this.cameras.main;
          camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
          camera.startFollow(this.playerWithGun);
      },
      update: function () {
          if (this.gameObjects) {
            this.gameObjects.forEach( function(element) {
                element.update();
            });
          }
      },
      tilesToPixels(tileX, tileY) {
          return [tileX*this.tileSize, tileY*this.tileSize];
      }
  });
  
export default MyLevelScene