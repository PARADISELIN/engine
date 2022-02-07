'use strict';

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
 * @property {any[]} [values]
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
    let prefix = `%c class.js -- line: ${line}`;

    console.log(prefix, style, ...content);
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

exports.methods = {
    createTabGroup(dump) {
        const $group = document.createElement('div');
        const $header = document.createElement('ui-tab');

        $header.setAttribute('class', 'tab-header');

        $group.setAttribute('class', 'tab-group');
        $group.dump = dump;
        $group.tabs = {};
        $group.$header = $header;
        $group.appendChild($group.$header);

        $header.addEventListener('change', (e) => {
            const tabNames = Object.keys($group.tabs);
            const tabName = tabNames[e.target.value || 0];
            const $contents = $group.querySelectorAll('.tab-content');

            $contents.forEach(($content) => {
                $content.style.display = $content.getAttribute('name') === tabName
                    ? 'block'
                    : 'none';
            });
        });

        setTimeout(() => {
            const $firstTab = $group.$header.shadowRoot.querySelector('ui-button');
            if ($firstTab) {
                $firstTab.dispatch('confirm');
            }
        });

        return $group;
    },

    appendToTabGroup($group, tabName) {
        if ($group.tabs[tabName]) {
            return;
        }

        const $content = document.createElement('div');
        $group.tabs[tabName] = $content;
        $content.setAttribute('class', 'tab-content');
        $content.setAttribute('name', tabName);
        $group.appendChild($content);

        const $label = document.createElement('ui-label');
        $label.value = tabName;

        const $button = document.createElement('ui-button');
        $button.setAttribute('name', tabName);
        $button.appendChild($label);
        $group.$header.appendChild($button);
    },

    appendChildByDisplayOrder(parent, newChild, displayOrder = 0) {
        const children = Array.from(parent.children);
        const child = children.find((child) => {
            if (child.dump && child.dump.displayOrder > displayOrder) {
                return child;
            }
            return null;
        });
        if (child) {
            child.before(newChild);
        } else {
            parent.appendChild(newChild);
        }
    },
};

/**
 * 自动渲染组件的方法
 * @param {ComponentDump} dump
 */
async function update(dump) {
    const $panel = this;
    const $section = $panel.$.section;
    const oldPropList = Object.keys($panel.$propList);
    const newPropList = [];

    for (const key in dump.value) {
        /** @type {PropDump} */
        const info = dump.value[key];

        // only render visible properties
        if (!info.visible) {
            continue;
        }

        // QUESTION: what's `dump.values` meaning?
        // QUESTION: In which case `dump` has `values` property?
        // `dump.values` reconstruct
        if (dump.values) {
            info.values = dump.values.map((value) => {
                return value[key].value;
            });
        }

        const id = `${info.type || info.name}:${info.path}`;
        newPropList.push(id);

        // `ui-prop` component
        let $prop = $panel.$propList[id];
        if (!$prop) {
            $prop = document.createElement('ui-prop');
            $prop.setAttribute('type', 'dump');
            $panel.$propList[id] = $prop;

            // render group properties
            if (info.group && dump.groups) {
                const key = info.group.id || 'default';
                const name = info.group.name;

                if (!$panel.$groups[key] && dump.groups[key]) {
                    if (dump.groups[key].style === 'tab') {
                        $panel.$groups[key] = $panel.createTabGroup(dump.groups[key]);
                    }
                }
                if ($panel.$groups[key]) {
                    if (!$panel.$groups[key].isConnected) {
                        $panel.appendChildByDisplayOrder($section, $panel.$groups[key], dump.groups[key].displayOrder);
                    }
                    if (dump.groups[key].style === 'tab') {
                        $panel.appendToTabGroup($panel.$groups[key], name);
                    }
                }
                $panel.appendChildByDisplayOrder($panel.$groups[key].tabs[name], $prop, info.displayOrder);
            } else {
                $panel.appendChildByDisplayOrder($section, $prop, info.displayOrder);
            }
        } else {
            if (!$prop.isConnected || !$prop.parentElement) {
                // case: updating an existing but deleted property
                log(228, `$prop is not connected or $prop has no parentElement`, $prop.isConnected, $prop.parentElement);
                $panel.appendChildByDisplayOrder($section, $prop, info.displayOrder);
            }
        }
        $prop.render(info);
    }

    // if `id` is not existed in `newPropList`
    // remove it from `parentElement`
    // situation: remove an existing property in a custom script
    for (const id of oldPropList) {
        if (!newPropList.includes(id)) {
            log(240, `propId: ${id} is not existed in newPropList`);
            const $prop = $panel.$propList[id];
            if ($prop && $prop.parentElement) {
                $prop.parentElement.removeChild($prop);
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
