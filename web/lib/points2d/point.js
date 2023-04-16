export class Point {
    constructor(x, y, baseRadius, hoverRadius, tags) {
        this._x = x;
        this._y = y;
        this._baseRadius = baseRadius;
        this._hoverRadius = hoverRadius;
        this._tags = tags;

        this.isMovable = true;
        this.isSelectable = true;

        this._isSelected = false;
        this._isPointerOver = false;
        this._isPointerDown = false;
    }

    get x() {
        return this._x;
    }

    get y() {
        return this._y;
    }

    get tags() {
        return this._tags;
    }

    get radius() {
        if (this.isPointerOver) {
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

    get isSelected() {
        return this._isSelected;
    }

    get isPointerOver() {
        return this._isPointerOver;
    }

    get isPointerDown() {
        return this._isPointerDown;
    }
}
