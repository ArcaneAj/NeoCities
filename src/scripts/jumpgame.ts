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

    const player = new Player(200, 200, 100, 100, 0);
    const scene: Scene = CreateBaseScene(maxTop, maxLeft, player);

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

function CreateBaseScene(maxTop: number, maxLeft: number, player: Player) {
    const scene: Scene = new Scene();

    scene.AddEntity(player);

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

    scene.AddEntity(ground);
    scene.AddEntity(leftWall);
    scene.AddEntity(rightWall);

    // MAX PLAYER JUMP IS 325

    const BOX_WIDTH = 300;
    const BOX_SCREEN_MIDDLE = (maxLeft - BOX_WIDTH) / 2;
    scene.AddEntity(
        new SolidRectangleEntity(
            BOX_SCREEN_MIDDLE,
            groundHeight - 300,
            BOX_WIDTH,
            50,
            0,
            true
        )
    );
    scene.AddEntity(
        new SolidRectangleEntity(
            BOX_SCREEN_MIDDLE + 400,
            groundHeight - 600,
            BOX_WIDTH,
            50,
            0,
            true
        )
    );
    // const box2 = new SolidRectangleEntity(-2, -1, 4, maxTop, 0, true);
    // const box3 = new SolidRectangleEntity(-2, -1, 4, maxTop, 0, true);
    // scene.AddEntity(box2);
    // scene.AddEntity(box3);
    return scene;
}
