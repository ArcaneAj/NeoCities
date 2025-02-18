export class Entity {
    public constructor(depth: number, solid: boolean, fixed: boolean) {
        this.depth = depth;
        this.solid = solid;
        this.fixed = fixed;
    }
    depth: number;
    solid: boolean;
    fixed: boolean;
}
