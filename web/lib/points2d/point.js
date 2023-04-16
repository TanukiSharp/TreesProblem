export class Point {
    constructor(x, y, baseRadius, hoverRadius, tags) {
        this._x = x;
        this._y = y;
        this._baseRadius = baseRadius;
        this._hoverRadius = hoverRadius;
        this._tags = tags;

        this._isSelected = false;

        this._isMouseOver = false;
        this._isMouseDown = false;
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

    get isSelected() {
        return this._isSelected;
    }

    get isMouseOver() {
        return this._isMouseOver;
    }

    get isMouseDown() {
        return this._isMouseDown;
    }
}
