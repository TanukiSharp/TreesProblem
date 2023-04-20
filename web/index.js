import { GridRenderer } from './lib/points2d/renderers/gridRenderer.js';
import { LassoSelectionRenderer } from './lib/points2d/renderers/selectionRenderer.js';
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
        this._renderPoint(p);
    }

    _getFillColor(p) {
        if (p.tags.includes(POINT_TYPE_TREE)) {
            return 'lightblue';
        } else if (p.tags.includes(POINT_TYPE_BETA)) {
            return 'lime';
        } else if (p.tags.includes(POINT_TYPE_ALPHA_START) || p.tags.includes(POINT_TYPE_ALPHA_END)) {
            return 'pink';
        }

        return 'black';
    }

    _getStrokeColor(p) {
        return 'black';
    }

    _getStrokeWidth(p) {
        if (p.isSelected) {
            if (p.isPointerOver) {
                return 8;
            }
            return 4;
        }
        return 1;
    }

    _renderPoint(p) {
        const ctx = this._ctx;

        ctx.beginPath();

        ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);

        ctx.fillStyle = this._getFillColor(p);
        ctx.fill();

        ctx.strokeStyle = this._getStrokeColor(p);
        ctx.lineWidth = this._getStrokeWidth(p);
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

class CameraRenderer {
    constructor(ctx, points) {
        this._ctx = ctx;

        this._alphaStart = null;
        this._alphaEnd = null;
        this._beta = null;

        for (const point of points) {
            if (point.tags.includes(POINT_TYPE_ALPHA_START)) {
                this._alphaStart = point;
            } else if (point.tags.includes(POINT_TYPE_ALPHA_END)) {
                this._alphaEnd = point;
            } else if (point.tags.includes(POINT_TYPE_BETA)) {
                this._beta = point;
            }
        }

        if (this._alphaStart === null || this._alphaEnd === null || this._beta === null) {
            throw new Error('Alpha start, alpha end and/or beta point(s) is/are missing.');
        }
    }

    render() {
        const ctx = this._ctx;

        const alphaAngle = Math.atan2(this._alphaStart.y, this._alphaStart.x);
        const betaAngle = Math.atan2(this._beta.y, this._beta.x);

        const lineLength = Math.max(ctx.canvas.clientWidth, ctx.canvas.clientHeight);

        const alphaX = Math.cos(alphaAngle) * lineLength;
        const alphaY = Math.sin(alphaAngle) * lineLength;

        const betaX = Math.cos(betaAngle) * lineLength;
        const betaY = Math.sin(betaAngle) * lineLength;

        // Draw alpha arc.
        ctx.beginPath();
        ctx.arc(0, 0, 30, betaAngle, alphaAngle, true);
        ctx.lineWidth = 15;
        ctx.strokeStyle = 'rgba(255, 64, 64, 0.5)';
        ctx.stroke();

        // Draw beta arc.
        ctx.beginPath();
        ctx.arc(0, 0, 50, 0, betaAngle, true);
        ctx.lineWidth = 15;
        ctx.strokeStyle = 'rgba(0, 255, 64, 0.5)';
        ctx.stroke();

        // Draw camera end line. (alpha)
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(alphaX, alphaY);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#d0d0d0';
        ctx.stroke();

        // Draw camera end line. (beta)
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(betaX, betaY);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#d0d0d0';
        ctx.stroke();
    }
}

class Renderer {
    constructor(canvas, pointsManager) {
        const ctx = canvas.getContext('2d');

        this._ctx = ctx;

        this._renderers = [
            new GridRenderer(ctx),
            new CameraRenderer(ctx, pointsManager.points),
            new PointsRenderer(ctx, pointsManager.points),
            new LassoSelectionRenderer(ctx, pointsManager),
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

    const alphaStart = new Point(-30, -30, { id: 1, baseRadius: 9, hoverRadius: 12, tags: [POINT_TYPE_ALPHA_START] });
    const alphaEnd = new Point(-60, -60, { id: 2, baseRadius: 9, hoverRadius: 12, tags: [POINT_TYPE_ALPHA_END] });
    const beta = new Point(40, 40, { id: 3, baseRadius: 9, hoverRadius: 12, tags: [POINT_TYPE_BETA] });

    const pointsManager = new PointsManager(canvasElement, [
        alphaStart,
        alphaEnd,
        beta,
        new Point(50, 50, { id: 1001, baseRadius: 7, hoverRadius: 11, tags: [POINT_TYPE_TREE] }),
        new Point(50, 30, { id: 1002, baseRadius: 7, hoverRadius: 11, tags: [POINT_TYPE_TREE] }),
        new Point(30, 50, { id: 1003, baseRadius: 7, hoverRadius: 11, tags: [POINT_TYPE_TREE] }),
        new Point(30, 30, { id: 1004, baseRadius: 7, hoverRadius: 11, tags: [POINT_TYPE_TREE] }),
    ]);

    new Renderer(canvasElement, pointsManager);
}

window.addEventListener('load', main);
