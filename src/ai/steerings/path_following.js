import Steering from "./steering.js";
import Vector2 from 'phaser/src/math/Vector2'

export default class PathFollowing extends Steering {

    constructor(owner, route, force = 1, isLoop = false, ownerMaxSpeed = 100, distSqErr = 10e1, deceleration = 0.3) {
        super(owner, [], force);
        this.route = route;
        this.isLoop = isLoop;
        this.distSqErr = distSqErr;
        this.currentTarget = 0;
        this.maxSpeed = ownerMaxSpeed;
        this.getImpulse = standardFollowing;
        this.deceleration = deceleration;
        if(route.length == 1) {
            this.isLoop = false;
            this.getImpulse = arrive;
        }
    }

    calculateImpulse () {
        const currentPos = new Vector2(this.owner.x, this.owner.y);
        let target = this.currentTarget;
        if(target === this.route.length) return new Vector2(0, 0);
        // check if current position is close enough to current target 
        if(this.distSqErr >= currentPos.distanceSq(this.route[target])) {
            if(this.isLoop)
            this.currentTarget = (target + 1) % this.route.length;
            else {
                
                if(target === this.route.length - 2)
                    this.getImpulse = arrive;
                    this.currentTarget++;
            }
        }
        return this.getImpulse(this.owner, this.route[target]);
    }

}

function standardFollowing (owner, target) {
    const desiredVelocity = new Vector2(target.x - owner.x, target.y-owner.y)
    .normalize().scale(this.maxSpeed);
    const prevVelocity = new Vector2(owner.body.x-owner.body.prev.x, owner.body.y-owner.body.prev.y);
    return desiredVelocity.subtract(prevVelocity);
}

export function arrive(owner, targetVector) {
    const toTarget = targetVector.clone().subtract(new Vector2(owner.x, owner.y));
    const dist = toTarget.length();
    if(dist > 10e-1) {
        let speed = dist / this.deceleration;
        speed = Math.min(speed, this.maxSpeed);
        const desiredVelocity = toTarget.scale(speed / dist);
        const prevVelocity = new Vector2(owner.body.x-owner.body.prev.x, owner.body.y-owner.body.prev.y);
        return desiredVelocity.subtract(prevVelocity);
    }
    return new Vector2(0, 0);
}