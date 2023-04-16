export class GridRenderer {
    constructor(ctx) {
        this._ctx = ctx;
    }

    render() {
        const ctx = this._ctx;

        const halfWidth = ctx.canvas.clientWidth / 2;
        const halfHeight = ctx.canvas.clientHeight / 2;

        ctx.beginPath();

        ctx.moveTo(0, -halfHeight);
        ctx.lineTo(0, halfHeight);

        ctx.moveTo(-halfWidth, 0);
        ctx.lineTo(halfWidth, 0);

        ctx.strokeStyle = '#e0e0e0';
        ctx.stroke();
    }
}
