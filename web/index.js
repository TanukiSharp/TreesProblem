import { GridRenderer } from './lib/points2d/renderers/gridRenderer.js';
import { LassoSelectionRenderer } from './lib/points2d/renderers/selectionRenderer.js';
import { PointsManager } from './lib/points2d/pointsManager.js';
import { Point } from './lib/points2d/point.js';
import { PropertyGrid } from './lib/propertyGrid/propertyGrid.js';
import { Ui } from './ui.js';

const POINT_TYPE_TREE = 'tree';
const POINT_TYPE_BETA = 'beta';
const POINT_TYPE_ALPHA_START = 'alpha-start';
const POINT_TYPE_ALPHA_END = 'alpha-end';

class PointRenderer {
    constructor(ctx) {
        this._ctx = ctx;
    }

    render(p) {
        this._renderPoint(p);
    }

    _getFillColor(p) {
        if (p.tags.includes(POINT_TYPE_TREE)) {
            if (p.isInFrustum) {
                return 'royalblue';
                //return 'red';
            }
            return 'lightblue';
        } else if (p.tags.includes(POINT_TYPE_BETA)) {
            return 'lime';
        } else if (p.tags.includes(POINT_TYPE_ALPHA_START) || p.tags.includes(POINT_TYPE_ALPHA_END)) {
            return 'pink';
        }

        return 'black';
    }

    _getStrokeColor(p) {
        return 'black';
    }

    _getStrokeWidth(p) {
        if (p.isSelected) {
            if (p.isPointerOver) {
                return 4;
            }
            return 3;
        }
        return 1;
    }

    _renderPoint(p) {
        const ctx = this._ctx;

        ctx.beginPath();

        ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);

        ctx.fillStyle = this._getFillColor(p);
        ctx.fill();

        ctx.strokeStyle = this._getStrokeColor(p);
        ctx.lineWidth = this._getStrokeWidth(p);
        ctx.stroke();

        //ctx.font = '18px Arial';
        //const alphaAngle = CameraHandler.computeAngle(p);
        //ctx.fillText(`${p.id} (${-Math.round(CameraHandler.normalizeAngle(alphaAngle) * 180 / Math.PI)})`, p.x + 15, p.y + 5);
    }
}

class PointsRenderer {
    constructor(ctx, pointsManager) {
        this._ctx = ctx;
        this._pointsManager = pointsManager;
        this._pointRenderer = new PointRenderer(ctx);
    }

    render() {
        let renderAtLast = null;

        for (const point of this._pointsManager.points) {
            if (point.isPointerOver) {
                renderAtLast = point;
            } else {
                this._pointRenderer.render(point);
            }
        }

        if (renderAtLast !== null) {
            this._pointRenderer.render(renderAtLast);
        }
    }
}

class CameraRenderer {
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

        const alphaAngle = CameraHandler.normalizeAngle(CameraHandler.computeAngle(this._alphaEnd));
        const betaAngle = CameraHandler.normalizeAngle(CameraHandler.computeAngle(this._beta));

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

        const alphaAngleCenter = betaAngle - CameraHandler.deltaAngle(betaAngle, alphaAngle) / 2;

        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = 'rgba(255, 64, 64, 0.5)';
        const alphaText = `\u03b1: ${Math.round(CameraHandler.deltaAngle(betaAngle, alphaAngle) * 180 / Math.PI)}`;
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

class Renderer {
    constructor(canvas, pointsManager, controlPoints) {
        const ctx = canvas.getContext('2d');

        this._ctx = ctx;

        this.cameraRenderer = new CameraRenderer(ctx, controlPoints);

        this._renderers = [
            new GridRenderer(ctx),
            new PointsRenderer(ctx, pointsManager),
            this.cameraRenderer,
            new LassoSelectionRenderer(ctx, pointsManager),
        ];

        this._requestRender();
    }

    _render() {
        this._requestRender();

        const ctx = this._ctx;
        const canvas = ctx.canvas;

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        const halfWidth = canvas.clientWidth / 2;
        const halfHeight = canvas.clientHeight / 2;

        ctx.translate(halfWidth, halfHeight);
        ctx.clearRect(-halfWidth, -halfHeight, halfWidth, halfHeight);

        for (const renderer of this._renderers) {
            renderer.render();
        }
    }

    _requestRender() {
        window.requestAnimationFrame(() => this._render());
    }
}

class CameraHandler extends EventTarget {
    constructor(pointsManager, controlPoints) {
        super();

        this._pointsManager = pointsManager;
        this._alphaStart = null;
        this._alphaEnd = null;
        this._beta = null;

        this._inFrustumCount = null;

        for (const point of controlPoints) {
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

        this._resetStates();

        this._onAlphaStartMovedEnter();
        this._onAlphaStartMovedUpdate();

        this.checkPointsInFrustum();
    }

    _resetStates() {
        this._alphaStartMoveState = 'enter';
        this._betaMoveState = 'enter';
    }

    static distance(x1, y1, x2, y2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static distanceToOrigin(p) {
        return CameraHandler.distance(0, 0, p.x, p.y);
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

    _computeAnglesAndLengths() {
        this._alphaStartAngle = CameraHandler.computeAngle(this._alphaStart);
        this._alphaStartLength = CameraHandler.distanceToOrigin(this._alphaStart);

        this._alphaEndAngle = CameraHandler.computeAngle(this._alphaEnd);
        this._alphaEndLength = CameraHandler.distanceToOrigin(this._alphaEnd);

        this._betaAngle = CameraHandler.computeAngle(this._beta);
        this._betaLength = CameraHandler.distanceToOrigin(this._beta);
    }

    _onAlphaStartMovedEnter(e) {
        this._computeAnglesAndLengths();
    }

    _onAlphaStartMovedUpdate(e) {
        const alphaStartAngle = CameraHandler.computeAngle(this._alphaStart);

        const newBetaAngle = alphaStartAngle;
        const newBetaX = Math.cos(newBetaAngle) * this._betaLength;
        const newBetaY = Math.sin(newBetaAngle) * this._betaLength;

        this._pointsManager.movePoint(this._beta, newBetaX, newBetaY);
    }

    _onBetaMovedEnter() {
        this._computeAnglesAndLengths();
    }

    _onBetaMovedUpdate() {
        const betaAngle = CameraHandler.computeAngle(this._beta);

        const newAlphaStartAngle = betaAngle;
        const newAlphaStartX = Math.cos(newAlphaStartAngle) * this._alphaStartLength;
        const newAlphaStartY = Math.sin(newAlphaStartAngle) * this._alphaStartLength;

        const newAlphaEndAngle = this._alphaEndAngle + (betaAngle - this._betaAngle);
        const newAlphaEndX = Math.cos(newAlphaEndAngle) * this._alphaEndLength;
        const newAlphaEndY = Math.sin(newAlphaEndAngle) * this._alphaEndLength;

        this._pointsManager.movePoint(this._alphaStart, newAlphaStartX, newAlphaStartY);
        this._pointsManager.movePoint(this._alphaEnd, newAlphaEndX, newAlphaEndY);
    }

    static normalizeAngle(angle) {
        if (angle < 0 ) {
            return angle;
        }
        return angle - (Math.PI * 2);
    }

    static _isInFrustum(pointAngle, alphaStartAngle, alphaEndAngle) {
        if (alphaStartAngle > alphaEndAngle) {
            return pointAngle <= alphaStartAngle && pointAngle >= alphaEndAngle;
        }

        return !(pointAngle <= alphaEndAngle && pointAngle >= alphaStartAngle);
    }

    checkPointsInFrustum() {
        const alphaStartAngle = CameraHandler.normalizeAngle(CameraHandler.computeAngle(this._alphaStart));
        const alphaEndAngle = CameraHandler.normalizeAngle(CameraHandler.computeAngle(this._alphaEnd));

        const alphaAngle = CameraHandler.deltaAngle(alphaStartAngle, alphaEndAngle);

        const realAlphaEndAngle = (alphaStartAngle - alphaAngle) % (Math.PI * 2);

        let count = 0;

        for (const point of this._pointsManager.points) {
            if (point.tags.includes(POINT_TYPE_TREE) === false) {
                continue;
            }

            const pointAngle = CameraHandler.normalizeAngle(CameraHandler.computeAngle(point));

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

const createPropertyGridTitleElement = function(text) {
    const root = document.createElement('div');

    const head = document.createElement('div');
    head.classList.add('head');
    const textElement = document.createElement('span');
    textElement.classList.add('content');
    textElement.innerText = text;
    const tail = document.createElement('div');
    tail.classList.add('tail');

    root.appendChild(head);
    root.appendChild(textElement);
    root.appendChild(tail);

    return root;
}

class DispatchTreeGenerator {
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

class CircleTreeGenerator {
    get name() {
        return 'Circle';
    }

    get description() {
        return 'Generates trees in circle, with a random radius.';
    }

    generate(count) {
        const treeRadius = 150;
        const tau = Math.PI * 2;

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

const treeGenerators = [];

const generatorToDropdownInfo = function(generator) {
    return {
        text: generator.name,
        title: generator.description,
    };
}

const setupGeneratorPropertyGridSection = function(propertyGrid, pointsManager, cameraHandler, controlPoints) {
    propertyGrid.title(createPropertyGridTitleElement('Generator'));

    let generateTrees;

    const treesSliderInfo = Ui.createSlider(30, 1, 90);
    const continuousGenerationCheckboxInfo = Ui.createCheckbox(false);
    const generatorTypeDropdownInfo = Ui.createIndexedDropdown(treeGenerators.map(generatorToDropdownInfo));
    const generateButtonInfo = Ui.createButton('Generate', () => generateTrees());

    generateTrees = () => {
        const treesCount = treesSliderInfo.accessor.get();
        const generatorIndex = generatorTypeDropdownInfo.accessor.get();

        pointsManager.points = treeGenerators[generatorIndex].generate(treesCount);
        pointsManager.points.push(...controlPoints);

        cameraHandler.checkPointsInFrustum();
    };

    treesSliderInfo.accessor.addEventListener('value-changed', () => {
        if (continuousGenerationCheckboxInfo.accessor.get()) {
            generateTrees();
        }
    });

    generatorTypeDropdownInfo.accessor.addEventListener('value-changed', () => {
        if (continuousGenerationCheckboxInfo.accessor.get()) {
            generateTrees();
        }
    });

    continuousGenerationCheckboxInfo.accessor.addEventListener('value-changed', () => {
        generateButtonInfo.element.disabled = continuousGenerationCheckboxInfo.accessor.get();
        generateTrees();
    });

    propertyGrid.add(null, 'Tree count:', treesSliderInfo.element, treesSliderInfo.accessor);
    propertyGrid.add(null, 'Type:', generatorTypeDropdownInfo.element);
    propertyGrid.add(null, Ui.createSpan('Continuous gen.:', 'Continuous generation. Generates trees each time parameters change.'), continuousGenerationCheckboxInfo.element);
    propertyGrid.add(null, '', generateButtonInfo.element);

    cameraHandler.addEventListener('infrustumcount-changed', e => console.log(e.detail));
}

const setupEmphasisPropertyGridSection = function(propertyGrid, cameraRenderer) {

    propertyGrid.title(createPropertyGridTitleElement('Emphasis'));

    const emphasisDropdownInfo = Ui.createValuedDropdown([
        {
            text: 'None',
            value: 'none',
        },
        {
            text: 'Inner view',
            value: 'inner',
        },
        {
            text: 'Outer view',
            value: 'outer',
        }
    ]);
    emphasisDropdownInfo.accessor.set('inner');

    propertyGrid.add(null, 'Emphasis:', emphasisDropdownInfo.element);

    const emphasisAlphaSliderInfo = Ui.createSlider(cameraRenderer.emphasisAlpha, 0.05, 0.5, 0.001);
    propertyGrid.add(null, 'Transparency:', emphasisAlphaSliderInfo.element, emphasisAlphaSliderInfo.accessor);

    emphasisDropdownInfo.accessor.addEventListener('value-changed', () => {
        cameraRenderer.emphasisDirection = emphasisDropdownInfo.accessor.get();
        // Dirty access hack (childNodes[0]) because the slider element is actually a div with a slider and span.
        emphasisAlphaSliderInfo.element.childNodes[0].disabled = cameraRenderer.emphasisDirection === 'none';
    });

    emphasisAlphaSliderInfo.accessor.addEventListener('value-changed', () => {
        cameraRenderer.emphasisAlpha = emphasisAlphaSliderInfo.accessor.get();
    });
}

const setupPropertyGrid = function(propertyGrid, pointsManager, cameraHandler, cameraRenderer, controlPoints) {
    setupGeneratorPropertyGridSection(propertyGrid, pointsManager, cameraHandler, controlPoints);
    setupEmphasisPropertyGridSection(propertyGrid, cameraRenderer);
}

const main = function() {
    const canvasElement = document.querySelector('.root-container > canvas.render');
    const propertyGridElement = document.querySelector('.root-container > .side-bar > .property-grid-scroller > .property-grid');

    treeGenerators.push(new DispatchTreeGenerator(canvasElement));
    treeGenerators.push(new CircleTreeGenerator());


    const propertyGrid = new PropertyGrid(propertyGridElement);

    const alphaStart = new Point(40, -120, { id: 1, baseRadius: 9, hoverRadius: 12, tags: [POINT_TYPE_ALPHA_START] });
    const alphaEnd = new Point(-40, -120, { id: 2, baseRadius: 9, hoverRadius: 12, tags: [POINT_TYPE_ALPHA_END] });
    const beta = new Point(120, 120, { id: 3, baseRadius: 9, hoverRadius: 12, tags: [POINT_TYPE_BETA] });

    const controlPoints = [
        alphaStart,
        alphaEnd,
        beta,
    ];


    // points.push(
    //     new Point(150, 150, { id: 1001, baseRadius: 7, hoverRadius: 11, tags: [POINT_TYPE_TREE] }),
    //     new Point(150, 90, { id: 1002, baseRadius: 7, hoverRadius: 11, tags: [POINT_TYPE_TREE] }),
    //     new Point(90, 150, { id: 1003, baseRadius: 7, hoverRadius: 11, tags: [POINT_TYPE_TREE] }),
    //     new Point(90, 90, { id: 1004, baseRadius: 7, hoverRadius: 11, tags: [POINT_TYPE_TREE] }),
    // );

    const pointsManager = new PointsManager(canvasElement);

    const cameraHandler = new CameraHandler(pointsManager, controlPoints);

    pointsManager.addEventListener('pointmove', e => cameraHandler.onPointMoved(e));
    canvasElement.addEventListener('pointerup', _ => cameraHandler.onPointMovedEnd());

    const renderer = new Renderer(canvasElement, pointsManager, controlPoints);

    setupPropertyGrid(propertyGrid, pointsManager, cameraHandler, renderer.cameraRenderer, controlPoints);
}

window.addEventListener('load', main);
