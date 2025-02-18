import type { Square } from './interfaces/square.interface';
import { SolidEntity } from './solid-entity';

export class SolidSquareEntity extends SolidEntity implements Square {
    public constructor(
        left: number,
        top: number,
        width: number,
        height: number,
        depth: number
    ) {
        super(depth);
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
