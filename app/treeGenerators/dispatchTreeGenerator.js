import { POINT_TYPE_TREE } from '../constants.js';
import { Point } from '../../lib/points2d/point.js';

export class DispatchTreeGenerator {
    constructor(canvasElement) {
        this._canvasElement = canvasElement;
    }

    get name() {
        return 'Dispatch';
    }

    get description() {
        return 'Generates trees with a completely random distribution.';
    }

    generate(count) {
        const halfWidth = this._canvasElement.width / 2;
        const halfHeight = this._canvasElement.height / 2;

        const result = [];

        for (let i = 0; i < count; i++) {
            result.push(new Point(
                ((Math.random() * 2) - 1) * halfWidth,
                ((Math.random() * 2) - 1) * halfHeight,
                {
                    id: 1000 + i + 1,
                    baseRadius: 7,
                    hoverRadius: 11,
                    tags: [POINT_TYPE_TREE]
                }
            ));
        }

        return result;
    }
}
