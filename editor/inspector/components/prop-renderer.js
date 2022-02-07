/**
 * @typedef {Object} PropDump
 * @property {string} name - property name
 * @property {string} type - property type
 * @property {string} path - property find path
 * @property {any} default - property default value
 * @property {any} value - property current value
 * @property {string[]} extends - property extends
 * @property {boolean} readonly - is property readonly
 * @property {boolean} visible - is property visible
 * @property {Group} [group] - which group belong to
 * @property {string} displayName
 * @property {string} tooltip
 * @property {number} [displayOrder]
 * @property {boolean} [animatable]
 * @property {number} [max]
 * @property {number} [min]
 * @property {number} [step]
 * @property {boolean} [slide]
 * @property {boolean} [isArray] - array property symbol
 * @property {{name: string, value: any}} [enumList] - enum property symbol
 * @property {any} [elementTypeData]
 */

function capitalize(str) {
    return str.replace(/\b(\w)(\w*)/g, ($0, $1, $2) => {
        return $1.toUpperCase() + $2;
    });
}

/**
 * create label HTMLElement
 * @param {PropDump | PropDump[][]} prop
 * @return {HTMLElement}
 */
function createLabelElement(prop) {
    const $label = document.createElement('ui-label');
    let displayName = prop.displayName ? prop.displayName : prop.name;

    if (displayName.startsWith('_')) {
        displayName = displayName.substring(1);
    }

    displayName = capitalize(displayName);

    if (prop.tooltip) {
        $label.setAttribute('tooltip', prop.tooltip);
    }

    $label.setAttribute('slot', 'label');
    $label.setAttribute('value', displayName);

    return $label;
}

/**
 * create content HTMLElement
 * @param {string} tag
 * @param {PropDump | PropDump[][]} prop
 * @return {HTMLElement}
 */
function createContentElement(tag, prop) {
    const $content = document.createElement(tag);
    $content.setAttribute('slot', 'content');

    if (prop.readonly) {
        $content.setAttribute('disabled', String(true));
    }

    return $content;
}

/**
 * create layout
 * @param {PropDump | PropDump[][]} prop
 * @return {HTMLElement}
 */
function createPropContainer(prop) {
    const $prop = document.createElement('ui-prop');

    $prop.setAttribute('type', 'dump');
    $prop.setAttribute('dump', prop.type);

    if (prop.readonly) {
        $prop.setAttribute('readonly', String(prop.readonly));
    }

    return $prop;
}

/**
 * create string prop
 * @param {PropDump | PropDump[][]} prop
 * @return {HTMLElement}
 */
function createStringProp(prop) {
    const $prop = createPropContainer(prop);
    const $label = createLabelElement(prop);
    const $content = createContentElement('ui-input', prop);

    $content.value = prop.default ? prop.default : prop.value;

    $prop.appendChild($label);
    $prop.appendChild($content);

    return $prop;
}

/**
 * create number prop with `ui-input` component
 * @param {PropDump | PropDump[][]} prop
 * @return {HTMLElement}
 */
function createNumberInputProp(prop) {
    const $prop = createPropContainer(prop);
    const $label = createLabelElement(prop);
    const $content = createContentElement('ui-num-input', prop);

    $content.setAttribute('default', prop.default ? prop.default : prop.value);
    $content.setAttribute('value', prop.default ? prop.default : prop.value);

    $prop.appendChild($label);
    $prop.appendChild($content);

    return $prop;
}

/**
 * create slide prop with `ui-slider` component
 * @param {PropDump | PropDump[][]} prop
 * @return {HTMLElement}
 */
function createNumberSliderProp(prop) {
    const $prop = createPropContainer(prop);
    const $label = createLabelElement(prop);
    const $content = createContentElement('ui-slider', prop);

    $content.setAttribute('default', prop.default < prop.min ? prop.min : prop.default);
    $content.setAttribute('value', prop.default < prop.min ? prop.min : prop.default);
    $content.setAttribute('max', prop.max);
    $content.setAttribute('min', prop.min);

    $prop.appendChild($label);
    $prop.appendChild($content);

    return $prop;
}

/**
 * create boolean prop
 * @param {PropDump | PropDump[][]} prop
 * @return {HTMLElement}
 */
function createBooleanProp(prop) {
    const $prop = createPropContainer(prop);
    const $label = createLabelElement(prop);
    const $content = createContentElement('ui-checkbox', prop);

    $content.setAttribute('default', prop.default);
    $content.setAttribute('value', prop.value);

    $prop.appendChild($label);
    $prop.appendChild($content);

    return $prop;
}

/**
 * create enum prop
 * @param {PropDump | PropDump[][]} prop
 * @return {HTMLElement}
 */
function createEnumProp(prop) {
    const $prop = createPropContainer(prop);
    const $label = createLabelElement(prop);
    const $content = createContentElement('ui-select', prop);

    $content.setAttribute('value', prop.default);

    const { enumList } = prop;

    for (let i = 0; i < enumList.length; i++) {
        const item = enumList[i];
        const $option = document.createElement('option');
        $option.setAttribute('value', item.value);
        $option.textContent = item.name;
        $content.appendChild($option);
    }

    $prop.appendChild($label);
    $prop.appendChild($content);

    return $prop;
}

/**
 * create asset prop
 * @param {PropDump | PropDump[][]} prop
 * @return {HTMLElement}
 */
function createScriptProp(prop) {
    const $prop = createPropContainer(prop);
    const $label = createLabelElement(prop);
    const $content = createContentElement('ui-asset', prop);

    if (prop.readonly) {
        $content.setAttribute('disabled', String(true));
    }

    const value = prop.value;
    $content.setAttribute('value', value.uuid);
    $content.setAttribute('placeholder', 'cc.Script');
    $content.setAttribute('droppable', 'cc.Script');
    $content.setAttribute('effective', String(true));

    $prop.appendChild($label);
    $prop.appendChild($content);

    return $prop;
}

/**
 * create node prop
 * @param {PropDump | PropDump[][]} prop
 * @return {HTMLElement}
 */
function createNodeProp(prop) {
    const $prop = createPropContainer(prop);
    const $label = createLabelElement(prop);
    const $content = createContentElement('ui-node', prop);

    $content.setAttribute('droppable', prop.type);
    $content.setAttribute('placeholder', prop.type);

    $prop.appendChild($label);
    $prop.appendChild($content);

    return $prop;
}

/**
 * create array prop
 * @param {PropDump | PropDump[][]} prop
 * @return {HTMLElement}
 */
function createArrayProp(prop) {
    // layout: $container -> $section -> [$label, $content(ui-input-num), $arrContent]

    const $container = document.createElement('ui-prop');
    $container.setAttribute('type', 'dump');
    $container.setAttribute('dump', 'Array');
    $container.setAttribute('no-label', String(true));

    const $section = document.createElement('ui-section');
    $section.setAttribute('no-border', String(true));
    $section.setAttribute('cache-expand', `root-${prop.path}`);

    const $arrHeaderLabel = document.createElement('ui-label');
    $arrHeaderLabel.setAttribute('class', 'prop-name');
    $arrHeaderLabel.setAttribute('slot', 'header');
    $arrHeaderLabel.setAttribute('value', prop.name);

    const $arrHeaderContent = document.createElement('ui-num-input');
    $arrHeaderContent.setAttribute('class', 'prop-content');
    $arrHeaderContent.setAttribute('slot', 'header');
    $arrHeaderContent.setAttribute('step', String(1));
    $arrHeaderContent.setAttribute('default', String(prop.value.length));
    $arrHeaderContent.setAttribute('value', String(prop.value.length));

    const $arrContent = document.createElement('div');
    $arrContent.setAttribute('class', 'content');


    const { value: props } = prop;
    for (let i = 0; i < props.length; i++) {
        const propItem = props[i];

        const $prop = createByType(propItem);

        const $arrItem = document.createElement('div');
        const $dragTool = document.createElement('span');
        const $delTool = document.createElement('div');
        const $dustbinIcon = document.createElement('ui-icon');

        $prop.style.cssText = `
            flex: 1;
        `;

        $arrItem.style.cssText = `
            display: flex;
            padding: 0 6px 0 14px;
            position: relative;
            border-top: 2px solid transparent;
            border-bottom: 2px solid transparent;
        `;

        $dragTool.style.cssText = `
            width: 6px;
            position: absolute;
            left: 0; top: 5px;
            bottom: 0;
            cursor: move;
            background: linear-gradient(45deg,
                            var(--color-normal-border) 25%,
                            var(--color-normal-fill) 0,
                            var(--color-normal-fill) 50%,
                            var(--color-normal-border) 0,
                            var(--color-normal-border) 75%,
                            var(--color-normal-fill) 0);
            background-size: 6px 6px;
        `;

        $delTool.style.cssText = `
            position: relative;
            width: 1em;
            padding-left: 4px;
        `;

        $dustbinIcon.style.cssText = `
            position: absolute;
            bottom: calc(50% - 14px);
            cursor: pointer;
        `;

        $dustbinIcon.setAttribute('value', 'del');
        $dustbinIcon.shadowRoot
            .querySelector('.icon-del')
            .setAttribute('color', String(false));
        $dragTool.setAttribute('draggable', String(true));

        $delTool.appendChild($dustbinIcon);
        $arrItem.appendChild($dragTool);
        $arrItem.appendChild($prop);
        $arrItem.appendChild($delTool);
        $arrContent.appendChild($arrItem);
    }

    $section.appendChild($arrHeaderLabel);
    $section.appendChild($arrHeaderContent);
    $section.appendChild($arrContent);
    $container.appendChild($section);

    return $container;
}

/**
 * create prop group
 * @param {HTMLElement & {$propList: { [x: string]: HTMLElement }, $groups: { [x: string]: HTMLElement }}} $panel
 * @param {PropDump[][]} propGroup
 * @return {HTMLElement}
 */
function createPropGroup($panel, propGroup) {
    // TODO: handle group
    const $group = document.createElement('div');
    const $tabHeader = document.createElement('ui-tab');

    $tabHeader.setAttribute('class', 'tab-header');
    $group.setAttribute('class', 'tab-group');
    $group.appendChild($tabHeader);

    for (let i = 0; i < propGroup.length; i++) {
        const props = propGroup[i];

        const baseProp = props[0];
        const $label = document.createElement('ui-label');
        const $button = document.createElement('ui-button');

        $label.setAttribute('value', baseProp.group.name);
        $button.setAttribute('name', baseProp.group.name);
        $button.appendChild($label);
        $tabHeader.appendChild($button);

        const $tabContent = document.createElement('div');
        $tabContent.setAttribute('class', 'tab-content');
        $tabContent.setAttribute('name', baseProp.group.name);
        $tabContent.style.cssText = `display: none;`;

        // maintain `$groups` dict
        $panel.$groups[baseProp.group.id || 'default'] = $group;

        // append prop
        for (let j = 0; j < props.length; j++) {
            const prop = props[j];
            const $prop = createByType(props[j]);
            const id = `${prop.type || prop.name}:${prop.path}`;

            $panel.$propList[id] = $prop;
            $tabContent.appendChild($prop);
        }

        $group.appendChild($tabContent);
    }

    // event listener (tab toggle)
    $tabHeader.addEventListener('change', e => {
        const idx = e.target.value || 0;
        const $contents = $group.querySelectorAll('.tab-content');

        $contents.forEach(($content, i) => {
            $content.style.display = i === idx ? 'block' : 'none';
        });
    });
    //
    // show first default
    setTimeout(() => {
        const $firstTab = $tabHeader.shadowRoot.querySelector('ui-button');
        if ($firstTab && 'dispatch' in $firstTab) {
            $firstTab.dispatch('confirm');
        }
    });

    return $group;
}

/**
 * create property by type
 * @param {PropDump | PropDump[][]} prop
 * @return {HTMLElement}
 */
function createByType(prop) {
    switch (prop.type) {
        case 'cc.Script':
            return createScriptProp(prop);
        case 'cc.Label':
        case 'cc.Sprite':
        case 'cc.Node':
        case 'cc.Material':
        case 'cc.Mesh':
            return createNodeProp(prop);
        // TODO: reg, value judgement
        // case 'cc.ModelLightmapSettings':
        // case 'cc.Object':
        //     return createObjectProp(prop);
        case 'Enum':
            return createEnumProp(prop);
        case 'String':
            return createStringProp(prop);
        case 'Number':
        case 'Float':
            return prop.slide
                ? createNumberSliderProp(prop)
                : createNumberInputProp(prop);
        case 'Boolean':
            return createBooleanProp(prop);
        default:
            return null;
    }
}

/**
 * create property element by dump
 * @param {HTMLElement & {$propList: { [x: string]: HTMLElement }, $groups: { [x: string]: HTMLElement }}} $panel
 * @param {string} propId
 * @param {PropDump | PropDump[][]} prop
 * @return {HTMLElement}
 */
function createPropElement($panel, propId, prop) {
    if (Array.isArray(prop)) {
        return createPropGroup($panel, prop);
    }

    let $prop;

    if (prop.isArray) {
        $prop = createArrayProp(prop);
    } else {
        $prop = createByType(prop);
    }

    $panel.$propList[propId] = $prop;

    return $prop;
}

module.exports = {
    createPropElement,
};
