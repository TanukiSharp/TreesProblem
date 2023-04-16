const DRAG_WINDOW_WIDTH = 6;
const DRAG_WINDOW_HEIGHT = 6;

export class Interactor {
    constructor(htmlElement, xTransform, yTransform, handlers) {
        this._htmlElement = htmlElement;
        this._xTransform = xTransform;
        this._yTransform = yTransform;
        this._handlers = handlers;

        this._downX = null;
        this._downY = null;

        this._isDragging = false;

        htmlElement.addEventListener('pointerdown', e => this._onPointerDown(e));
        htmlElement.addEventListener('pointermove', e => this._onPointerMove(e));
        htmlElement.addEventListener('pointerup', e => this._onPointerUp(e));
    }

    _callHandler(type, e) {
        if (!this._handlers) {
            return;
        }

        const h = this._handlers[type];

        if (!h) {
            return;
        }

        if (typeof h === 'function') {
            h(e);
            return;
        }

        if (h.length > 0) {
            for (const handler of h) {
                if (typeof handler === 'function') {
                    handler(e);
                }
            }
        }
    }

    _onPointerDown(e) {
        e.target.setPointerCapture(e.pointerId);

        e.tx = this._xTransform(e.offsetX);
        e.ty = this._yTransform(e.offsetY);

        this._callHandler('pointerdown-begin', e);

        this._isDown = true;
        this._downX = e.tx;
        this._downY = e.ty;

        this._callHandler('pointerdown-end', e);
    }

    _onPointerMove(e) {
        e.tx = this._xTransform(e.offsetX);
        e.ty = this._yTransform(e.offsetY);

        e.xAtPointerDown = this._downX;
        e.yAtPointerDown = this._downY;

        this._callHandler('pointermove-begin', e);

        if (this._isDown) {
            const deltaX = e.tx - this._downX;
            const deltaY = e.ty - this._downY;

            e.xMoveDelta = deltaX;
            e.yMoveDelta = deltaY;

            if (this._isDragging === false) {
                if (Math.abs(deltaX) > DRAG_WINDOW_WIDTH || Math.abs(deltaY) > DRAG_WINDOW_HEIGHT) {
                    this._isDragging = true;

                    e.xAtPointerDown = this._downX;
                    e.yAtPointerDown = this._downY;

                    this._callHandler('drag-start', e);
                }
            } else {
                e.xAtPointerDown = this._downX;
                e.yAtPointerDown = this._downY;

                this._callHandler('drag-move', e);
            }
        } else {
            this._callHandler('nodrag-pointermove', e);
        }

        this._callHandler('pointermove-end', e);
    }

    _onPointerUp(e) {
        e.target.releasePointerCapture(e.pointerId);

        e.tx = this._xTransform(e.offsetX);
        e.ty = this._yTransform(e.offsetY);

        e.xAtPointerDown = this._downX;
        e.yAtPointerDown = this._downY;

        this._callHandler('pointerup-begin', e);

        if (this._isDragging) {
            this._callHandler('drag-finish', e);
            this._isDragging = false;
        } else {
            this._callHandler('click', e);
        }

        this._isDown = false;
        this._downX = null;
        this._downY = null;

        this._callHandler('pointerup-end', e);
    }
}
