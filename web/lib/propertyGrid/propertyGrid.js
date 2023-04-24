export class Accessor extends EventTarget {
    constructor(valueGetter, valueSetter) {
        super();
        this._initialValue = valueGetter();
        this._currentValue = this._initialValue;
        this._valueGetter = valueGetter;
        this._valueSetter = valueSetter;
    }

    get() {
        return this._valueGetter();
    }

    set(value) {
        this._valueSetter(value);
        const hasChanged = this._currentValue !== value;
        this._currentValue = value;
        if (hasChanged) {
            this.dispatchEvent(new CustomEvent('value-changed'));
        }
    }

    reset() {
        this.set(this._initialValue);
    }
}

export class Binding {
    static htmlElement(element, eventType, elementAccessor) {
        element.addEventListener(eventType, () => {

        });
    }

    static oneWay(sourceAccessor, targetAccessor) {
        const onValueChanged = () => {
            targetAccessor.set(sourceAccessor.get());
        };
        sourceAccessor.addEventListener('value-changed', onValueChanged);
        return () => sourceAccessor.removeEventListener('value-changed', onValueChanged);
    }

    static oneWayToSource(sourceAccessor, targetAccessor) {
        const onValueChanged = () => {
            sourceAccessor.set(targetAccessor.get());
        };
        targetAccessor.addEventListener('value-changed', onValueChanged);
        return () => targetAccessor.removeEventListener('value-changed', onValueChanged);
    }

    static twoWay(sourceAccessor, targetAccessor) {
        const onSourceValueChanged = () => targetAccessor.set(sourceAccessor.get());
        const onTargetValueChanged = () => sourceAccessor.set(targetAccessor.get());
        sourceAccessor.addEventListener('value-changed', onSourceValueChanged);
        targetAccessor.addEventListener('value-changed', onTargetValueChanged);
        return () => {
            sourceAccessor.removeEventListener('value-changed', onSourceValueChanged);
            targetAccessor.removeEventListener('value-changed', onTargetValueChanged);
        };
    }
}

export class PropertyGrid {
    constructor(root) {
        this._root = root;
        this._disposeFunctions = [];
    }

    dispose() {
        for (const disposeFunction of this._disposeFunctions) {
            disposeFunction();
        }

        this._disposeFunctions = [];
    }

    title(element) {
        if (typeof element === 'string') {
            const temp = document.createElement('span');
            temp.innerText = element;
            element = temp;
        }

        element.classList.add('title');

        this._root.appendChild(element);
    }

    separator() {
        const sep = document.createElement('div');
        sep.classList.add('separator');
        this._root.appendChild(sep);
    }

    add(propertyId, keyElement, valueElement, resetFunction) {
        if (typeof keyElement === 'string') {
            const temp = document.createElement('span');
            temp.innerText = keyElement;
            keyElement = temp;
        }

        keyElement.classList.add('key', propertyId);
        valueElement.classList.add('value', propertyId);

        this._root.appendChild(keyElement);
        this._root.appendChild(valueElement);

        if (resetFunction) {
            const resetButton = document.createElement('button');
            resetButton.innerText = 'R';
            resetButton.title = 'Reset to initial value';

            if (typeof resetFunction === 'function') {
                resetButton.addEventListener('click', resetFunction);
                this._disposeFunctions.push(() => resetButton.removeEventListener('click', resetFunction));
            } else {
                const f = () => resetFunction.reset();
                resetButton.addEventListener('click', f);
                this._disposeFunctions.push(() => resetButton.removeEventListener('click', f));
            }

            this._root.appendChild(resetButton);
        } else {
            this._root.appendChild(document.createElement('span'));
        }
    }
}
