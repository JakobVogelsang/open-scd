import { LitElement } from 'lit-element';

const settingTypeFunctionalContrains = ['CF', 'SG', 'SE'];

function getSDI(sdi: Element | null): Element[] {
  if (!sdi) return [];
  const parent = sdi.parentElement;
  if (!parent || parent.tagName !== 'SDI') return [sdi];

  return getSDI(parent);
}

function getReference(dai: Element): string {
  let reference: string = dai.getAttribute('name') ?? '';
  let parentElement = dai.parentElement;
  if (!parentElement) return reference;
  while (parentElement.tagName !== 'LN' && parentElement.tagName !== 'LN0') {
    reference = parentElement.getAttribute('name') ?? '';
    parentElement = parentElement?.parentElement;
    if (!parentElement) return reference;
  }

  const anyLn = parentElement;
  reference =
    (anyLn.getAttribute('prefix') ?? '') +
    (anyLn.getAttribute('lnClass') ?? '') +
    (anyLn.getAttribute('lnInst') ?? '') +
    '/' +
    reference;

  const lDevice = anyLn.parentElement;
  if (!lDevice) return reference;
  reference = (lDevice.getAttribute('inst') ?? '') + '/' + reference;

  const ied = lDevice.closest('IED');
  if (!ied) return reference;
  reference = (ied.getAttribute('name') ?? '') + '/' + reference;

  return reference;
}

function getTypeElement(dai: Element): Element | null {
  const dataTypeTempltes = dai
    .closest('SCL')
    ?.querySelector('DataTypeTemplates');
  if (!dataTypeTempltes) return null;

  const anyln = dai.closest('LN, LN0');
  const doi = dai.closest('DOI');
  const sdis = getSDI(dai.closest('SDI'));
  if (!anyln || !doi) return null;

  const dO = dataTypeTempltes.querySelector(
    `LNodeType[id="${anyln.getAttribute(
      'lnType'
    )}"] > DO[name="${doi.getAttribute('name')}"]`
  );
  let doTypeOrDaType = dataTypeTempltes.querySelector(
    `DOType[id="${dO?.getAttribute('type')}"]`
  );

  for (const sdi of sdis) {
    const sDOorDAorBDA = doTypeOrDaType?.querySelector(
      `SDO[name="${sdi?.getAttribute('name')}"],` +
        ` DA[name="${sdi?.getAttribute('name')}"],` +
        ` BDA[name="${sdi?.getAttribute('name')}"]`
    );

    doTypeOrDaType = dataTypeTempltes.querySelector(
      `DOType[id="${sDOorDAorBDA?.getAttribute('type')}"],` +
        ` DAType[id="${sDOorDAorBDA?.getAttribute('type')}"]`
    );
  }

  return (
    doTypeOrDaType?.querySelector(
      `DA[name="${dai.getAttribute('name')}"], BDA[name="${dai.getAttribute(
        'name'
      )}"]`
    ) ?? null
  );
}

function isSetting(typeElement: Element | null): boolean {
  if (!typeElement) return false;
  return settingTypeFunctionalContrains.includes(
    typeElement.getAttribute('fc')!
  );
}

function filterSettings(doc: XMLDocument): string[][] {
  const setting: string[][] = [[]];
  setting.push(['#', 'value', 'name', 'reference', 'functional constrained']);
  Array.from(doc.querySelectorAll('IED DAI')).forEach(dai => {
    const typeElement = getTypeElement(dai);
    if (isSetting(typeElement))
      setting.push([
        '',
        dai.querySelector('Val')?.textContent?.trim() ?? '',
        dai.getAttribute('name')!,
        getReference(dai),
        typeElement!.getAttribute('fc')!,
      ]);
  });

  return setting;
}

export default class ExportSettingsPlugin extends LitElement {
  doc!: XMLDocument;

  async run(): Promise<void> {
    //const settings = filterSettings(this.doc);
    const settings = filterSettings(this.doc);
    const csvContent = settings.map(e => e.join(',')).join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv',
    });

    const a = document.createElement('a');
    a.download = 'SettingsType';
    a.href = URL.createObjectURL(blob);
    a.dataset.downloadurl = ['text/csv', a.download, a.href].join(':');
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
    }, 5000);
  }
}
