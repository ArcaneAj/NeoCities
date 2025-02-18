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
        super(left, top, depth, fixed);
        this.width = width;
        this.height = height;
    }

    width: number;
    height: number;
}
