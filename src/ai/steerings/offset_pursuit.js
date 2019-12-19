import Steering from "./steering.js";
import Vector2 from "phaser/src/math/Vector2";
import { arrive } from "./path_following";

export default class OffsetPursuit extends Steering {
    constructor(owner, leader, force = 1, offset, neighbors = [], ownerMaxSpeed = 100,
                leaderSpeed = 40, deceleration = 1.5, separationRadius = 50, maxSeparation = 70) {
        super(owner, [leader], force);
        this.offset = offset;
        this.maxSpeed = ownerMaxSpeed;
        this.leaderSpeed = leaderSpeed;
        this.deceleration = deceleration;
        this.neighbors = neighbors;
        this.separationRadius = separationRadius;
        this.maxSeparation = maxSeparation;
    }

    calculateImpulse() {
        const leader = this.objects[0];
        const owner = this.owner;

        const leaderVelocity = leader.body.velocity;
        const ownerVelocity = owner.body.velocity;

        const leaderPos = new Vector2(leader.x, leader.y);
        const ownerPos = new Vector2(owner.x, owner.y);

        // Calculate behind point
        const tv = leaderVelocity.clone().scale(-1).normalize().multiply(this.offset);
        const behind = leaderPos.clone().add(tv);

        const force = new Vector2(0, 0);

        if (leaderPos.clone().subtract(ownerPos).length() <= this.offset.length()) {
            return force;
        }

        const _arrive = arrive.bind(this);
        const steering = force.add(_arrive(owner, behind));

        // Add separation force
        const separation = OffsetPursuit.separation(owner, this.neighbors, this.separationRadius, this.maxSeparation);
        return steering.add(separation);
    }

    static separation (owner, neighbors, separationRadius, maxSeparation) {
        const ownerPos = new Vector2(owner.x, owner.y);

        let force = new Vector2(0, 0);
        let neighborCount = 0;

        for(let i = 0; i < neighbors.length; i++){
            const neighbor = neighbors[i];
            const neighborPos =  new Vector2(neighbor.x, neighbor.y);

            if (neighbor != owner && ownerPos.clone().distance(neighborPos) <= separationRadius) {
                force.x += (neighborPos.x - ownerPos.x);
                force.y += (neighborPos.y - ownerPos.y);
                neighborCount++;
            }
        }

        if (neighborCount != 0) {
            force.x /= neighborCount;
            force.y /= neighborCount;

            force.scale( -1);
        }

        force = force.normalize().scale(maxSeparation);
        return force;
    }

/*
    calculateImpulse() {
        const leader = this.objects[0];
        const owner = this.owner;
        const offset = this.offset;

        const leaderVelocity = leader.body.velocity;
        const ownerVelocity = owner.body.velocity;

        const leaderPos = new Vector2(leader.x, leader.y);
        const ownerPos = new Vector2(owner.x, owner.y);

        const tv = leaderVelocity.clone().scale(-1).normalize().multiply(this.offset);
        const behind = leaderPos.clone().add(tv);

        let toOffset = behind.clone().subtract(ownerPos);

        //the look-ahead time is proportional to the distance between the leader
        //and the pursuer; and is inversely proportional to the sum of both
        //agents’ velocities
        const lookAheadTime = toOffset.length() / (this.maxSpeed + this.leaderSpeed);

        //now arrive at the predicted future position of the offset
        const predictedPosition = toOffset.add(leaderVelocity.clone().scale(lookAheadTime));

        const _arrive = arrive.bind(this);
        const newPose = _arrive(owner, predictedPosition);

        return newPose;
    }
 */
}
