import { CameraRenderer } from './cameraRenderer.js';
import { PointsRenderer } from './pointsRenderer.js';
import { GridRenderer } from '../../lib/points2d/renderers/gridRenderer.js';
import { LassoSelectionRenderer } from '../../lib/points2d/renderers/selectionRenderer.js';

export class RootRenderer {
    constructor(canvas, pointsManager, controlPoints) {
        const ctx = canvas.getContext('2d');

        this._ctx = ctx;

        this.cameraRenderer = new CameraRenderer(ctx, controlPoints);

        this._renderers = [
            new GridRenderer(ctx),
            new PointsRenderer(ctx, pointsManager),
            this.cameraRenderer,
            new LassoSelectionRenderer(ctx, pointsManager),
        ];

        this._requestRender();

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }

    _render() {
        this._requestRender();

        const ctx = this._ctx;
        const canvas = ctx.canvas;

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        const halfWidth = canvas.clientWidth / 2;
        const halfHeight = canvas.clientHeight / 2;

        ctx.translate(halfWidth, halfHeight);
        ctx.clearRect(-halfWidth, -halfHeight, halfWidth, halfHeight);

        for (const renderer of this._renderers) {
            renderer.render();
        }
    }

    _requestRender() {
        window.requestAnimationFrame(() => this._render());
    }
}
