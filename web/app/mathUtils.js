export class MathUtils {
    // Transforms angle that goes from 0 to -180 and from +180 to 0
    // in an angle that goes from 0 to 360.
    static normalizeAngle(angle) {
        if (angle < 0 ) {
            return angle;
        }
        return angle - (Math.PI * 2);
    }

    static distance(x1, y1, x2, y2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static distanceToOrigin(p) {
        return MathUtils.distance(0, 0, p.x, p.y);
    }

    static deltaAngle(startAngle, endAngle) {
        if (startAngle > endAngle) {
            return startAngle - endAngle;
        }

        return (Math.PI * 2) - (endAngle - startAngle);
    }

    static computeAngle(p) {
        return Math.atan2(p.y, p.x);
    }
}
