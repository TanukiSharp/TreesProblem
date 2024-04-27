import { POINT_TYPE_ALPHA_START, POINT_TYPE_ALPHA_END, POINT_TYPE_TREE, POINT_TYPE_BETA } from './constants.js';
import { MathUtils } from './mathUtils.js';

export class CameraHandler extends EventTarget {
    constructor(pointsManager) {
        super();

        this._pointsManager = pointsManager;

        this._alphaStart = null;
        this._alphaEnd = null;
        this._beta = null;

        this._inFrustumCount = null;

        this._displayAlphaAngle = 0;
        this._displayBetaAngle = 0;

        this._acquireControlPoints();

        this._resetStates();

        this._onAlphaStartMovedEnter();
        this._onAlphaStartMovedUpdate();

        this._onBetaMovedEnter();
        this._onBetaMovedUpdate();

        this.checkPointsInFrustum();
    }

    get alphaAngle() {
        return this._displayAlphaAngle;
    }

    get betaAngle() {
        return this._displayBetaAngle;
    }

    _acquireControlPoints() {
        for (const point of this._pointsManager.points) {
            if (point.tags.includes(POINT_TYPE_ALPHA_START)) {
                this._alphaStart = point;
            } else if (point.tags.includes(POINT_TYPE_ALPHA_END)) {
                this._alphaEnd = point;
            } else if (point.tags.includes(POINT_TYPE_BETA)) {
                this._beta = point;
            }
        }

        if (this._alphaStart === null || this._beta === null) {
            throw new Error('Alpha start, alpha end and/or beta point(s) is/are missing.');
        }
    }

    _resetStates() {
        this._alphaStartMoveState = 'enter';
        this._betaMoveState = 'enter';
    }

    _computeAnglesAndLengths() {
        this._alphaStartAngle = MathUtils.computeAngle(this._alphaStart);
        this._alphaStartLength = MathUtils.distanceToOrigin(this._alphaStart);

        this._alphaEndAngle = MathUtils.computeAngle(this._alphaEnd);
        this._alphaEndLength = MathUtils.distanceToOrigin(this._alphaEnd);

        this._betaAngle = MathUtils.computeAngle(this._beta);
        this._betaLength = MathUtils.distanceToOrigin(this._beta);
    }

    _onAlphaStartMovedEnter() {
        this._computeAnglesAndLengths();
    }

    _onAlphaStartMovedUpdate() {
        const alphaStartAngle = MathUtils.computeAngle(this._alphaStart);

        const newBetaAngle = alphaStartAngle;
        const newBetaX = Math.cos(newBetaAngle) * this._betaLength;
        const newBetaY = Math.sin(newBetaAngle) * this._betaLength;

        this._pointsManager.movePoint(this._beta, newBetaX, newBetaY);
    }

    _onBetaMovedEnter() {
        this._computeAnglesAndLengths();
    }

    _onBetaMovedUpdate() {
        const betaAngle = MathUtils.computeAngle(this._beta);

        this._displayBetaAngle = -Math.round(
            MathUtils.radiansToDegrees(
                MathUtils.normalizeAngle(betaAngle)
            )
        );

        const newAlphaStartAngle = betaAngle;
        const newAlphaStartX = Math.cos(newAlphaStartAngle) * this._alphaStartLength;
        const newAlphaStartY = Math.sin(newAlphaStartAngle) * this._alphaStartLength;

        const newAlphaEndAngle = this._alphaEndAngle + (betaAngle - this._betaAngle);
        const newAlphaEndX = Math.cos(newAlphaEndAngle) * this._alphaEndLength;
        const newAlphaEndY = Math.sin(newAlphaEndAngle) * this._alphaEndLength;

        this._pointsManager.movePoint(this._alphaStart, newAlphaStartX, newAlphaStartY);
        this._pointsManager.movePoint(this._alphaEnd, newAlphaEndX, newAlphaEndY);
    }

    static _isInFrustum(pointAngle, alphaStartAngle, alphaEndAngle) {
        if (alphaStartAngle > alphaEndAngle) {
            return pointAngle <= alphaStartAngle && pointAngle >= alphaEndAngle;
        }

        return (pointAngle <= alphaEndAngle && pointAngle >= alphaStartAngle) === false;
    }

    checkPointsInFrustum() {
        const alphaStartAngle = MathUtils.normalizeAngle(MathUtils.computeAngle(this._alphaStart));
        const alphaEndAngle = MathUtils.normalizeAngle(MathUtils.computeAngle(this._alphaEnd));

        const alphaAngle = MathUtils.deltaAngle(alphaStartAngle, alphaEndAngle);

        this._displayAlphaAngle = Math.round(MathUtils.radiansToDegrees(alphaAngle));

        const realAlphaEndAngle = (alphaStartAngle - alphaAngle) % (Math.PI * 2);

        let count = 0;

        for (const point of this._pointsManager.points) {
            if (point.tags.includes(POINT_TYPE_TREE) === false) {
                continue;
            }

            const pointAngle = MathUtils.normalizeAngle(MathUtils.computeAngle(point));

            point.isInFrustum = CameraHandler._isInFrustum(pointAngle, alphaStartAngle, realAlphaEndAngle);

            if (point.isInFrustum) {
                count++;
            }
        }

        if (this._inFrustumCount !== count) {
            this.dispatchEvent(new CustomEvent('infrustumcount-changed', { detail: count }));
            this._inFrustumCount = count;
        }
    }

    onPointMoved(e) {
        if (e.detail.sourceType !== 'event') {
            return;
        }

        if (e.detail.point.tags.includes(POINT_TYPE_ALPHA_START)) {
            if (this._alphaStartMoveState === 'enter') {
                this._onAlphaStartMovedEnter();
                this._alphaStartMoveState = 'update';
            } else if (this._alphaStartMoveState === 'update') {
                this._onAlphaStartMovedUpdate();
            }
        } else if (e.detail.point.tags.includes(POINT_TYPE_BETA)) {
            if (this._betaMoveState === 'enter') {
                this._onBetaMovedEnter();
                this._betaMoveState = 'update';
            } else if (this._betaMoveState === 'update') {
                this._onBetaMovedUpdate();
            }
        }

        this.checkPointsInFrustum();
    }

    onPointMovedEnd() {
        this._resetStates();
    }
}
