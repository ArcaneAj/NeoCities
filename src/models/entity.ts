export type UUID = `${string}-${string}-${string}-${string}-${string}`;

export class Entity {
    public constructor(
        left: number,
        top: number,
        depth: number,
        solid: boolean,
        fixed: boolean
    ) {
        this.id = crypto.randomUUID();
        this.left = left;
        this.top = top;
        this.depth = depth;
        this.solid = solid;
        this.fixed = fixed;
        this.velocityX = 0;
        this.velocityY = 0;
    }

    id: UUID;

    left: number;
    top: number;
    depth: number;
    solid: boolean;
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
