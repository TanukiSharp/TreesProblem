import { POINT_TYPE_ALPHA_START, POINT_TYPE_ALPHA_END, POINT_TYPE_BETA } from './app/constants.js';
import { PointsManager } from './lib/points2d/pointsManager.js';
import { Point } from './lib/points2d/point.js';
import { PropertyGrid } from './lib/propertyGrid/propertyGrid.js';
import { CameraHandler } from './app/cameraHandler.js';
import { RootRenderer } from './app/renderers/rootRenderer.js';
import { DispatchTreeGenerator } from './app/treeGenerators/dispatchTreeGenerator.js';
import { CircleTreeGenerator } from './app/treeGenerators/circleTreeGenerator.js';
import { Ui } from './app/ui.js';

const COMMITHASH = '?';

const treeGenerators = [];

const generatorToDropdownInfo = function(generator) {
    return {
        text: generator.name,
        title: generator.description,
    };
}

const setupIndicatorsPropertyGridSection = function(propertyGrid, pointsManager, cameraHandler) {
    propertyGrid.title(Ui.createPropertyGridTitleElement('Indicators'));

    const treesInFrustum = Ui.createIndicator('0');
    const maxTreesInFrustum = Ui.createIndicator('0');

    const clearButtonInfo = Ui.createButton('Clear max', () => maxTreesInFrustum.accessor.set(0));

    const alphaAngleInfo = Ui.createIndicator('0°');
    const betaAngleInfo = Ui.createIndicator('0°');

    pointsManager.addEventListener('pointmove', e => {
        if (e.detail.point.tags.includes(POINT_TYPE_ALPHA_START) ||
            e.detail.point.tags.includes(POINT_TYPE_ALPHA_END)) {
            alphaAngleInfo.accessor.set(`${cameraHandler.alphaAngle}°`);
        } else if (e.detail.point.tags.includes(POINT_TYPE_BETA)) {
            betaAngleInfo.accessor.set(`${cameraHandler.betaAngle}°`);
        }
    });

    propertyGrid.add('alpha-angle', 'Alpha:', alphaAngleInfo.element);
    propertyGrid.add('beta-angle', 'Beta:', betaAngleInfo.element);

    propertyGrid.add(null, 'Trees in frustum:', treesInFrustum.element);
    propertyGrid.add(null, 'Max trees in frustum:', maxTreesInFrustum.element);
    propertyGrid.add(null, '', clearButtonInfo.element);

    cameraHandler.addEventListener('infrustumcount-changed', e => {
        maxTreesInFrustum.accessor.set(Math.max(maxTreesInFrustum.accessor.get(), e.detail));
        treesInFrustum.accessor.set(e.detail);
    });
}

const setupGeneratorPropertyGridSection = function(propertyGrid, pointsManager, cameraHandler, controlPoints) {
    propertyGrid.title(Ui.createPropertyGridTitleElement('Generator'));

    let generateTrees;

    const treesSliderInfo = Ui.createSlider(30, 1, 90);
    const continuousGenerationCheckboxInfo = Ui.createCheckbox(false);
    const generatorTypeDropdownInfo = Ui.createIndexedDropdown(treeGenerators.map(generatorToDropdownInfo));
    const generateButtonInfo = Ui.createButton('Generate', () => generateTrees());

    generateTrees = () => {
        const treesCount = treesSliderInfo.accessor.get();
        const generatorIndex = generatorTypeDropdownInfo.accessor.get();

        const newPoints = treeGenerators[generatorIndex].generate(treesCount);
        newPoints.push(...controlPoints);

        pointsManager.setNewPoints(newPoints);

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
        if (continuousGenerationCheckboxInfo.accessor.get()) {
            generateTrees();
        }
    });

    propertyGrid.add(null, 'Tree count:', treesSliderInfo.element, treesSliderInfo.accessor);
    propertyGrid.add(null, 'Type:', generatorTypeDropdownInfo.element);
    propertyGrid.add(null, Ui.createSpan('Continuous gen.:', 'Continuous generation. Generates trees each time parameters change.'), continuousGenerationCheckboxInfo.element);
    propertyGrid.add(null, '', generateButtonInfo.element);

    generateTrees();
}

const setupEmphasisPropertyGridSection = function(propertyGrid, cameraRenderer) {
    propertyGrid.title(Ui.createPropertyGridTitleElement('Emphasis'));

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
    setupIndicatorsPropertyGridSection(propertyGrid, pointsManager, cameraHandler);
    setupGeneratorPropertyGridSection(propertyGrid, pointsManager, cameraHandler, controlPoints);
    setupEmphasisPropertyGridSection(propertyGrid, cameraRenderer);
}

const main = function() {
    const gitInfo = document.querySelector('.root-container > .side-bar > .git-info');
    gitInfo.innerText = COMMITHASH.substring(0, 9);

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

    const pointsManager = new PointsManager(canvasElement, controlPoints);

    const cameraHandler = new CameraHandler(pointsManager, controlPoints);

    pointsManager.addEventListener('pointmove', e => cameraHandler.onPointMoved(e));
    canvasElement.addEventListener('pointerup', _ => cameraHandler.onPointMovedEnd());

    const rootRenderer = new RootRenderer(canvasElement, pointsManager);

    setupPropertyGrid(propertyGrid, pointsManager, cameraHandler, rootRenderer.cameraRenderer, controlPoints);
}

window.addEventListener('load', main);
