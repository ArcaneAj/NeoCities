import type { Rectangle } from './interfaces/rectangle.interface';
import { RenderableEntity } from './renderable-entity';
import type { Scene } from './scene';

export class SolidRectangleEntity
    extends RenderableEntity
    implements Rectangle
{
    IsSolid(): boolean {
        return true;
    }

    GetVertices(): Float32Array {
        // prettier-ignore
        return new Float32Array([
            this.left, this.top,                            // top left
            this.left, this.top + this.height,              // bottom left
            this.left + this.width, this.top + this.height, // bottom right
            this.left + this.width, this.top                // top right
        ]);
    }

    GetDrawMode(gl: WebGLRenderingContext): GLenum {
        return gl.TRIANGLE_FAN;
    }

    UpdateGameState(
        scene: Scene,
        keyPressed: { [id: string]: boolean }
    ): void {}

    public constructor(
        left: number,
        top: number,
        width: number,
        height: number,
        depth: number,
        fixed: boolean
    ) {
        super();
        this.width = width;
        this.height = height;
        this.left = left;
        this.top = top;
        this.depth = depth;
        this.fixed = fixed;
        this.velocityX = 0;
        this.velocityY = 0;
    }

    width: number;
    height: number;

    left: number;
    top: number;
    depth: number;
    fixed: boolean;
    velocityX: number;
    velocityY: number;

    MoveTo(left: number, top: number) {
        this.left = left;
        this.top = top;
        return this;
    }

    ShallowClone(): this {
        return Object.create(this);
    }
}
