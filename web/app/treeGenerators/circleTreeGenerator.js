import { POINT_TYPE_TREE } from '../constants.js';
import { Point } from '../../lib/points2d/point.js';

const treeRadius = 150;
const tau = Math.PI * 2;

export class CircleTreeGenerator {
    get name() {
        return 'Circle';
    }

    get description() {
        return 'Generates trees in circle, with a random radius.';
    }

    generate(count) {
        const result = [];

        for (let i = 0; i < count; i++) {
            const angle = (tau * i) / count;

            result.push(new Point(
                Math.cos(angle) * treeRadius,
                Math.sin(angle) * treeRadius,
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
