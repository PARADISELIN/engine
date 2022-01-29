'use strict';

// TODO: carding update process
// TODO: data maintain($propList, $groups)
// TODO: enum prop render use `ui-select`
// TODO: `cc.Color` prop render use `ui-color`
// TODO: setting prop render like lightmapSettings(cc.Object)
// TODO: pass node uuid in
// TODO: event handler

const { createPropElement } = require('./prop-renderer');

/**
 * @typedef {Object} GroupItem
 * @property {number} displayOrder
 * @property {string} style
 */

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
 * @property {boolean} [isArray]
 * @property {{name: string, value: any}} [enumList] - enum property symbol
 * @property {any} [elementTypeData]
 */

/**
 * @typedef {Object} Editor
 * @property {string} inspector
 * @property {string} icon
 * @property {string} help
 * @property {boolean} _showTick
 */

/**
 * @typedef {Object} ComponentDump
 * @property {string} cid - component id
 * @property {Editor} editor
 * @property {string[]} extends
 * @property {{[x: string]: GroupItem}} groups
 * @property {string} path
 * @property {boolean} readonly
 * @property {string} type
 * @property {{[x: string]: PropDump}} value
 * @property {boolean} visible
 * @property {any[]} [values]
 */

/**
 * @typedef {Object} Group
 * @property {string} name
 * @property {string} id
 */

function log(line, ...content) {
    const style = 'color:rgb(53,148,105);font-size:16px;font-weight:bold;';
    let prefix = `%c editor/inspector/components/diy-class.js -- line: ${line}`;

    console.log(prefix, style, ...content);
}

function groupBy(arr, f) {
    const groups = {};

    arr.forEach((o) => {
        const group = JSON.stringify(f(o));
        groups[group] = groups[group] || [];
        groups[group].push(o);
    });

    return Object.keys(groups).map((group) => {
        return groups[group];
    });
}

exports.template = `
<section></section>
`;

exports.$ = {
    section: 'section',
};

exports.style = `
    .tab-group {
        margin-top: 10px;
        margin-bottom: 10px;
    }
    .tab-content {
        display: none;
        border: 1px dashed var(--color-normal-border);
        padding: 10px;
        margin-top: -9px;
        border-top-right-radius: calc(var(--size-normal-radius) * 1px);
        border-bottom-left-radius: calc(var(--size-normal-radius) * 1px);
        border-bottom-right-radius: calc(var(--size-normal-radius) * 1px);
    }
`;

/**
 * get property id
 * @param {PropDump} prop
 * @return {string}
 */
function generatePropId(prop) {
    const { type, name, path } = prop;
    return `${type || name}:${path}`;
}

/**
 * sort by `displayOrder`
 * @param {PropDump} a
 * @param {PropDump} b
 */
function displayOrderCompare(a, b) {
    const aDisplayOrder = a.displayOrder === undefined ? Infinity : a.displayOrder;
    const bDisplayOrder = b.displayOrder === undefined ? Infinity : b.displayOrder;
    const res = aDisplayOrder - bDisplayOrder;
    return Number.isNaN(res) ? 0 : res;
}

/**
 * format property list
 * @param {PropDump[]} propList
 * @return {PropDump[]}
 */
function formatPropList(propList) {
    const withGroupPropList = propList.filter(item => item.group && Object.keys(item.group).length !== 0);
    let normalPropList = propList.filter(item => !item.group || Object.keys(item.group).length === 0);

    if (withGroupPropList.length === 0) {
        return propList.sort(displayOrderCompare);
    }

    const groupMap = new Map();

    for (const prop of withGroupPropList) {
        const groupId = prop.group.id || 'default';
        if (groupMap.has(groupId)) {
            groupMap.get(groupId).push(prop);
        } else {
            groupMap.set(groupId, [prop]);
        }
    }

    // sort group inner prop
    const propsKey = Symbol('props');
    for (const v of groupMap.values()) {
        const item = { [propsKey]: v };

        if (v[0].group.displayOrder) {
            item.displayOrder = v[0].group.displayOrder;
        }
        normalPropList.push(item);
    }

    normalPropList.sort(displayOrderCompare);

    const ret = [];
    for (let i = 0; i < normalPropList.length; i++) {
        if (Reflect.has(normalPropList[i], propsKey)) {
            const data = groupBy(
                normalPropList[i][propsKey].sort(displayOrderCompare),
                item => item.group.name
            );
            ret.push(data);
        } else {
            ret.push(normalPropList[i]);
        }
    }

    return ret;
}


/**
 * update
 * @param {ComponentDump} dump
 * @return {Promise<void>}
 */

async function update(dump) {
    const $panel = this;
    const $section = $panel.$.section;

    const oldPropList = Object.keys($panel.$propList);
    const newPropList = [];

    const { value } = dump;
    const visiblePropNameList = Reflect.ownKeys(value).filter(key => value[key].visible);

    if (visiblePropNameList.length === 0) {
        return;
    }

    let visiblePropList = visiblePropNameList.map(key => value[key]);
    visiblePropList = formatPropList(visiblePropList);

    log(207, visiblePropList);

    for (const prop of visiblePropList) {

        // `dump.values` reconstruct
        if (dump.values) {
            prop.values = dump.values.map((value) => {
                return value[key].value;
            });
        }

        const propId = generatePropId(prop);
        newPropList.push(propId);

        let $prop = $panel.$propList[propId];

        if (!$prop) {
            $prop = createPropElement($panel, propId, prop);
            $section.appendChild($prop);
            // TODO: handler group
        } else {
            if (!$prop.isConnected || !$prop.parentElement) {
                // TODO: find the nearest sibling node, then insert $prop by `index`
            }
        }

        // if `id` is not existed in `newPropList`
        // remove it from parentElement
        for (const id of oldPropList) {
            if (!newPropList.includes(id)) {
                const $prop = $panel.$propList[id];
                if ($prop && $prop.parentElement) {
                    $prop.parentElement.removeChild($prop);
                }
            }
        }
    }
}

async function ready() {
    const $panel = this;
    $panel.$propList = {};
    $panel.$groups = {};
}

async function close() {
    const $panel = this;
    for (const key in $panel.$groups) {
        $panel.$groups[key].remove();
    }
    $panel.$groups = undefined;
}

exports.update = update;
exports.ready = ready;
exports.close = close;
