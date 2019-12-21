import Character from "./character";
export default class Slime extends Character {

    constructor(scene, x, y, name, frame) {
        super(scene, x, y, name, frame);
        this.isAlive = true;
        this._time = 0;
        this._lastAttack = 0;
        this.setDepth(2);
    }

    addBehaviour(behaviour) {
        behaviour.character = this;
        this.behaviuors.push(behaviour);
    }

    update(time, delta) {
        const [vx, vy] = [this.body.velocity.x, this.body.velocity.y];
        
        if (this.isAlive) {
            this._time = time;
            this.behaviuors.forEach(x => x.update());
        } else {
            this.setVelocity(vx*0.1, vy*0.1)
        }

        this.updateAnimation();
    }

    updateAnimation() {
        const animsController = this.anims;
        try {
          if (this.hp > 0) {
            if (this.wantToJump)
            {
                animsController.play(this.animations[1], true);
            } else
            {
                animsController.play(this.animations[0], true);
            }
          } else {
            animsController.play(this.animations[2], true);
          }
        } catch (e) { }
    }

    hit(damage)
    {
      if ((this.hp -= damage) <= 0) {
          this.isAlive = false;
          this.scene.physics.world.disable(this);
          this.setDepth(1);
      }
    }

    attack() {
        this._lastAttack = this._time;
        return Phaser.Math.RND.between(15, 40);
    }

    get readyToAttack() {
        return this.isAlive && this._time - this._lastAttack > 1000;
    }
    
}
