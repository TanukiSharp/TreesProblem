import { Interactor } from './interactor.js';

export class PointsManager {
    constructor(canvasElement, points) {
        this._canvasElement = canvasElement;
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
            y => y - (canvasElement.clientHeight / 2)
        );

        this._interactor.addEventListener('pointerdown-begin', e => this._onPointerDown(e.detail));
        this._interactor.addEventListener('nodrag-pointermove', e => this._onNoDragPointerMove(e.detail));
        this._interactor.addEventListener('drag-start', e => this._onDragStart(e.detail));
        this._interactor.addEventListener('drag-move', e => this._onDragMove(e.detail));
        this._interactor.addEventListener('drag-finish', e => this._onDragFinish(e.detail));
        this._interactor.addEventListener('click', e => this._onClick(e.detail));
        this._interactor.addEventListener('pointerup-begin', e => this._onPointerUp(e.detail));
        this._interactor.addEventListener('cancelled', e => this._onCancelled(e.detail));
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

    _onCancelled(e) {
        for (const point of this.points) {
            if (point.isMovable && point.isSelected) {
                point._x = point._xAtPointerDown;
                point._y = point._yAtPointerDown;
                point._isPointerOver = false;
            }
        }
    }

    _onPointerDown(e) {
        this._pointerDownX = e.tx;
        this._pointerDownY = e.ty;

        this._pointAtPointerDown = this._findPointAt(e.tx, e.ty, 'radius');

        this._isMultiSelecting = this._pointAtPointerDown === null;

        if (this._pointAtPointerDown === null) {
            this._multiSelectionWidth = 0;
            this._multiSelectionHeight = 0;

            if (e.ctrlKey === false) {
                for (const point of this.points) {
                    point._isSelected = false;
                }
            } else {
                for (const point of this.points) {
                    point._isInSelection = false;
                }
            }
        } else {
            if (e.ctrlKey) {
                // No toggle but selection in this very special case.
                // Because this can lead to weird case where two points are selected,
                // and toggling off a point at the moment of dragging, meaning moving the
                // other point with mouse being far apart from it.
                this._pointAtPointerDown._isSelected = true;
            } else {
                if (this._pointAtPointerDown._isSelected === false) {
                    for (const point of this.points) {
                        point._isSelected = false;
                    }

                    // TBD: Should also test isMovbable ?
                    // TBD: Should deselect all only if point is selectable and movable ?

                    if (this._pointAtPointerDown.isSelectable) {
                        this._pointAtPointerDown._isSelected = true;
                    }
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

            if (e.ctrlKey) {
                for (const point of this.points) {
                    if (point.isSelectable) {
                        const isInSelection = PointsManager.isPointIsSelection(point, e);

                        if (isInSelection != point._isInSelection) {
                            point._isSelected = !point._isSelected;
                        }

                        point._isInSelection = isInSelection;
                    }
                }
            } else {
                for (const point of this.points) {
                    if (point.isSelectable) {
                        point._isSelected = PointsManager.isPointIsSelection(point, e);
                    }
                }
            }
        } else {
            for (const point of this.points) {
                if (point.isMovable && point.isSelected) {
                    point._x = this._constrainX(point._xAtPointerDown + e.xMoveDelta);
                    point._y = this._constrainY(point._yAtPointerDown + e.yMoveDelta);
                }
            }
        }
    }

    _onDragFinish(e) {
    }

    _onClick(e) {
        if (this._pointAtPointerDown !== null && e.ctrlKey === false) {
            for (const point of this.points) {
                point._isSelected = false;
            }
            this._pointAtPointerDown._isSelected = true;
        }
    }

    _onPointerUp(e) {
        this._isMultiSelecting = false;
    }

    _constrainX(x) {
        const halfWidth = this._canvasElement.clientWidth / 2;
        return Math.max(-halfWidth, Math.min(x, halfWidth));
    }

    _constrainY(y) {
        const halfHeight = this._canvasElement.clientHeight / 2;
        return Math.max(-halfHeight, Math.min(y, halfHeight));
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
