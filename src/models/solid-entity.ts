import { Entity } from './entity';

export class SolidEntity extends Entity {
    public constructor(depth: number, fixed: boolean) {
        super(depth, true, fixed);
    }
}
