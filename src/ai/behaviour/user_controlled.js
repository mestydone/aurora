import Vector2 from 'phaser/src/math/Vector2'
export default class UserControlled {
    constructor(maxSpeed, cursors)
    {
        this.maxSpeed = maxSpeed;
        this.cursors = cursors;
    }

    update()
    {

        const body = this.character.body;
        body.setVelocity(0);
        const speed = this.maxSpeed;
        const cursors = this.cursors;

        if (cursors.left.isDown) {
            body.velocity.x -= speed;
        } else if (cursors.right.isDown) {
            body.velocity.x += speed;
        }

        // Vertical movement
        if (cursors.up.isDown) {
            body.setVelocityY(-speed);
        } else if (cursors.down.isDown) {
            body.setVelocityY(speed);
        }
        // Normalize and scale the velocity so that player can't move faster along a diagonal
        body.velocity.normalize().scale(speed);


    }
}