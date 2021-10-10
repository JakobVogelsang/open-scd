import { html } from 'lit-element';
import { get, translate } from 'lit-translate';

import { Directory, FinderList } from '../finder-list.js';
import {
  cloneElement,
  createElement,
  EditorAction,
  getValue,
  identity,
  newWizardEvent,
  Wizard,
  WizardAction,
  WizardActor,
  WizardInput,
} from '../foundation.js';
import { shortTags, tags } from './foundation.js';

export function updateDataSetAction(element: Element): WizardActor {
  return (inputs: WizardInput[]): WizardAction[] => {
    const name = inputs.find(i => i.label === 'name')!.value!;
    const desc = getValue(inputs.find(i => i.label === 'desc')!);

    const oldName = element.getAttribute('name');
    if (name === oldName && desc === element.getAttribute('desc')) return [];

    const newElement = cloneElement(element, { name, desc });

    const dataSetUpdateAction = [
      { old: { element }, new: { element: newElement } },
    ];

    const cbUpdateAction =
      name !== oldName
        ? Array.from(
            element.parentElement?.querySelectorAll(
              `ReportControlBock[datSet=${oldName}], GSEControl[datSet=${oldName}],SampledValueControl[datSet=${oldName}] `
            ) ?? []
          ).map(cb => {
            const newCb = cloneElement(element, { datSet: name });
            return { old: { element: cb }, new: { element: newCb } };
          })
        : [];

    return dataSetUpdateAction.concat(cbUpdateAction);
  };
}

function getChildIds(element: Element): (path: string[]) => Promise<Directory> {
  const root = element.closest('IED')!;
  return async (path: string[]) => {
    const shortTag = path[path.length - 1]?.split(':')[0];
    const tagName = shortTags[shortTag];
    const parent = tags[tagName]?.getElement(path, root) ?? null;
    const childen = tags[tagName]?.getChildren(parent!) ?? [];

    return {
      path,
      header: html``,
      entries: childen.map(
        child =>
          `${tags[child.tagName]?.shortTag}:${
            tags[child.tagName]?.getIdentity(child) ?? ''
          }`
      ),
    };
  };
}

function createFCDAformPath(parent: Element, path: string[]): Element {
  const iedName = parent.closest('IED')?.getAttribute('name') ?? null;
  const ldInst = path[1].split(':')[1];
  const prefix = path[2].split(':')[1].split(' ')[0];
  const lnClass = path[2].split(':')[1].split(' ')[1];
  const lnInst = path[2].split(':')[1].split(' ')[2];
  let doName = '';
  let daName = '';
  let fc = '';
  for (const pathElem of path.slice(2)) {
    const [tagName, indentity] = pathElem.split(':');
    if (tagName === 'DO') doName = indentity;

    if (tagName === 'SDO') doName = doName + '.' + indentity;
    if (tagName === 'DA') {
      const [_0, name, _2, _3, FC] =
        indentity.match(/([a-zA-Z][0-9A-Za-z]*)([ ]?)(\[?([A-Z]*)\]?)/) ?? [];
      daName = name;
      fc = FC;
    }
    if (tagName === 'BDA') daName = daName + '.' + indentity;
  }

  return createElement(parent.ownerDocument, 'FCDA', {
    iedName,
    ldInst,
    prefix,
    lnClass,
    lnInst,
    doName,
    daName,
    fc,
  });
}

function addDataAction(parent: Element): WizardActor {
  return (inputs: WizardInput[], wizard: Element): WizardAction[] => {
    const finder = wizard.shadowRoot!.querySelector<FinderList>('finder-list');
    const paths = finder?.paths ?? [];

    const actions = [];
    for (const path of paths)
      actions.push({
        new: {
          parent,
          element: createFCDAformPath(parent, path),
          reference: null,
        },
      });

    return actions;
  };
}

function selectDataSetWizard(element: Element): Wizard {
  return [
    {
      title: 'add data',
      primary: {
        label: 'add',
        icon: 'add',
        action: addDataAction(element),
      },
      content: [
        html`<finder-list
          multi
          .path=${['S:Server']}
          .read=${getChildIds(element)}
        ></finder-list>`,
      ],
    },
  ];
}

export function editDataSetWizard(element: Element): Wizard {
  const name = element.getAttribute('name');
  const desc = element.getAttribute('desc');

  return [
    {
      title: get('wizard.title.edit', { tagName: element.tagName }),
      element,
      primary: {
        label: get('edit'),
        icon: 'save',
        action: updateDataSetAction(element),
      },
      content: [
        html`<wizard-textfield
          label="name"
          .maybeValue=${name}
          helper="${translate('scl.name')}"
          required
        >
        </wizard-textfield>`,
        html`<wizard-textfield
          label="desc"
          .maybeValue=${desc}
          helper="${translate('scl.desc')}"
          nullable
          required
        >
        </wizard-textfield>`,
        html`<mwc-button
          label="add"
          icon="add"
          @click=${(e: Event) => {
            e.target?.dispatchEvent(newWizardEvent());
            e.target?.dispatchEvent(
              newWizardEvent(selectDataSetWizard(element))
            );
          }}
        >
        </mwc-button>`,
        html`<filtered-list multi
          >${Array.from(element.querySelectorAll('FCDA')).map(
            fcda =>
              html`<mwc-check-list-item value="${identity(fcda)}"
                >${(<string>identity(fcda)).split('>')[4]}</mwc-check-list-item
              >`
          )}</filtered-list
        >`,
      ],
    },
  ];
}
