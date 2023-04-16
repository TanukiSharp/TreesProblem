export class PointsManager {
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
                point._isSelected = this._isPointIsSelection(point);
            }

            return;
        }

        if (this._hoveredPoint !== null) {
            const distance = PointsManager.computeDistance(e.tx, e.ty, this._hoveredPoint.x, this._hoveredPoint.y);
            if (distance > this._hoveredPoint.radius) {
                this._hoveredPoint._isMouseOver = false;
                this._hoveredPoint = null;
            }
        }

        if (this._hoveredPoint === null) {
            const closestPoint = this._findPointAt(e.tx, e.ty, 'radius');

            if (closestPoint !== null) {
                this._hoveredPoint = closestPoint;
                this._hoveredPoint._isMouseOver = true;
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
