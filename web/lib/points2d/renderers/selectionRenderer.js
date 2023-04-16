export class SelectionRenderer {
    constructor(ctx, pointsManager) {
        this._ctx = ctx;
        this._pointsManager = pointsManager;
    }

    render() {
        if (this._pointsManager.isMultiSelecting === false) {
            return;
        }

        const ctx = this._ctx;

        ctx.beginPath();

        ctx.rect(
            this._pointsManager.pointerDownX,
            this._pointsManager.pointerDownY,
            this._pointsManager.multiSelectionWidth,
            this._pointsManager.multiSelectionHeight
        );

        ctx.fillStyle = 'rgba(0, 178, 255, 0.25)';
        ctx.fill();

        ctx.strokeStyle = '#c0c0c0';
        ctx.strokeWidth = 1;
        ctx.stroke();
    }
}
