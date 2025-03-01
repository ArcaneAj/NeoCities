import type { Entity } from './entity';
import type { UniformLocations } from './interfaces/uniform-locations.interface';
import type { RenderableEntity } from './renderable-entity';
import { SolidRectangleEntity } from './solid-rectangle-entity';
export const BOX_WIDTH = 300;

export class Scene {
    Draw(gl: WebGLRenderingContext, uniformLocations: UniformLocations) {
        const canvas = gl.canvas as HTMLCanvasElement;

        canvas.style.backgroundImage = 'url(/' + this.index + '.png)';
        canvas.style.backgroundSize = 'contain';
        canvas.style.backgroundRepeat = 'no-repeat';
        canvas.style.backgroundPosition = 'center center';

        const entities = this.GetEntitiesToDraw();
        for (const entity of entities) {
            entity.Draw(gl, uniformLocations);
        }
    }

    public constructor(index: number = 0) {
        this.entities = [];
        this.previous = null;
        this.next = null;
        this.index = index;
    }

    private entities: Entity[];
    private previous: Scene | null;
    private next: Scene | null;
    private index: number;

    UpdateGameState(
        keyPressed: { [id: string]: boolean },
        maxLeft: number,
        maxTop: number
    ): Scene {
        for (let i = 0; i < this.entities.length; i++) {
            const entity = this.entities[i];
            const nextSceneOffset = entity.UpdateGameState(
                this,
                keyPressed,
                maxTop
            );
            if (nextSceneOffset > 0) {
                if (this.next === null) {
                    this.next = this.GenerateNext(maxLeft, maxTop);
                    console.log(this.next);
                }
                this.entities = this.entities.filter((x) => x !== entity);
                this.next.AddEntity(entity);
                this.next.AddPrevious(this);
                return this.next;
            }
            if (nextSceneOffset < 0) {
                if (this.previous === null) {
                    throw new Error('This should not be possible');
                }
                this.entities = this.entities.filter((x) => x !== entity);
                this.previous.AddEntity(entity);
                return this.previous;
            }
        }

        return this;
    }

    AddEntity(entity: Entity): void {
        this.entities.push(entity);
    }

    AddPrevious(scene: Scene) {
        this.previous = scene;
    }

    GetEntitiesToDraw(): RenderableEntity[] {
        const renderableEntities: RenderableEntity[] = this.entities
            .filter((x) => x.ShouldRender())
            .map((x) => x as RenderableEntity);
        return renderableEntities;
    }

    GetSolidEntities(): SolidRectangleEntity[] {
        return this.entities
            .filter((x) => x.IsSolid())
            .map((x) => x as SolidRectangleEntity);
    }

    CollidesWith(state: SolidRectangleEntity): SolidRectangleEntity[] {
        const collisions: SolidRectangleEntity[] = [];

        for (const entity of this.GetSolidEntities()) {
            if (entity.id === state.id) {
                continue;
            }

            if (
                entity.left < state.left + state.width && // entity's left is to the left of state's right
                entity.left + entity.width > state.left && // entity's right is to the right of state's left
                entity.top < state.top + state.height && // entity's top is above state's bottom
                entity.top + entity.height > state.top // entity's bottom is below state's top
            ) {
                collisions.push(entity);
            }
        }

        return collisions;
    }

    GenerateNext(maxLeft: number, maxTop: number): Scene {
        const scene = new Scene(this.index + 1);

        const leftWall = new SolidRectangleEntity(
            -2,
            -500,
            4,
            maxTop + 1000,
            0,
            true
        );
        const rightWall = new SolidRectangleEntity(
            maxLeft - 2,
            -500,
            4,
            maxTop + 1000,
            0,
            true
        );

        // Generate at least one reachable box
        console.log(this.GetSolidEntities());
        const lastBox = this.GetSolidEntities().reduce((prev, next) =>
            next.height > maxTop || prev.top < next.top ? prev : next
        );

        console.log(lastBox.top);

        const lastLeft = lastBox.left;

        if (lastLeft < BOX_WIDTH / 2) {
            //MUST BE RIGHT
        }

        if (lastLeft > maxLeft - BOX_WIDTH / 2) {
            //MUST BE LEFT
        }
        var prevTop = maxTop - 300 + lastBox.top;

        const initOffset =
            randomIntFromInterval(150, 600) * positiveOrNegative();
        // PICK A NUMBER BETWEEN +- 600 of the last spot
        var prevLeft = Math.min(
            Math.max(0, lastLeft + initOffset),
            maxLeft - BOX_WIDTH
        );

        // Generate random boxes until we're within 300 of top
        while (prevTop > 0) {
            console.log(prevTop);

            if (prevTop < 100) {
                prevTop = 100;
                console.log('overriding with 100');
            }
            scene.GenerateBox(prevLeft, prevTop);
            var offset = randomIntFromInterval(150, 600) * positiveOrNegative();

            if (
                prevLeft + offset + BOX_WIDTH > maxLeft ||
                prevLeft + offset < 0
            ) {
                offset = -offset;
            }

            // PICK A NUMBER BETWEEN +- 600 of the last spot
            prevLeft = Math.min(
                Math.max(0, prevLeft + offset),
                maxLeft - BOX_WIDTH
            );

            prevTop = prevTop - randomIntFromInterval(150, 300);
        }

        scene.AddEntity(leftWall);
        scene.AddEntity(rightWall);

        return scene;
    }

    GenerateBox(left: number, top: number): void {
        this.entities.push(
            new SolidRectangleEntity(left, top, BOX_WIDTH, 50, 0, true)
        );
    }
}

function randomIntFromInterval(min: number, max: number): number {
    // min and max inclusive
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function positiveOrNegative(): number {
    return Math.floor(Math.random() * 2) * 2 - 1;
}
