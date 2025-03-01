import { triangular } from '../utils/triangle.util';
import type { Entity } from './entity';
import type { UniformLocations } from './interfaces/uniform-locations.interface';
import type { RenderableEntity } from './renderable-entity';
import { SolidRectangleEntity } from './solid-rectangle-entity';
export const BOX_WIDTH = 300;

const DIM = 5;

const MARK_SIZE = 30;
const MARK_SPACE = 20;

const TOTAL_SIZE = MARK_SIZE * (DIM - 1) + MARK_SPACE * (DIM - 2);

export class Scene {
    Draw(
        gl: WebGLRenderingContext,
        uniformLocations: UniformLocations,
        maxLeft: number,
        maxTop: number
    ) {
        const counts = GetDigits(this.index);

        const midLeft = maxLeft / 2;
        const midTop = maxTop / 2;
        const minLeft = midLeft - TOTAL_SIZE / 2;
        const minTop = midTop - TOTAL_SIZE / 2;

        for (let row = 0; row < DIM - 1; row++) {
            for (let col = 0; col < DIM - 1; col++) {
                const topOffset = row * (MARK_SIZE + MARK_SPACE);
                const leftOffset = col * (MARK_SIZE + MARK_SPACE);

                const left = minLeft + leftOffset;
                const top = minTop + topOffset;
                const lit = counts[row] > col;
                // prettier-ignore
                this.DrawMark(gl, uniformLocations, left, top, lit);
            }
        }

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

    private DrawMark(
        gl: WebGLRenderingContext,
        uniformLocations: UniformLocations,
        left: number,
        top: number,
        lit: boolean
    ) {
        const vertices: Float32Array = new Float32Array([
            left,
            top, // top left
            left,
            top + MARK_SIZE, // bottom left
            left + MARK_SIZE,
            top + MARK_SIZE, // bottom right
            left + MARK_SIZE,
            top, // top right
        ]);

        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

        const rainbowPeriod = 1500;

        const offset = 750;

        const prestige = this.index > DIM ** (DIM - 1) - 1;

        // Set color.
        gl.uniform4f(
            uniformLocations.colorUniformLocation,
            lit ? triangular(offset, rainbowPeriod) : prestige ? 1 : 0.5,
            lit
                ? triangular(offset + rainbowPeriod / 3, rainbowPeriod)
                : prestige
                ? 1
                : 0.5,
            lit
                ? triangular(offset + (2 * rainbowPeriod) / 3, rainbowPeriod)
                : prestige
                ? 0.5
                : 0.5,
            1
        );

        // Draw the entity.
        gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length / 2);
    }

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
                maxTop,
                maxLeft
            );
            if (nextSceneOffset > 0) {
                if (this.next === null) {
                    this.next = this.GenerateNext(maxLeft, maxTop);
                }
                this.entities = this.entities.filter((x) => x !== entity);
                this.next.AddEntity(entity);
                this.next.AddPrevious(this);
                return this.next;
            }
            if (nextSceneOffset < 0) {
                if (this.previous === null) {
                    console.error(
                        'How did you managed to get below the first floor? You must have clipped outside the walls somehow'
                    );
                    window.location.reload();
                    throw new Error(
                        'This should not be possible, how did you get here after the page reloaded?'
                    );
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
        const lastBox = this.GetSolidEntities().reduce((prev, next) =>
            next.height > maxTop || prev.top < next.top ? prev : next
        );

        const lastLeft = lastBox.left;
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

            prevTop = prevTop - randomIntFromInterval(200, 300);
        }

        const sorted = scene.GetSolidEntities().sort((a, b) => a.top - b.top);
        var previousTop = -175;
        for (let i = 0; i < sorted.length; i++) {
            const box = sorted[i];
            if (box.top - previousTop < 250) {
                box.top = previousTop + 250;
            }
            previousTop = box.top;
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

function GetDigits(num: number) {
    return Array.from(Array(DIM).keys()).map(
        (x) => Math.floor(num / DIM ** x) % DIM
    );
}

function randomIntFromInterval(min: number, max: number): number {
    // min and max inclusive
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function positiveOrNegative(): number {
    return Math.floor(Math.random() * 2) * 2 - 1;
}
