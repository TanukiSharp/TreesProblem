export class LassoSelectionRenderer {
    constructor(ctx, pointsManager) {
        this._ctx = ctx;
        this._pointsManager = pointsManager;
    }

    render() {
        if (this._pointsManager.isLassoSelecting === false) {
            return;
        }

        const ctx = this._ctx;

        ctx.beginPath();

        ctx.rect(
            this._pointsManager.pointerDownX,
            this._pointsManager.pointerDownY,
            this._pointsManager.lassoSelectionWidth,
            this._pointsManager.lassoSelectionHeight
        );

        ctx.fillStyle = 'rgba(0, 178, 255, 0.25)';
        ctx.fill();

        ctx.strokeStyle = '#c0c0c0';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}
