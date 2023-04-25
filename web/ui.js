import { Accessor } from './lib/propertyGrid/propertyGrid.js';

export class Ui {
    static createSpan(text, title) {
        const span = document.createElement('span');
        span.innerText = text;

        if (typeof title === 'string' && title.length > 0) {
            span.title = title;
        }

        return span;
    }

    static createSpan(text, title) {
        const span = document.createElement('span');
        span.innerText = text;

        if (typeof title === 'string' && title.length > 0) {
            span.title = title;
        }

        return span;
    }

    static createSlider(initialValue, min, max, step) {
        const container = document.createElement('div');
        container.classList.add('slider-container');

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = initialValue;

        const label = document.createElement('span');
        label.innerText = initialValue;

        const accessor = new Accessor(
            () => Number(slider.value),
            v => { slider.value = Number(v); label.innerText = v; }
        );

        const onInput = () => accessor.set(slider.value);

        slider.addEventListener('input', onInput);

        container.appendChild(slider);
        container.appendChild(label);

        return {
            element: container,
            accessor: accessor,
            dispose: () => slider.removeEventListener('input', onInput),
        };
    }

    static createCheckbox(initialValue) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = initialValue;

        const accessor = new Accessor(() => Boolean(checkbox.checked), v => checkbox.checked = Boolean(v));

        const onInput = () => accessor.set(checkbox.checked);

        checkbox.addEventListener('input', onInput);

        return {
            element: checkbox,
            accessor: accessor,
            dispose: () => checkbox.removeEventListener('input', onInput),
        };
    }

    static createIndexedDropdown(values) {
        const select = document.createElement('select');

        for (const value of values) {
            if (value === undefined || value === null) {
                continue;
            }

            const option = document.createElement('option');

            if (typeof value === 'string') {
                option.text = value;
            } else if (typeof value.text === 'string') {
                option.text = value.text;
                if (typeof value.title === 'string') {
                    option.title = value.title;
                }
            } else {
                continue;
            }

            select.appendChild(option);
        }

        const accessor = new Accessor(() => select.selectedIndex, v => select.selectedIndex = v);

        const onInput = () => accessor.set(select.selectedIndex);

        select.addEventListener('input', onInput);

        return {
            element: select,
            accessor: accessor,
            dispose: () => select.removeEventListener('input', onInput),
        };
    }

    static _findDropdownIndexByValue(select, value) {
        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].value === value) {
                return i;
            }
        }

        return -1;
    }

    static createValuedDropdown(values) {
        const select = document.createElement('select');

        for (const value of values) {
            if (value === undefined || value === null) {
                continue;
            }

            const option = document.createElement('option');

            option.text = value.text;
            option.value = value.value;

            if (typeof value.title === 'string') {
                option.title = value.title;
            }

            select.appendChild(option);
        }

        const accessor = new Accessor(
            () => select.options[select.selectedIndex].value,
            v => select.selectedIndex = Ui._findDropdownIndexByValue(select, v),
        );

        const onInput = () => accessor.set(select.options[select.selectedIndex].value);

        select.addEventListener('input', onInput);

        return {
            element: select,
            accessor: accessor,
            dispose: () => select.removeEventListener('input', onInput),
        };
    }

    static createButton(text, onClick) {
        const button = document.createElement('button');
        button.innerText = text;
        button.addEventListener('click', onClick);

        return {
            element: button,
            dispose: () => button.removeEventListener('click', onClick),
        };
    }
}
