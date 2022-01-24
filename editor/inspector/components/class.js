'use strict';

/**
 * @typedef {Object} ValueItem
 * @property {any} default
 * @property {string[]} extends
 * @property {string} name
 * @property {string} path
 * @property {boolean} readonly
 * @property {string} type
 * @property {any} value
 * @property {boolean} visible
 */

/**
 * @typedef {Object} GroupItem
 * @property {number} displayOrder
 * @property {string} style
 */

/**
 * @typedef {Object} Editor
 * @property {string} inspector
 * @property {string} icon
 * @property {string} help
 * @property {string} _showTick
 */

/**
 * @typedef {Object} ComponentDump
 * @property {string} cid
 * @property {Editor} editor
 * @property {string[]} extends
 * @property {{[x: string]: GroupItem}} groups
 * @property {string} path
 * @property {boolean} readonly
 * @property {string} type
 * @property {{[x: string]: ValueItem}} value
 * @property {boolean} visible
 * @property values
 */

function log(line, ...content) {
    const style = 'color:rgb(53,148,105);font-size:16px;font-weight:bold;';
    let prefix = `%ceditor/inspector/components/class.js -- line: ${line}`;

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
        $group.setAttribute('class', 'tab-group');
        $group.dump = dump;
        $group.tabs = {};
        $group.$header = document.createElement('ui-tab');
        $group.$header.setAttribute('class', 'tab-header');
        $group.appendChild($group.$header);

        $group.$header.addEventListener('change', (e) => {
            const tabNames = Object.keys($group.tabs);
            const tabName = tabNames[e.target.value || 0];
            $group.querySelectorAll('.tab-content').forEach((child) => {
                if (child.getAttribute('name') === tabName) {
                    child.style.display = 'block';
                } else {
                    child.style.display = 'none';
                }
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
    log(137, dump);
    const $panel = this;
    const $section = $panel.$.section;
    const oldPropList = Object.keys($panel.$propList);
    const newPropList = [];

    for (const key in dump.value) {
        const info = dump.value[key];

        // do not render invisible properties
        if (!info.visible) {
            continue;
        }

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

                // create group
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
        } else if (!$prop.isConnected || !$prop.parentElement) {
            $panel.appendChildByDisplayOrder($section, $prop, info.displayOrder);
        }
        $prop.render(info);
    }

    for (const id of oldPropList) {
        if (!newPropList.includes(id)) {
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
