const POINT_TYPE_TREE = 'tree';

class Point {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this._type = type;

        this.isMouseOver;
        this.isMouseDown;
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
        const ctx = this._ctx;

        const radius = this._getBaseRadius(p) * this._getStateBasedRadiusMultiplier(p);

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = this._getFillColor(p);
        ctx.fill();
        ctx.strokeStyle = this._getStrokeColor(p);
        ctx.strokeWidth = this._getStrokeWidth(p);
        ctx.stroke();
    }

    _getFillColor(p) {
        if (p.type === POINT_TYPE_TREE) {
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

    _getBaseRadius(p) {
        if (p.type === POINT_TYPE_TREE) {
            return 10;
        }

        return 3;
    }

    _getStateBasedRadiusMultiplier(p) {
        if (p.isMouseDown) {
            return 1.5;
        }

        if (p.isMouseOver) {
            return 2;
        }

        return 1;
    }

    _renderTree(p) {
        ctx.beginPath();
        ctx.fillStyle = 'green';
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.fill();
    }
}

class PointsRenderer {
    constructor(ctx, points) {
        this._ctx = ctx;
        this._points = points;
        this._pointRenderer = new PointRenderer(ctx);
    }

    render() {
        for (const point of this._points) {
            this._pointRenderer.render(point);
        }
    }
}

class GridRenderer {

}

class Renderer {
    constructor(canvas, points) {
        const ctx = canvas.getContext('2d');

        this._ctx = ctx;

        this._renderers = [
            //new GridRenderer(ctx),
            new PointsRenderer(ctx, points),
        ];

        this._requestRender();
    }

    _render() {
        this._requestRender();

        const ctx = this._ctx;
        const canvas = ctx.canvas;

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        const halfWidth = canvas.width / 2;
        const halfHeight = canvas.height / 2;

        ctx.translate(halfWidth, halfHeight);
        ctx.clearRect(-halfWidth, -halfHeight, canvas.width, canvas.height);

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

    const renderer = new Renderer(canvasElement, [
        new Point(0, 0, POINT_TYPE_TREE),
        new Point(10, 10, POINT_TYPE_TREE),
        new Point(10, -10, POINT_TYPE_TREE),
        new Point(-10, 10, POINT_TYPE_TREE),
        new Point(-10, -10, POINT_TYPE_TREE),
    ]);
}

window.addEventListener('load', main);
