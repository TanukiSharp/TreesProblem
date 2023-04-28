import { POINT_TYPE_ALPHA_START, POINT_TYPE_ALPHA_END, POINT_TYPE_TREE, POINT_TYPE_BETA } from '../constants.js';

class PointRenderer {
    constructor(ctx) {
        this._ctx = ctx;
    }

    render(p) {
        this._renderPoint(p);
    }

    _getFillColor(p) {
        if (p.tags.includes(POINT_TYPE_TREE)) {
            if (p.isInFrustum) {
                return 'royalblue';
            }
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

export class PointsRenderer {
    constructor(ctx, pointsManager, filter) {
        this._ctx = ctx;
        this._pointsManager = pointsManager;
        this._filter = filter;

        this._pointRenderer = new PointRenderer(ctx);
    }

    render() {
        let renderAtLast = null;

        for (const point of this._pointsManager.points) {
            if (this._filter?.(point) === false) {
                continue;
            }

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
