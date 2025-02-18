import type { Rectangle } from './interfaces/rectangle.interface';
import { SolidEntity } from './solid-entity';

export class SolidRectangleEntity extends SolidEntity implements Rectangle {
    public constructor(
        left: number,
        top: number,
        width: number,
        height: number,
        depth: number,
        fixed: boolean
    ) {
        super(depth, fixed);
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }

    left: number;
    top: number;
    width: number;
    height: number;
}
