import { GridRenderer } from './lib/points2d/renderers/gridRenderer.js';
import { SelectionRenderer } from './lib/points2d/renderers/selectionRenderer.js';
import { PointsManager } from './lib/points2d/pointsManager.js';
import { Point } from './lib/points2d/point.js';

const POINT_TYPE_TREE = 'tree';
const POINT_TYPE_BETA = 'beta';
const POINT_TYPE_ALPHA_START = 'alpha-start';
const POINT_TYPE_ALPHA_END = 'alpha-end';

class PointRenderer {
    constructor(ctx) {
        this._ctx = ctx;
    }

    render(p) {
        if (p.tags.includes(POINT_TYPE_TREE)) {
            this._renderTree(p);
        }
    }

    _getFillColor(p) {
        if (p.tags.includes(POINT_TYPE_TREE)) {
            if (p.isSelected) {
                return 'red';
            }
            return 'green';
        }

        return 'black';
    }

    _getStrokeColor(p) {
        if (p.tags.includes(POINT_TYPE_TREE)) {
            return 'black';
        }

        return 'black';
    }

    _getStrokeWidth(p) {
        return 1;
    }

    _renderTree(p) {
        const ctx = this._ctx;

        ctx.beginPath();

        ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);

        ctx.fillStyle = this._getFillColor(p);
        ctx.fill();

        ctx.strokeStyle = this._getStrokeColor(p);
        ctx.strokeWidth = this._getStrokeWidth(p);
        ctx.stroke();
    }
}

class PointsRenderer {
    constructor(ctx, points) {
        this._ctx = ctx;
        this._points = points;
        this._pointRenderer = new PointRenderer(ctx);
    }

    render() {
        let renderAtLast = null;

        for (const point of this._points) {
            if (point.isPointerOver) {
                renderAtLast = point;
            } else {
                this._pointRenderer.render(point);
            }
        }

        if (renderAtLast !== null) {
            this._pointRenderer.render(renderAtLast);
        }
    }
}

class Renderer {
    constructor(canvas, pointsManager) {
        const ctx = canvas.getContext('2d');

        this._ctx = ctx;

        this._renderers = [
            new GridRenderer(ctx),
            new PointsRenderer(ctx, pointsManager.points),
            new SelectionRenderer(ctx, pointsManager),
        ];

        this._requestRender();
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

const main = function() {
    const canvasElement = document.querySelector('.root-container > canvas.render');

    const centerPoint = new Point(0, 0, 5, 9, [POINT_TYPE_TREE]);
    centerPoint.isSelectable = false;

    const pointsManager = new PointsManager(canvasElement, [
        centerPoint,
        new Point(50, 50, 5, 9, [POINT_TYPE_TREE]),
        new Point(50, 30, 5, 9, [POINT_TYPE_TREE]),
        new Point(30, 50, 5, 9, [POINT_TYPE_TREE]),
        new Point(30, 30, 5, 9, [POINT_TYPE_TREE]),
        new Point(30, 30, 5, 9, [POINT_TYPE_BETA]),
    ]);

    new Renderer(canvasElement, pointsManager);
}

window.addEventListener('load', main);
