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

function createFCDAfromPath(
  parent: Element,
  path: string[]
): Element | undefined {
  const lnSegment = path.find(segment => segment.startsWith('LN'));
  if (!lnSegment) return;

  const [lnTag, lnId] = lnSegment.split(': ');

  const ln = parent.ownerDocument.querySelector(selector(lnTag, lnId));
  if (!ln) return;

  const iedName = ln.closest('IED')?.getAttribute('name') ?? null;
  const ldInst = ln.closest('LDevice')?.getAttribute('inst') ?? null;
  const prefix = ln.getAttribute('prefix') ?? '';
  const lnClass = ln.getAttribute('lnClass');
  const lnInst = ln.getAttribute('inst') ?? '';

  let doName = '';
  let daName = '';
  let fc = '';

  for (const segment of path) {
    const [tagName, id] = segment.split(': ');
    if (!['DO', 'DA', 'SDO', 'BDA'].includes(tagName)) continue;

    const element = parent.ownerDocument.querySelector(selector(tagName, id));
    if (!element) return;

    const name = element.getAttribute('name') ?? '';

    if (tagName === 'DO') doName = name;
    if (tagName === 'SDO') doName = doName + '.' + name;
    if (tagName === 'DA') {
      daName = name;
      fc = element.getAttribute('fc') ?? '';
    }
    if (tagName === 'BDA') daName = daName + '.' + name;
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
    for (const path of paths) {
      const element = createFCDAfromPath(parent, path);

      if (!element) continue;

      actions.push({
        new: {
          parent,
          element,
          reference: null,
        },
      });
    }

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
