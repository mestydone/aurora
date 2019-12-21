import gunPng from '../assets/sprites/gun.png';
import ammoPng from '../assets/sprites/ammo.png';
import bulletPng from '../assets/sprites/bullet.png';
import stairsPng from '../assets/sprites/stairs.png';
import leverLeftPng from '../assets/sprites/lever_l.png';
import leverRigthPng from '../assets/sprites/lever_r.png';
import trapsOpenPng from '../assets/sprites/traps_open.png';
import trapsClosedPng from '../assets/sprites/traps_closed.png';

import SoundShot from "../assets/audio/shot.mp3";
import SoundEmtyGun from "../assets/audio/empty_gun.mp3";
import SoundReload from "../assets/audio/reload.mp3";
import SoundPortal from "../assets/audio/portal.wav";
import SoundDie from "../assets/audio/die.wav";
import SoundHit from "../assets/audio/hit.wav";
import SoundTrapsClosing from "../assets/audio/traps_closing.wav";

import cursorCur from '../assets/sprites/cursor.cur';
import tilemapPng from '../assets/tileset/Dungeon_Tileset.png';
import dungeonRoomJson from '../assets/mestydone_map.json';

import UserControlled from '../src/ai/behaviour/user_controlled';
import CharacterFactory from "../src/characters/character_factory";
import GroupAlignment from "../src/ai/steerings/group_alignment";
import SteeringDriven from "../src/ai/behaviour/steering_driven";
import EffectsFactory from "../src/utils/effects_factory";
import Vector2 from 'phaser/src/math/Vector2';

import Wander from '../src/ai/steerings/wander'
import Flee from '../src/ai/steerings/flee';
import Seek from '../src/ai/steerings/seek';
import GroupSeparation from '../src/ai/steerings/group_separation';


class PlayerWithGun extends Phaser.GameObjects.Container {
  constructor(scene, x, y, characterSpriteName, gunSpriteName) {
    super(scene, x, y)
    this.setSize(31, 31);
    scene.physics.world.enable(this);
    this.body.setCollideWorldBounds(true);
    scene.add.existing(this);
    this.setDepth(3)

    this.character = scene.characterFactory.buildCharacter('aurora', 0, 0, { player: true });
    this.gun = new Phaser.GameObjects.Sprite(scene, 2, 8, gunSpriteName);

    this.add(this.character)
    this.add(this.gun)

    this.setViewDirectionAngle(0)

    this.behaviuors = [];
    this.steerings = [];
    this.hp = 30;
    this.ammo = 0;
    this.radius = 100;
    this.groupId = 0;
    this.isAlive = true;

    this.phrases = {
      needAmmo: {
        hasSaid: false,
        text: 'Нужно найти патроны'
      },
      hatePortal: {
        hasSaid: false,
        text: 'Ненавижу порталы...'
      }
    }

    scene.input.on('pointermove', pointer => {
      const x = pointer.x + scene.cameras.main.scrollX;
      const y = pointer.y + scene.cameras.main.scrollY;
      this._onPointerMove(x, y);
    });
  }

  hit(damage) {
    this.hp -= damage;
    if (this.hp <= 0) {
      this.isAlive = false;
    }

    if (this.hp < 0) this.hp = 0
  }

  _onPointerMove(x, y) {
    if (!this.isAlive) return;

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
    if (this.isAlive) {
      this.behaviuors.forEach(x => x.update());
      this.updateAnimation();
    }
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

    if (newAngle > 1.56 || newAngle < -1.56) {
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

class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'bullet');
    this.setDepth(3);
  }

  fire(x, y, vx, vy) {
    this.body.reset(x, y);
    this.body.mass = 3;

    this.setActive(true);
    this.setVisible(true);

    this.setVelocityX(vx);
    this.setVelocityY(vy);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
  }
}

class Bullets extends Phaser.Physics.Arcade.Group {
  constructor(scene) {
    super(scene.physics.world, scene);
    this.createMultiple({
      frameQuantity: 20,
      key: 'bullet',
      active: false,
      visible: false,
      classType: Bullet
    });
  }

  fireBullet(x, y, vx, vy) {
    let bullet = this.getFirstDead(false);

    if (bullet) {
      bullet.fire(x, y, vx, vy);
    }
  }
}

class Ammo extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, count) {
    super(scene, x, y, 'ammo');
    scene.physics.world.enable(this);
    scene.add.existing(this);
    this.count = count;
    this.setDepth(0);
    this.setImmovable(true);
  }

  take() {
    this.destroy();
    return this.count;
  }
}

class Portal extends Phaser.GameObjects.Container {
  constructor(scene, x, y, destX, destY) {
    super(scene, x, y);
    this.setSize(48, 48)
    scene.physics.world.enable(this);
    scene.add.existing(this);

    this.destination = { x: destX, y: destY };
    this._fx = scene.effectsFactory.buildEffect('nebula', x, y);
    this._fx.setDepth(3);
  }


  teleport(gameObject, camera, callback) {
    camera.flash(1500, 180, 180, 200, false);
    gameObject.setPosition(this.destination.x, this.destination.y);
    camera.once("cameraflashcomplete", () => {
        if (callback) callback();
    });
    
    this.destroy();
    this._fx.destroy();
  }
  
}

class Healer extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    this.setSize(48, 48)
    scene.physics.world.enable(this);
    scene.add.existing(this);
    this._fx = scene.effectsFactory.buildEffect('vortex', x, y);
    this._fx.setDepth(3);

    this._health = 50;
  }

  heal() {
    if (this._health-- > 0) {
      return 1;
    } else {
      this.destroy();
      this._fx.destroy();
      return 0;
    }
  }

}

class Lever extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'lever_l');
    scene.physics.world.enable(this);
    scene.add.existing(this);
    this.enable = false
  }

  switch() {
    this.enable = !this.enable;
    this.setTexture(this.enable ? "lever_r" : "lever_l");
  }
}

class Trap extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y + 48, "traps_open");
    scene.physics.world.enable(this);
    scene.add.existing(this);
    this.setImmovable(true);

    this.enable = true
  }

  switch() {
    this.setTexture(this.enable ? "traps_closed" : "traps_open");
    this.enable = !this.enable;
    this.body.enable = this.enable
  }
}

class HudScene extends Phaser.Scene {
  constructor(player) {
    super()
    this.player = player;
    
    this.elements = { };
    this.texts = [];
    this._time = 0;
  }

  create() {
      this.elements.health = this.add.text(64, this.scale.height - 96, '');
      this.elements.health.setFontSize(30);
      this.elements.health.setFill('#FFF');
      this.elements.health.setScrollFactor(0);

      this.elements.ammo = this.add.text(64, this.scale.height - 48, '');
      this.elements.ammo.setFontSize(30);
      this.elements.ammo.setFill('#FFF');
      this.elements.ammo.setScrollFactor(0);
  }

  update(time, delta) {
    this._time = time;

    this.elements.health.text = "❤️ " + this.player.hp;        
    this.elements.ammo.text = "💥 " + this.player.ammo;

    this.texts.forEach(t => {
      if (time - t.creatingTime > t.ttl) {
        t.object.destroy();
      } else {
        const pos = t.position();
        t.object.setPosition(pos.x, pos.y);
      }
    });

    this.texts = this.texts.filter(t => time - t.creatingTime <= t.ttl);
  }


  showDieMessage() {
    const x = this.scale.width / 2 - 196
    const y = this.scale.height / 2 - 32

    const text = this.add.text(x, y, 'ВЫ ПОГИБЛИ');
    text.setFontSize(72);
    text.setFill('#FFF');
    text.setScrollFactor(0);
  }

  showText(text, duration, follow , camera, offset, tag) {
    const getPos = () => {
      return {
        x: follow.body.x - camera.scrollX + offset.x,
        y: follow.body.y - camera.scrollY + offset.y
      };
    };

    const pos = getPos();
    
    const textObj = this.add.text(pos.x, pos.y, text);
    textObj.setFontSize(18);
    textObj.setFill('#FFF');
    textObj.setScrollFactor(0);
    
    if (tag) {
      this.texts.forEach(t => {
        if (t.tag !== undefined && t.tag === tag) 
          t.object.destroy();
      });
      this.texts = this.texts.filter(t => t.tag === undefined || t.tag != tag);
    }

    this.texts.push(
      {
        object: textObj,
        ttl: duration,
        creatingTime: this._time,
        position: getPos,
        tag: tag
      }
    );
  }


}



let MyLevelScene = new Phaser.Class({
  Extends: Phaser.Scene,
  effectsFrameConfig: { frameWidth: 32, frameHeight: 32 },

  initialize: function GroupAligmentScene() {
    Phaser.Scene.call(this, { key: 'MyLevelScene' });
  },

  preload: function () {
    //loading map tiles and json with positions
    this.load.image("tiles", tilemapPng);
    this.load.tilemapTiledJSON("map", dungeonRoomJson);
    this.characterFactory = new CharacterFactory(this);
    this.effectsFactory = new EffectsFactory(this);

    this.load.image("gun", gunPng);
    this.load.image("bullet", bulletPng);
    this.load.image("ammo", ammoPng);
    this.load.image('stairs', stairsPng)
    this.load.image("lever_l", leverLeftPng);
    this.load.image("lever_r", leverRigthPng);
    this.load.image("traps_open", trapsOpenPng);
    this.load.image("traps_closed", trapsClosedPng);

    this.load.audio("shot", SoundShot);
    this.load.audio("empty_gun", SoundEmtyGun);
    this.load.audio("reload", SoundReload);
    this.load.audio("portal", SoundPortal);
    this.load.audio("die", SoundDie);
    this.load.audio("hit", SoundHit);
    this.load.audio("traps_closing", SoundTrapsClosing);

  },

  create: function () {
    this.playerDead = false

    this.input.setDefaultCursor(`url(${cursorCur}), pointer`);
    this.characterFactory.loadAnimations();
    this.effectsFactory.loadAnimations();
    this.gameObjects = [];
    const map = this.make.tilemap({ key: "map" });


    this.soundboard = {
      shot: this.sound.add('shot', {
        mute: false,
        volume: 0.7
      }),
      emptyGun: this.sound.add('empty_gun', {
        mute: false,
        volume: 1,
      }),
      reload: this.sound.add('reload', {
        mute: false,
        volume: 1,
      }),
      portal: this.sound.add('portal', {
        mute: false,
        volume: 1,
      }),
      die: this.sound.add('die', {
        mute: false,
        volume: 1,
      }),
      hit: this.sound.add('hit', {
        mute: false,
        volume: 1,
      }),
      trapsClosing: this.sound.add('traps_closing', {
        mute: false,
        volume: 1,
      }),
    };

    // Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
    // Phaser's cache (i.e. the name you used in preload)
    const tileset = map.addTilesetImage("Dungeon_Tileset", "tiles");

    // Parameters: layer name (or index) from Tiled, tileset, x, y
    const backgroundLayer = map.createStaticLayer("background", tileset, 0, 0);
    const floorLayer = map.createStaticLayer("floor", tileset, 0, 0);
    const worldLayer = map.createStaticLayer("world", tileset, 0, 0);
    const worlAboveLayer = map.createStaticLayer("world_above", tileset, 0, 0);
    const decorationLayer = map.createStaticLayer("decoration", tileset, 0, 0);

    worldLayer.setCollisionBetween(1, 500);
    worlAboveLayer.setDepth(10);

    this.physics.world.bounds.width = map.widthInPixels;
    this.physics.world.bounds.height = map.heightInPixels;

    // Player
    this.playerWithGun = new PlayerWithGun(this, 32 * 48, 32 * 58, 'aurora', 'gun');
    this.playerWithGun.animationSets = this.characterFactory.animationLibrary.get('aurora');
    
    const wasdCursorKeys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
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
      if (!this.playerWithGun.isAlive) return;
      
      if (this.playerWithGun.ammo > 0) {
        const { x, y } = this.playerWithGun.bulletStartingPoint

        const vx = pointer.x + this.cameras.main.scrollX - x
        const vy = pointer.y + this.cameras.main.scrollY - y
  
        const BULLET_SPEED = 600
        const mult = BULLET_SPEED / Math.sqrt(vx * vx + vy * vy)
  
        this.bullets.fireBullet(x, y, vx * mult, vy * mult);
        this.playerWithGun.ammo--;
        this.soundboard.shot.play();
      } else {
        const phrases = this.playerWithGun.phrases;
        if (!phrases.needAmmo.hasSaid) {
          phrases.needAmmo.hasSaid = true;
          this.hud.showText(
            phrases.needAmmo.text, 
            2000, 
            this.playerWithGun, 
            this.cameras.main, 
            { x: -85, y: -48 },
            'aurora'
          );
        }
        this.soundboard.emptyGun.play();
      }
    });

    this.physics.world.bounds.width = map.widthInPixels;
    this.physics.world.bounds.height = map.heightInPixels;

    // Create HUD
    this.hud = new HudScene(this.playerWithGun);

    // Generate slimes
    this.slimes = this.physics.add.group();
    let params = {};
    map.createFromObjects("interactive", "slimeSpawn", { visible: false }).forEach(spawn => {
      const prob = spawn.data.list[0].value
      if (Phaser.Math.RND.frac() < prob) {
        params.slimeType = Phaser.Math.RND.between(0, 4);
        const slime = this.characterFactory.buildSlime(spawn.x, spawn.y, params);
        slime.addBehaviour(new SteeringDriven([
          new Wander(slime, 0.3),
          new Seek(slime, this.playerWithGun, 1, 70, 300),
          new GroupSeparation(slime, this.slimes.getChildren(), 1, 24)
        ]));
        
        this.slimes.add(slime);
        this.physics.add.collider(slime, worldLayer);
        this.gameObjects.push(slime);
      }
    });

    this.physics.add.overlap(this.playerWithGun, this.slimes, (p, s) => {
      if (s.readyToAttack) {
        p.hit(s.attack());
        this.hud.showText(
          "Ай!", 
          1000, 
          this.playerWithGun, 
          this.cameras.main, 
          { x: 0, y: -48 },
          'aurora'
        );

        if (p.hp > 0) { 
          this.soundboard.hit.play();
        }
      }
    });


    this.physics.add.collider(this.playerWithGun, this.slimes);

    // Slime damage
    this.physics.add.collider(this.bullets, this.slimes, (bullet, slime) => {
      if (bullet.active) { /* very important */
        const damage = Phaser.Math.RND.between(30, 70);
        slime.hit(damage)
        bullet.setActive(false)
        bullet.setVisible(false)
        this.hud.showText(
          '-' + damage + 'hp', 
          800, 
          slime, 
          this.cameras.main, 
          { x: -8, y: -24 },
          'slime'
        );
      }
    });

    // Generate ammo 
    map.createFromObjects("interactive", "ammo", { visible: false }).forEach(ammoObj => {
      const props = ammoObj.data.list;
      if (Phaser.Math.RND.frac() < props[2].value) { // [2] - probability
        const ammo = new Ammo(
          this, ammoObj.x, ammoObj.y, Phaser.Math.RND.between(props[1].value, props[0].value)); // min - max

        this.gameObjects.push(ammo);
        this.physics.add.overlap(this.playerWithGun, ammo, (p, a) => {
          const count = a.take();
          p.ammo += count;
          this.hud.showText(
            "Патроны +" + count, 
            2000, 
            this.playerWithGun, 
            this.cameras.main, 
            { x: -40, y: -48 },
            'aurora'
          );
          this.soundboard.reload.play();
        });
      }
    });


    // Generate portals
    map.createFromObjects("interactive", "portal", { visible: false }).forEach(portalObj => {
      const props = portalObj.data.list;
      const portal = new Portal(this, portalObj.x, portalObj.y, props[0].value * 32, props[1].value * 32);
      this.gameObjects.push(portal);

      this.physics.add.overlap(this.playerWithGun, portal, (p, port) => {
        this.soundboard.portal.play();
        port.teleport(p, this.hud.cameras.main, () => {
          const phrases = this.playerWithGun.phrases;
          if (!phrases.hatePortal.hasSaid) {
            phrases.hatePortal.hasSaid = true;
            this.hud.showText(
              phrases.hatePortal.text, 
              2000, 
              this.playerWithGun, 
              this.cameras.main, 
              { x: -96, y: -48 },
              'aurora'
            );
          }
        });
      });
    });


    // Generate healers
    map.createFromObjects("interactive", "heal", { visible: false }).forEach(healerObj => {
      const props = healerObj.data.list;
      if (Phaser.Math.RND.frac() < props[0].value) {
        const healer = new Healer(this, healerObj.x, healerObj.y)
        this.gameObjects.push(healer);

        this.physics.add.overlap(this.playerWithGun, healer, (p, h) => {
          if (p.hp < 100) {
            p.hp += h.heal();

            if (p.hp % 10 == 0) { 
              this.hud.showText(
                'Лечение: ' + p.hp + "hp", 
                600, 
                this.playerWithGun, 
                this.cameras.main, 
                { x: -48, y: -48 },
                'aurora'
              );
            }
          }
        });
      }
    });

    // Add traps
    this.traps = []
    map.createFromObjects("interactive", "traps", { visible: false }).forEach(trapObj => {
      const trap = new Trap(this, trapObj.x, trapObj.y)
      this.gameObjects.push(trap);
      this.traps.push(trap);
      this.physics.add.collider(this.playerWithGun, trap);
      this.physics.add.collider(this.slimes, trap);
    });

    // Add lever
    const lever = new Lever(this, 32 * 90, 32 * 7);
    this.gameObjects.push(lever);
    this.physics.add.overlap(this.playerWithGun, lever, (p, l) => {
      if (!l.enable) {
        l.switch();
        this.traps.forEach(t => t.switch());
        this.soundboard.trapsClosing.play();
      }
    });

    // Add stairs and collision event
    const stairs = this.add.sprite(88 * 32 + 16, 89 * 32 + 16, 'stairs');
    this.physics.world.enable(stairs);
    this.gameObjects.push(stairs);
    this.physics.add.overlap(this.playerWithGun, stairs, (p, s) => {
      p.body.moves = false;
      s.setActive(false);
      const cam = this.hud.cameras.main;
      cam.fade(500, 0, 0, 0);
      cam.once("camerafadeoutcomplete", () => {
          this.scene.remove(this.hud);
          this.scene.restart();
      });
    });


    // Camera following
    const camera = this.cameras.main;
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    camera.startFollow(this.playerWithGun);

    // HUD
    this.scene.add('HudScene', this.hud, true);
    this.hud.cameras.main.fadeIn(1000, 0, 0, 0)


  },
  update: function (time, delta) {
    if (this.gameObjects) {
      this.gameObjects.forEach(function (element) {
        element.update(time, delta);
      });
    }

    if (!this.playerDead && !this.playerWithGun.isAlive) {
      this.playerDead = true;
      this.playerWithGun.body.moves = false;
      this.playerWithGun.setDepth(0);
      
      this.soundboard.die.play();
      this.hud.showDieMessage();
      const cam = this.hud.cameras.main;
      cam.fade(5000, 32, 0, 0)
      cam.once("camerafadeoutcomplete", () => {
        this.scene.remove(this.hud);
        this.scene.restart();
      });
    }

  },
  tilesToPixels(tileX, tileY) {
    return [tileX * this.tileSize, tileY * this.tileSize];
  }
});

export default MyLevelScene