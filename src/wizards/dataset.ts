import { html } from 'lit-element';
import { get, translate } from 'lit-translate';

import { Directory, FinderList } from '../finder-list.js';
import {
  cloneElement,
  createElement,
  getValue,
  identity,
  newWizardEvent,
  selector,
  Wizard,
  WizardAction,
  WizardActor,
  WizardInput,
} from '../foundation.js';

function getChildren(parent: Element): Element[] {
  if (['LDevice', 'Server'].includes(parent.tagName))
    return Array.from(parent.children);

  const id =
    parent.tagName === 'LN' || parent.tagName === 'LN0'
      ? parent.getAttribute('lnType')
      : parent.getAttribute('type');

  return Array.from(
    parent.ownerDocument.querySelectorAll(
      `LNodeType[id="${id}"] > DO, DOType[id="${id}"] > SDO, DOType[id="${id}"] > DA, DAType[id="${id}"] > BDA`
    )
  );
}

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

function getReader(server: Element): (path: string[]) => Promise<Directory> {
  return async (path: string[]) => {
    const [tagName, id] = path[path.length - 1]?.split(': ', 2);
    const element = server.ownerDocument.querySelector(selector(tagName, id));

    if (!element)
      return { path, header: html`<p>${translate('error')}</p>`, entries: [] };

    return {
      path,
      header: html``,
      entries: getChildren(element).map(
        child => `${child.tagName}: ${identity(child)}`
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

function getDisplayString(entry: string): string {
  return entry.replace(/^.*>/, '');
}

function selectDataSetWizard(element: Element): Wizard | undefined {
  const server = element.closest('Server');
  if (!server || !(typeof identity(server) === 'string')) return; // No identifiable Server
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
          .getTitle=${(path: string[]) => path[path.length - 1]}
          .getDisplayString=${getDisplayString}
          multi
          .paths=${[['Server: ' + identity(server)]]}
          .read=${getReader(server)}
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
