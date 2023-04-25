import { POINT_TYPE_ALPHA_START, POINT_TYPE_ALPHA_END, POINT_TYPE_BETA } from './app/constants.js';
import { PointsManager } from './lib/points2d/pointsManager.js';
import { Point } from './lib/points2d/point.js';
import { PropertyGrid } from './lib/propertyGrid/propertyGrid.js';
import { CameraHandler } from './app/cameraHandler.js';
import { RootRenderer } from './app/renderers/rootRenderer.js';
import { DispatchTreeGenerator } from './app/treeGenerators/dispatchTreeGenerator.js';
import { CircleTreeGenerator } from './app/treeGenerators/circleTreeGenerator.js';
import { Ui } from './ui.js';

const treeGenerators = [];

const generatorToDropdownInfo = function(generator) {
    return {
        text: generator.name,
        title: generator.description,
    };
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
        if (continuousGenerationCheckboxInfo.accessor.get()) {
            generateTrees();
        }
    });

    propertyGrid.add(null, 'Tree count:', treesSliderInfo.element, treesSliderInfo.accessor);
    propertyGrid.add(null, 'Type:', generatorTypeDropdownInfo.element);
    propertyGrid.add(null, Ui.createSpan('Continuous gen.:', 'Continuous generation. Generates trees each time parameters change.'), continuousGenerationCheckboxInfo.element);
    propertyGrid.add(null, '', generateButtonInfo.element);
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

    const pointsManager = new PointsManager(canvasElement);

    const cameraHandler = new CameraHandler(pointsManager, controlPoints);

    pointsManager.addEventListener('pointmove', e => cameraHandler.onPointMoved(e));
    canvasElement.addEventListener('pointerup', _ => cameraHandler.onPointMovedEnd());

    const rootRenderer = new RootRenderer(canvasElement, pointsManager, controlPoints);

    setupPropertyGrid(propertyGrid, pointsManager, cameraHandler, rootRenderer.cameraRenderer, controlPoints);
}

window.addEventListener('load', main);
