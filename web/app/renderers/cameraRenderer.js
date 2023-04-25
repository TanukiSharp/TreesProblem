import { POINT_TYPE_ALPHA_START, POINT_TYPE_ALPHA_END, POINT_TYPE_BETA } from '../constants.js';
import { MathUtils } from '../mathUtils.js';

export class CameraRenderer {
    constructor(ctx, controlPoints) {
        this._ctx = ctx;

        this._emphasisColor = null;
        this.emphasisDirection = 'inner';
        this.emphasisAlpha = 0.075;

        this._alphaStart = null;
        this._alphaEnd = null;
        this._beta = null;

        for (const point of controlPoints) {
            if (point.tags.includes(POINT_TYPE_ALPHA_START)) {
                this._alphaStart = point;
            } else if (point.tags.includes(POINT_TYPE_ALPHA_END)) {
                this._alphaEnd = point;
            } else if (point.tags.includes(POINT_TYPE_BETA)) {
                this._beta = point;
            }
        }

        if (this._alphaStart === null || this._alphaEnd === null || this._beta === null) {
            throw new Error('Alpha start, alpha end and/or beta point(s) is/are missing.');
        }
    }

    get emphasisAlpha() {
        return this._emphasisAlpha;
    }

    set emphasisAlpha(value) {
        if (value !== this._emphasisAlpha) {
            this._emphasisColor = `rgba(0, 0, 0, ${value})`;
            this._emphasisAlpha = value;
        }
    }

    render() {
        const ctx = this._ctx;

        const alphaAngle = MathUtils.normalizeAngle(MathUtils.computeAngle(this._alphaEnd));
        const betaAngle = MathUtils.normalizeAngle(MathUtils.computeAngle(this._beta));

        const lineLength = Math.max(ctx.canvas.clientWidth, ctx.canvas.clientHeight);

        const alphaX = Math.cos(alphaAngle) * lineLength;
        const alphaY = Math.sin(alphaAngle) * lineLength;

        const betaX = Math.cos(betaAngle) * lineLength;
        const betaY = Math.sin(betaAngle) * lineLength;

        const rad = Math.max(ctx.canvas.width, ctx.canvas.height);

        // Draw emphasis.
        if (this.emphasisDirection !== 'none') {
            const counterClockwise = this.emphasisDirection === 'inner';

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(betaAngle) * rad, Math.sin(betaAngle) * rad);
            ctx.arc(0, 0, rad, betaAngle, alphaAngle, counterClockwise);
            ctx.lineTo(0, 0);
            ctx.fillStyle = this._emphasisColor;
            ctx.fill();
        }

        // Draw alpha arc.
        ctx.beginPath();
        ctx.arc(0, 0, 30, betaAngle, alphaAngle, true);
        ctx.lineWidth = 15;
        ctx.strokeStyle = 'rgba(255, 64, 64, 0.5)';
        ctx.stroke();

        const alphaAngleCenter = betaAngle - MathUtils.deltaAngle(betaAngle, alphaAngle) / 2;

        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = 'rgba(255, 64, 64, 0.5)';
        const alphaText = `\u03b1: ${Math.round(MathUtils.deltaAngle(betaAngle, alphaAngle) * 180 / Math.PI)}`;
        const alphaTextX = Math.cos(alphaAngleCenter) * 60;
        const alphaTextY = Math.sin(alphaAngleCenter) * 60;
        ctx.fillText(alphaText, alphaTextX, alphaTextY);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'red';
        ctx.strokeText(alphaText, alphaTextX, alphaTextY);

        // Draw beta arc.
        ctx.beginPath();
        ctx.arc(0, 0, 50, 0, betaAngle, true);
        ctx.lineWidth = 15;
        ctx.strokeStyle = 'rgba(0, 255, 64, 0.5)';
        ctx.stroke();

        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = 'rgba(0, 255, 64, 0.5)';
        const betaText = `\u03b2: ${Math.round(-betaAngle * 180 / Math.PI)}`;
        const betaTextX = Math.cos(betaAngle - (betaAngle / 2)) * 60;
        const betaTextY = Math.sin(betaAngle - (betaAngle / 2)) * 60;
        ctx.fillText(betaText, betaTextX, betaTextY);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'green';
        ctx.strokeText(betaText, betaTextX, betaTextY);

        // Draw camera end line. (alpha)
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(alphaX, alphaY);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#a0a0a0';
        ctx.stroke();

        // Draw camera start line. (beta)
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(betaX, betaY);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#a0a0a0';
        ctx.stroke();
    }
}
