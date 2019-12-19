import Phaser from 'phaser'
import MenuScene from  '../scenes/scenes-menu'
import MyLevelScene from '../scenes/my-level-scene';

//https://github.com/mikewesthad/phaser-3-tilemap-blog-posts/blob/master/examples/post-1/05-physics/index.js

const config = {
  type: Phaser.AUTO,
  width: 1366,
  height: 768,
  pixelArt: true,
  zoom: 1,

  scene: MyLevelScene,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0,
        debug: true // set to true to view zones
        }
    }
  },
};

const game = new Phaser.Game(config);
