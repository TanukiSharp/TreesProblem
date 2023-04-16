const POINT_TYPE_TREE = 'tree';
const POINT_TYPE_BETA = 'beta';
const POINT_TYPE_ALPHA_START = 'alpha-start';
const POINT_TYPE_ALPHA_END = 'alpha-end';

class Point {
    constructor(x, y, baseRadius, hoverRadius, type) {
        this.x = x;
        this.y = y;
        this._baseRadius = baseRadius;
        this._hoverRadius = hoverRadius;
        this._type = type;

        this.isSelected = false;

        this.isMouseOver = false;
        this.isMouseDown = false;
    }

    get radius() {
        if (this.isMouseOver) {
            return this._hoverRadius;
        }
        return this._baseRadius;
    }

    get baseRadius() {
        return this._baseRadius;
    }

    get hoverRadius() {
        return this._hoverRadius;
    }

    get type() {
        return this._type;
    }
}

class PointRenderer {
    constructor(ctx) {
        this._ctx = ctx;
    }

    render(p) {
        if (p.type === POINT_TYPE_TREE) {
            this._renderTree(p);
        }
    }

    _getFillColor(p) {
        if (p.type === POINT_TYPE_TREE) {
            if (p.isSelected) {
                return 'red';
            }
            return 'green';
        }

        return 'black';
    }

    _getStrokeColor(p) {
        if (p.type === POINT_TYPE_TREE) {
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

class PointsManager {
    constructor(canvasElement, points) {
        this.points = points ?? [];

        this._isSelecting = false;
        this._selectionWidth = null;
        this._selectionHeight = null;

        this._dragWindowX = 6;
        this._dragWindowY = 6;

        this._isPointerDown = false;
        this._pointerDownX = null;
        this._pointerDownY = null;
        this._pointAtPointerDown = null;

        this._hoveredPoint = null;
        this._isDragging = false;

        canvasElement.addEventListener('pointerdown', e => this._onPointerDown(PointsManager.transformPointerEvent(e)));
        canvasElement.addEventListener('pointermove', e => this._onPointerMove(PointsManager.transformPointerEvent(e)));
        canvasElement.addEventListener('pointerup', e => this._onPointerUp(PointsManager.transformPointerEvent(e)));
    }

    get pointerDownX() {
        return this._pointerDownX;
    }

    get pointerDownY() {
        return this._pointerDownY;
    }

    get isSelecting() {
        return this._isSelecting;
    }

    get selectionWidth() {
        return this._selectionWidth;
    }

    get selectionHeight() {
        return this._selectionHeight;
    }

    static transformPointerEvent(e) {
        e.tx = e.offsetX - (e.target.clientWidth / 2);
        e.ty = e.offsetY - (e.target.clientHeight / 2);
        return e;
    }

    static computeDistance(x1, y1, x2, y2) {
        const deltaX = x2 - x1;
        const deltaY = y2 - y1;

        return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    }

    _findPointAt(x, y, radiusType) {
        let bestPoint = null;
        let minDistance = -1;

        for (const point of this.points) {
            const distance = PointsManager.computeDistance(point.x, point.y, x, y);

            if (distance > point[radiusType]) {
                continue;
            }

            if (minDistance < 0 || distance < minDistance) {
                minDistance = distance;
                bestPoint = point;
            }
        }

        return bestPoint;
    }

    _onPointerDown(e) {
        this._isPointerDown = true;

        this._pointerDownX = e.tx;
        this._pointerDownY = e.ty;

        this._pointAtPointerDown = this._findPointAt(e.tx, e.ty, 'radius');

        if (this._pointAtPointerDown === null) {
            this._isSelecting = true;
            this._selectionWidth = 0;
            this._selectionHeight = 0;
        }
    }

    _isPointIsSelection(p) {
        return (
            p.x >= this._pointerDownX &&
            p.y >= this._pointerDownY &&
            p.x <= (this._pointerDownX + this._selectionWidth) &&
            p.y <= (this._pointerDownY + this._selectionHeight)
        );
    }

    _onPointerMove(e) {
        if (this._isPointerDown) {
            if (this._isSelecting) {
                this._selectionWidth = e.tx - this._pointerDownX;
                this._selectionHeight = e.ty - this._pointerDownY;
            }

            for (const point of this.points) {
                point.isSelected = this._isPointIsSelection(point);
            }

            return;
        }

        if (this._hoveredPoint !== null) {
            const distance = PointsManager.computeDistance(e.tx, e.ty, this._hoveredPoint.x, this._hoveredPoint.y);
            if (distance > this._hoveredPoint.radius) {
                this._hoveredPoint.isMouseOver = false;
                this._hoveredPoint = null;
            }
        }

        if (this._hoveredPoint === null) {
            const closestPoint = this._findPointAt(e.tx, e.ty, 'radius');

            if (closestPoint !== null) {
                this._hoveredPoint = closestPoint;
                this._hoveredPoint.isMouseOver = true;
            }
        }

        if (this._pointerDownX !== null && this._pointerDownY !== null) {
            const deltaX = Math.abs(e.tx - this._pointerDownX);
            const deltaY = Math.abs(e.ty - this._pointerDownY);

            if (deltaX > this._dragWindowX || deltaY > this._dragWindowY) {
                this._isDragging = true;
            }
        }

        if (this._isDragging) {
            this._onDragMove(e);
        }
    }

    _onDragMove(e) {
    }

    _onPointerUp(e) {
        this._isSelecting = false;
        this._isPointerDown = false;
        this._pointAtPointerDown = null;
        this._pointerDownX = null;
        this._pointerDownY = null;
        this._isDragging = false;
    }
}

class SelectionRenderer {
    constructor(ctx, pointsManager) {
        this._ctx = ctx;
        this._pointsManager = pointsManager;
    }

    render() {
        if (this._pointsManager.isSelecting === false) {
            return;
        }

        const ctx = this._ctx;

        ctx.beginPath();

        ctx.rect(
            this._pointsManager.pointerDownX,
            this._pointsManager.pointerDownY,
            this._pointsManager.selectionWidth,
            this._pointsManager.selectionHeight
        );

        ctx.fillStyle = 'rgba(0, 178, 255, 0.25)';
        ctx.fill();

        ctx.strokeStyle = '#c0c0c0';
        ctx.strokeWidth = 1;
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
            if (point.isMouseOver) {
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

class GridRenderer {
    constructor(ctx) {
        this._ctx = ctx;
    }

    render() {
        const ctx = this._ctx;

        const halfWidth = ctx.canvas.clientWidth / 2;
        const halfHeight = ctx.canvas.clientHeight / 2;

        ctx.beginPath();

        ctx.moveTo(0, -halfHeight);
        ctx.lineTo(0, halfHeight);

        ctx.moveTo(-halfWidth, 0);
        ctx.lineTo(halfWidth, 0);

        ctx.strokeStyle = '#e0e0e0';
        ctx.stroke();
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

    const pointsManager = new PointsManager(canvasElement, [
        new Point(0, 0, 5, 9, POINT_TYPE_TREE),
        new Point(50, 50, 5, 9, POINT_TYPE_TREE),
        new Point(50, 30, 5, 9, POINT_TYPE_TREE),
        new Point(30, 50, 5, 9, POINT_TYPE_TREE),
        new Point(30, 30, 5, 9, POINT_TYPE_TREE),
        new Point(30, 30, 5, 9, POINT_TYPE_BETA),
    ]);

    const renderer = new Renderer(canvasElement, pointsManager);
}

window.addEventListener('load', main);
