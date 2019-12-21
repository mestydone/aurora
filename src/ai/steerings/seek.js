import Steering from "./steering.js";
import Vector2 from 'phaser/src/math/Vector2'

export default class Seek extends Steering {

    constructor(owner, target, force = 1, ownerMaxSpeed = 100, distance = 300) {
        super(owner, [target], force);
        this.maxSpeed = ownerMaxSpeed;
        this.distance = distance;
    }

    calculateImpulse () {
        const target = this.objects[0];
        const owner = this.owner;
        if (Phaser.Math.Distance.Between(owner.x, owner.y, target.x, target.y) < this.distance) {
            const desiredVelocity = new Vector2(target.x - owner.x, target.y-owner.y).normalize().scale(this.maxSpeed);
            const prevVelocity = new Vector2(owner.body.x-owner.body.prev.x, owner.body.y-owner.body.prev.y);
            return desiredVelocity.subtract(prevVelocity); //must be owner.body.velocity, but it's value sets on [0, 0] every second frame
        } else {
            return new Vector2(0,0)
        }
    }
}
