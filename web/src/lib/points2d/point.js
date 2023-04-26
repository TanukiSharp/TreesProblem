const applyDefaultPointProperties = function(properties) {
    properties.baseRadius ??= 5;
    properties.hoverRadius ??= 9;
    properties.tags ??= [];
    properties.isSelectable ??= true;
    properties.isMovable ??= true;
    properties.isHoverable ??= true;

    return properties;
}

export class Point {
    constructor(x, y, properties) {
        this._x = x;
        this._y = y;
        this._properties = applyDefaultPointProperties(properties);

        this._isSelected = false;
        this._isInLassoSelection = false;
        this._isPointerOver = false;
        this._isPointerDown = false;
    }

    get id() {
        return this._properties.id;
    }

    get x() {
        return this._x;
    }

    get y() {
        return this._y;
    }

    get tags() {
        return this._properties.tags;
    }

    get radius() {
        if (this.isPointerOver) {
            return this._properties.hoverRadius;
        }
        return this._properties.baseRadius;
    }

    get baseRadius() {
        return this._properties.baseRadius;
    }

    get hoverRadius() {
        return this._properties.hoverRadius;
    }

    get isMovable() {
        return this._properties.isMovable;
    }

    get isSelectable() {
        return this._properties.isSelectable;
    }

    get isHoverable() {
        return this._properties.isHoverable;
    }

    get isSelected() {
        return this._isSelected;
    }

    get isInLassoSelection() {
        return this._isInLassoSelection;
    }

    get isPointerOver() {
        return this._isPointerOver;
    }

    get isPointerDown() {
        return this._isPointerDown;
    }
}
