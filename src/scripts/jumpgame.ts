import { Player } from '../models/player';
import { Scene } from '../models/scene';
import { SolidRectangleEntity } from '../models/solid-rectangle-entity';
import {
    CreateBasicQuadProgram,
    ShouldResizeCanvasToDisplaySize,
} from './main';

export function JumpGame(canvas: HTMLCanvasElement, gl: WebGLRenderingContext) {
    // Create program with basic quad shaders
    const uniformLocations = CreateBasicQuadProgram(gl, canvas);

    var maxLeft = gl.canvas.width;
    var maxTop = gl.canvas.height;

    const scene: Scene = new Scene();

    const groundThickness = Math.ceil(maxTop / 10);
    const groundHeight = maxTop - groundThickness;
    const ground = new SolidRectangleEntity(
        0,
        groundHeight,
        maxLeft,
        groundThickness,
        0,
        true
    );
    const ceiling = new SolidRectangleEntity(-2, -2, maxLeft + 2, 4, 0, true);
    const leftWall = new SolidRectangleEntity(-2, -1, 4, maxTop, 0, true);
    const rightWall = new SolidRectangleEntity(
        maxLeft - 2,
        -1,
        4,
        maxTop,
        0,
        true
    );

    scene.AddEntity(ground);
    scene.AddEntity(ceiling);
    scene.AddEntity(leftWall);
    scene.AddEntity(rightWall);

    const player = new Player(200, 200, 100, 100, 0);
    scene.AddEntity(player);

    let currentTickTime = 0;
    const TICK_PER_SECOND = 60;
    const TICK_DURATION = 1000 / TICK_PER_SECOND;

    var keyPressed: { [id: string]: boolean } = {};
    (function frame(time: number) {
        requestAnimationFrame(frame);

        while (currentTickTime < time) {
            scene.UpdateGameState(keyPressed);
            currentTickTime += TICK_DURATION;
        }

        // RENDER
        // Reconfigure in case of resize
        const shouldResize = ShouldResizeCanvasToDisplaySize(canvas);
        gl.viewport(0, 0, maxLeft, maxTop);
        // set the resolution
        gl.uniform2f(
            uniformLocations.resolutionUniformLocation,
            maxLeft,
            maxTop
        );

        scene.Draw(gl, uniformLocations);
    })(0);

    canvas.addEventListener('keyup', (event: KeyboardEvent) => {
        delete keyPressed[event.key];
    });

    canvas.addEventListener('keydown', (event: KeyboardEvent) => {
        keyPressed[event.key] = true;
    });
}
