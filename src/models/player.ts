import { CollidesWith } from '../scripts/main';
import type { Scene } from './scene';
import { SolidRectangleEntity } from './solid-rectangle-entity';

const GRAVITY = 1;
const AIR_RESISTANCE = 0.99;

const SPEED = 10;
const JUMP_SPEED = 25;

export class Player extends SolidRectangleEntity {
    public constructor(
        left: number,
        top: number,
        width: number,
        height: number,
        depth: number
    ) {
        super(left, top, width, height, depth, false);
        this.velocityX = 10;
    }

    UpdateGameState(scene: Scene, keyPressed: { [id: string]: boolean }): void {
        this.velocityX = this.velocityX * AIR_RESISTANCE;
        if (this.TouchingBottom(scene)) {
            if (this.velocityY === 0) {
                this.velocityX = 0;
            }

            if ('w' in keyPressed || 'ArrowUp' in keyPressed) {
                this.velocityY = -JUMP_SPEED;
            }
        }

        if ('a' in keyPressed || 'ArrowLeft' in keyPressed) {
            this.velocityX = -SPEED;
            if (this.TouchingLeft(scene)) {
                this.velocityX = 0;
            }
        }
        if ('d' in keyPressed || 'ArrowRight' in keyPressed) {
            this.velocityX = SPEED;
            if (this.TouchingRight(scene)) {
                this.velocityX = 0;
            }
        }
        if ('s' in keyPressed || 'ArrowDown' in keyPressed) {
            this.velocityY = Math.max(0, this.velocityY);
        }

        // We bias towards horizontal movement in the case of a conflict, by evaluating it first
        const newHorizontalState: Player = this.ShallowClone().MoveTo(
            this.left + this.velocityX,
            this.top
        );

        const horizontalCollisions: SolidRectangleEntity[] =
            scene.CollidesWith(newHorizontalState);
        if (horizontalCollisions.length === 0) {
            this.MoveTo(this.left + this.velocityX, this.top);
        } else {
            if (this.velocityX < 0) {
                // Moving left
                const rightMostCollision = horizontalCollisions.reduce(
                    (prev, current) =>
                        prev && prev.left < current.left ? prev : current
                );

                this.MoveTo(
                    rightMostCollision.left + rightMostCollision.width,
                    this.top
                );
            } else {
                // Moving right
                const leftMostCollision = horizontalCollisions.reduce(
                    (prev, current) =>
                        prev &&
                        prev.left + prev.width > current.left + current.width
                            ? prev
                            : current
                );

                this.MoveTo(leftMostCollision.left - this.width, this.top);
            }
            this.velocityX = -this.velocityX * 0.5;
        }

        const newVerticalState: Player = this.ShallowClone().MoveTo(
            this.left,
            this.top + this.velocityY
        );

        const verticalCollisions: SolidRectangleEntity[] =
            scene.CollidesWith(newVerticalState);

        if (verticalCollisions.length === 0) {
            this.MoveTo(this.left, this.top + this.velocityY);
            if (!this.TouchingBottom(scene)) {
                this.velocityY += GRAVITY;
            }
        } else {
            if (this.velocityY > 0) {
                // Moving down
                const topMostCollision = verticalCollisions.reduce(
                    (prev, current) =>
                        prev && prev.top < current.top ? prev : current
                );

                this.MoveTo(
                    this.left,
                    this.top + (topMostCollision.top - this.top - this.height)
                );

                this.velocityY = Math.ceil(
                    Math.min(0, 1 - this.velocityY * 0.5)
                );
            } else {
                // Moving up
                const bottomMostCollision = verticalCollisions.reduce(
                    (prev, current) =>
                        prev &&
                        prev.top + prev.height > current.top + current.height
                            ? prev
                            : current
                );

                this.MoveTo(
                    this.left,
                    bottomMostCollision.top + bottomMostCollision.height
                );
                this.velocityY = 0;
            }
        }
    }

    private TouchingBottom(scene: Scene): boolean {
        for (const entity of scene.GetSolidEntities()) {
            if (
                this.top + this.height === entity.top &&
                this.left < entity.left + entity.width && // Player left is to the left of entity right
                this.left + this.width > entity.left // Player right is to the right of entity left
            ) {
                return true;
            }
        }
        return false;
    }

    private TouchingLeft(scene: Scene): boolean {
        for (const entity of scene.GetSolidEntities()) {
            if (
                this.left === entity.left + entity.width &&
                this.top < entity.top + entity.height && // Player top is above entity bottom
                this.top + this.height > entity.top // Player bottom is below entity top
            ) {
                return true;
            }
        }
        return false;
    }

    private TouchingRight(scene: Scene): boolean {
        for (const entity of scene.GetSolidEntities()) {
            if (
                this.left + this.width === entity.left &&
                this.top < entity.top + entity.height && // Player top is above entity bottom
                this.top + this.height > entity.top // Player bottom is below entity top
            ) {
                return true;
            }
        }
        return false;
    }
}
