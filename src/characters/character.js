import Vector2 from 'phaser/src/math/Vector2'
export default class Character extends Phaser.Physics.Arcade.Sprite{
    constructor(scene, x, y, name, frame) {
        super(scene, x, y, name, frame);
        scene.physics.world.enable(this);
        scene.add.existing(this);
        
        this.behaviuors = [];
        this.steerings = [];
        this.hp = 100;
        this.radius = 100;
        this.groupId = 0;
        this.viewDirection = new Vector2(0, 1);
    }

    update() {
      throw "Unimplemented update() method for Character class" ;
    };
    updateAnimation() {
        throw "Unimplemented updateAnimation() method for Character class" ;
    };


}
