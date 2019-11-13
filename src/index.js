import Phaser from 'phaser'


import StartingScene from '../scenes/starting-scene';
import SteeringWanderScene from '../scenes/steering-wander-scene';
import MenuScene from  '../scenes/scenes-menu'
import GroupAlignmentScene from '../scenes/group-alignment-scene';

//https://github.com/mikewesthad/phaser-3-tilemap-blog-posts/blob/master/examples/post-1/05-physics/index.js

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  pixelArt: true,
  zoom: 1.2,

  scene: [MenuScene, SteeringWanderScene, GroupAlignmentScene, StartingScene],
  //StartingScene,


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
