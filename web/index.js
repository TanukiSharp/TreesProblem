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
                return 4;
            }
            return 3;
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

        const alphaAngle = Math.atan2(this._alphaEnd.y, this._alphaEnd.x);
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

class CameraHandler {
    constructor(pointsManager) {
        this._pointsManager = pointsManager;

        this._alphaStart = null;
        this._alphaEnd = null;
        this._beta = null;

        for (const point of pointsManager.points) {
            if (point.tags.includes(POINT_TYPE_ALPHA_START)) {
                this._alphaStart = point;
            } else if (point.tags.includes(POINT_TYPE_ALPHA_END)) {
                this._alphaEnd = point;
            } else if (point.tags.includes(POINT_TYPE_BETA)) {
                this._beta = point;
            }
        }

        if (this._alphaStart === null || this._beta === null) {
            throw new Error('Alpha start, alpha end and/or beta point(s) is/are missing.');
        }

        this._resetStates();

        this._onAlphaStartMovedEnter();
        this._onAlphaStartMovedUpdate();
    }

    _resetStates() {
        this._alphaStartMoveState = 'enter';
        this._betaMoveState = 'enter';
    }

    static distance(x1, y1, x2, y2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static distanceToOrigin(p) {
        return CameraHandler.distance(0, 0, p.x, p.y);
    }

    static computeAngle(p) {
        return Math.atan2(p.y, p.x);
    }

    _computeAnglesAndLengths() {
        this._alphaStartAngle = CameraHandler.computeAngle(this._alphaStart);
        this._alphaStartLength = CameraHandler.distanceToOrigin(this._alphaStart);

        this._alphaEndAngle = CameraHandler.computeAngle(this._alphaEnd);
        this._alphaEndLength = CameraHandler.distanceToOrigin(this._alphaEnd);

        this._betaAngle = CameraHandler.computeAngle(this._beta);
        this._betaLength = CameraHandler.distanceToOrigin(this._beta);
    }

    _onAlphaStartMovedEnter(e) {
        this._computeAnglesAndLengths();
    }

    _onAlphaStartMovedUpdate(e) {
        const alphaStartAngle = CameraHandler.computeAngle(this._alphaStart);

        const newBetaAngle = alphaStartAngle;
        const newBetaX = Math.cos(newBetaAngle) * this._betaLength;
        const newBetaY = Math.sin(newBetaAngle) * this._betaLength;

        this._pointsManager.movePoint(this._beta, newBetaX, newBetaY);
    }

    _onBetaMovedEnter() {
        this._computeAnglesAndLengths();
    }

    _onBetaMovedUpdate() {
        const betaAngle = CameraHandler.computeAngle(this._beta);

        const newAlphaStartAngle = betaAngle;
        const newAlphaStartX = Math.cos(newAlphaStartAngle) * this._alphaStartLength;
        const newAlphaStartY = Math.sin(newAlphaStartAngle) * this._alphaStartLength;

        const newAlphaEndAngle = this._alphaEndAngle + (betaAngle - this._betaAngle);
        const newAlphaEndX = Math.cos(newAlphaEndAngle) * this._alphaEndLength;
        const newAlphaEndY = Math.sin(newAlphaEndAngle) * this._alphaEndLength;

        this._pointsManager.movePoint(this._alphaStart, newAlphaStartX, newAlphaStartY);
        this._pointsManager.movePoint(this._alphaEnd, newAlphaEndX, newAlphaEndY);
    }

    onPointMoved(e) {
        if (e.detail.sourceType !== 'event') {
            return;
        }

        if (e.detail.point.tags.includes(POINT_TYPE_ALPHA_START)) {
            if (this._alphaStartMoveState === 'enter') {
                this._onAlphaStartMovedEnter();
                this._alphaStartMoveState = 'update';
            } else if (this._alphaStartMoveState === 'update') {
                this._onAlphaStartMovedUpdate();
            }
        } else if (e.detail.point.tags.includes(POINT_TYPE_BETA)) {
            if (this._betaMoveState === 'enter') {
                this._onBetaMovedEnter();
                this._betaMoveState = 'update';
            } else if (this._betaMoveState === 'update') {
                this._onBetaMovedUpdate();
            }
        }
    }

    onPointMovedEnd() {
        this._resetStates();
    }
}

const main = function() {
    const canvasElement = document.querySelector('.root-container > canvas.render');

    const alphaStart = new Point(40, -120, { id: 1, baseRadius: 9, hoverRadius: 12, tags: [POINT_TYPE_ALPHA_START] });
    const alphaEnd = new Point(-40, -120, { id: 2, baseRadius: 9, hoverRadius: 12, tags: [POINT_TYPE_ALPHA_END] });
    const beta = new Point(120, 120, { id: 3, baseRadius: 9, hoverRadius: 12, tags: [POINT_TYPE_BETA] });

    const pointsManager = new PointsManager(canvasElement, [
        alphaStart,
        alphaEnd,
        beta,
        new Point(50, 50, { id: 1001, baseRadius: 7, hoverRadius: 11, tags: [POINT_TYPE_TREE] }),
        new Point(50, 30, { id: 1002, baseRadius: 7, hoverRadius: 11, tags: [POINT_TYPE_TREE] }),
        new Point(30, 50, { id: 1003, baseRadius: 7, hoverRadius: 11, tags: [POINT_TYPE_TREE] }),
        new Point(30, 30, { id: 1004, baseRadius: 7, hoverRadius: 11, tags: [POINT_TYPE_TREE] }),
    ]);

    const cameraHandler = new CameraHandler(pointsManager);

    pointsManager.addEventListener('pointmove', e => cameraHandler.onPointMoved(e));
    canvasElement.addEventListener('pointerup', _ => cameraHandler.onPointMovedEnd());

    new Renderer(canvasElement, pointsManager);
}

window.addEventListener('load', main);
