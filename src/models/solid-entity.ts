import { Entity } from './entity';

export class SolidEntity extends Entity {
    public constructor(
        left: number,
        top: number,
        depth: number,
        fixed: boolean
    ) {
        super(left, top, depth, true, fixed);
    }
}
