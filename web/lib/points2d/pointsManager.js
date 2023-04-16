import { Interactor } from './interactor.js';

export class PointsManager {
    constructor(canvasElement, points) {
        this.points = points ?? [];

        this._isMultiSelecting = false;
        this._multiSelectionWidth = 0;
        this._multiSelectionHeight = 0;

        this._dragWindowX = 6;
        this._dragWindowY = 6;

        this._isPointerDown = false;
        this._pointerDownX = null;
        this._pointerDownY = null;
        this._pointAtPointerDown = null;

        this._hoveredPoint = null;
        this._isDragging = false;

        this._interactor = new Interactor(
            canvasElement,
            x => x - (canvasElement.clientWidth / 2),
            y => y - (canvasElement.clientHeight / 2),
            {
                'pointerdown-begin': e => this._onPointerDown(e),
                'nodrag-pointermove': e => this._onNoDragPointerMove(e),
                'drag-start': e => this._onDragStart(e),
                'drag-move': e => this._onDragMove(e),
                'drag-finish': e => this._onDragFinish(e),
                'click': e => this._onClick(e),
                'pointerup-begin': e => this._onPointerUp(e),
            }
        );
    }

    get pointerDownX() {
        return this._pointerDownX;
    }

    get pointerDownY() {
        return this._pointerDownY;
    }

    get isMultiSelecting() {
        return this._isMultiSelecting;
    }

    get multiSelectionWidth() {
        return this._multiSelectionWidth;
    }

    get multiSelectionHeight() {
        return this._multiSelectionHeight;
    }

    static transformPointerEvent(e) {
        e.tx = e.offsetX - (e.target.clientWidth / 2);
        e.ty = e.offsetY - (e.target.clientHeight / 2);
        return e;
    }

    static computeSquaredDistance(x1, y1, x2, y2) {
        const deltaX = x2 - x1;
        const deltaY = y2 - y1;

        return deltaX * deltaX + deltaY * deltaY;
    }

    static computeDistance(x1, y1, x2, y2) {
        return Math.sqrt(PointsManager.computeSquaredDistance(x1, y1, x2, y2));
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
        this._pointerDownX = e.tx;
        this._pointerDownY = e.ty;

        this._pointAtPointerDown = this._findPointAt(e.tx, e.ty, 'radius');

        this._isMultiSelecting = this._pointAtPointerDown === null;

        if (this._pointAtPointerDown === null) {
            this._multiSelectionWidth = 0;
            this._multiSelectionHeight = 0;
            for (const point of this.points) {
                point._isSelected = false;
            }
        } else {
            if (this._pointAtPointerDown._isSelected === false) {
                for (const point of this.points) {
                    point._isSelected = false;
                }

                // TBD: Should also test isMovbable ?
                // TBD: Should deselect all only is point is selectable and movable ?

                if (this._pointAtPointerDown.isSelectable) {
                    this._pointAtPointerDown._isSelected = true;
                }
            }

            for (const point of this.points) {
                if (point.isMovable && point.isSelected) {
                    point._xAtPointerDown = point.x;
                    point._yAtPointerDown = point.y;
                }
            }
        }
    }

    _onNoDragPointerMove(e) {
        if (this._hoveredPoint !== null) {
            const distance = PointsManager.computeDistance(e.tx, e.ty, this._hoveredPoint.x, this._hoveredPoint.y);
            if (distance > this._hoveredPoint.radius) {
                this._hoveredPoint._isPointerOver = false;
                this._hoveredPoint = null;
            }
        }

        if (this._hoveredPoint === null) {
            const closestPoint = this._findPointAt(e.tx, e.ty, 'radius');

            if (closestPoint !== null) {
                this._hoveredPoint = closestPoint;
                this._hoveredPoint._isPointerOver = true;
            }
        }
    }

    _onDragStart(e) {
    }

    _onDragMove(e) {
        if (this._isMultiSelecting) {
            this._multiSelectionWidth = e.xMoveDelta;
            this._multiSelectionHeight = e.yMoveDelta;

            for (const point of this.points) {
                if (point.isSelectable) {
                    point._isSelected = PointsManager.isPointIsSelection(point, e);
                }
            }
        } else {
            for (const point of this.points) {
                if (point.isMovable && point.isSelected) {
                    point._x = point._xAtPointerDown + e.xMoveDelta;
                    point._y = point._yAtPointerDown + e.yMoveDelta;
                }
            }
        }
    }

    _onDragFinish(e) {
    }

    _onClick(e) {
        if (this._pointAtPointerDown !== null) {
            for (const point of this.points) {
                point._isSelected = false;
            }
            this._pointAtPointerDown._isSelected = true;
        }
    }

    _onPointerUp(e) {
        this._isMultiSelecting = false;
    }

    static isPointIsSelection(p, e) {
        const x1 = e.xAtPointerDown;
        const y1 = e.yAtPointerDown;

        const x2 = e.xAtPointerDown + e.xMoveDelta;
        const y2 = e.yAtPointerDown + e.yMoveDelta;

        return (
            p.x >= Math.min(x1, x2) &&
            p.y >= Math.min(y1, y2) &&
            p.x <= Math.max(x1, x2) &&
            p.y <= Math.max(y1, y2)
        );
    }
}
