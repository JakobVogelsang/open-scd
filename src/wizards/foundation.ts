import { crossProduct } from '../foundation.js';

export const shortTags: Record<string, string> = {
  IED: 'IED',
  AP: 'AccessPoint',
  S: 'Server',
  LD: 'LDevice',
  LN0: 'LN0',
  LN: 'LN',
  DO: 'DO',
  SDO: 'SDO',
  DA: 'DA',
  BDA: 'BDA',
};

function getLn(path: string[], root: Element): Element | null {
  const lastPathElement = path[path.length - 1];
  const [tagName, identity] = lastPathElement!.split(':');
  const [prefix, lnClass, inst] = identity.split(' ');

  const parentPath = path.slice(0, -1);
  const parentTag = shortTags[parentPath[parentPath.length - 1].split(':')[0]];
  const parent = tags[parentTag]?.getElement(parentPath, root);

  return (
    parent?.querySelector(
      `${tagName}${prefix ? `[prefix="${prefix}"]` : ''}[lnClass="${lnClass}"]${
        inst ? `[inst="${inst}"]` : ''
      }`
    ) ?? null
  );
}

function getReferencedNamedElement(
  path: string[],
  root: Element
): Element | null {
  const lastPathElement = path[path.length - 1];

  const [_0, shortTag, _2, name, _3, _5, fc] =
    lastPathElement.match(
      /([a-zA-Z]*)(:)([a-zA-Z][0-9A-Za-z]*)([ ]?)(\[?([A-Z]*)\]?)/
    ) ?? [];

  const tagName = shortTags[shortTag];

  const parentPath = path.slice(0, -1);
  const parentTag = shortTags[parentPath[parentPath.length - 1].split(':')[0]];
  const parent = tags[parentTag]?.getElement(parentPath, root);

  if (parentTag === 'LN' || parentTag === 'LN0')
    return root.ownerDocument.querySelector(
      `DataTypeTemplates > LNodeType[id="${parent?.getAttribute(
        'lnType'
      )}"] > DO[name="${name}"]`
    );

  const id = parent?.getAttribute('type');
  const selector = crossProduct(
    ['DataTypeTemplates'],
    ['>'],
    [`DOType[id="${id}"]`, `DAType[id="${id}"]`],
    ['>'],
    [tagName],
    [`[name="${name}"]`]
  )
    .map(strings => strings.join(''))
    .join(',');

  return root.ownerDocument.querySelector(selector);
}

function getNamedElement(path: string[], root: Element): Element | null {
  const lastPathElement = path[path.length - 1];

  const [shortTag, _1, name, _3, _4, fc] = lastPathElement.split(':');

  const tagName = shortTags[shortTag];

  const parentPath = path.slice(0, -1);
  const parentTag = shortTags[parentPath[parentPath.length - 1].split(':')[0]];
  const parent = tags[parentTag]?.getElement(parentPath, root);

  return parent?.querySelector(`${tagName}[name="${name}"]`) ?? null;
}

function getLDevice(path: string[], root: Element): Element | null {
  const inst = path[path.length - 1]?.split(':')[1];
  return root.querySelector(`LDevice[inst="${inst}"]`);
}

function getServer(path: string[], root: Element): Element | null {
  return root.querySelector('Server');
}

function getDirectChildren(parent: Element): Element[] {
  return Array.from(parent.children);
}

function getReferencedChildren(parent: Element): Element[] {
  if (parent.tagName === 'LN' || parent.tagName === 'LN0')
    return Array.from(
      parent.ownerDocument.querySelectorAll(
        `DataTypeTemplates > LNodeType[id="${parent.getAttribute(
          'lnType'
        )}"]  > DO`
      )
    );

  const id = parent.getAttribute('type');

  return Array.from(
    parent.ownerDocument.querySelectorAll(
      `DOType[id="${id}"] > SDO, DOType[id="${id}"] > DA , DAType[id="${id}"] > BDA`
    )
  );
}

function getLdIdentity(element: Element): string {
  return `${element.getAttribute('inst')}`;
}

function getNameIdentity(element: Element): string {
  return `${element.getAttribute('name')}`;
}

function getDaIdentity(element: Element): string {
  return `${element.getAttribute('name')} [${element.getAttribute('fc')}]`;
}

function getLnIdentity(element: Element): string {
  return `${element.getAttribute('prefix') ?? ''} ${
    element.getAttribute('lnClass') ?? ''
  } ${element.getAttribute('inst') ?? ''}`;
}

export const tags: Partial<
  Record<
    string,
    {
      shortTag: string;
      getElement: (path: string[], root: Element) => Element | null;
      getChildren: (parent: Element) => Element[];
      getIdentity: (element: Element) => string;
    }
  >
> = {
  IED: {
    shortTag: 'IED',
    getElement: getNamedElement,
    getChildren: getDirectChildren,
    getIdentity: getNameIdentity,
  },
  AccessPoint: {
    shortTag: 'AP',
    getElement: getNamedElement,
    getChildren: getDirectChildren,
    getIdentity: getNameIdentity,
  },
  Server: {
    shortTag: 'S',
    getElement: getServer,
    getChildren: getDirectChildren,
    getIdentity: () => '',
  },
  LDevice: {
    shortTag: 'LD',
    getElement: getLDevice,
    getChildren: getDirectChildren,
    getIdentity: getLdIdentity,
  },
  LN0: {
    shortTag: 'LN0',
    getElement: getLn,
    getChildren: getReferencedChildren,
    getIdentity: getLnIdentity,
  },
  LN: {
    shortTag: 'LN',
    getElement: getLn,
    getChildren: getReferencedChildren,
    getIdentity: getLnIdentity,
  },
  DO: {
    shortTag: 'DO',
    getElement: getReferencedNamedElement,
    getChildren: getReferencedChildren,
    getIdentity: getNameIdentity,
  },
  SDO: {
    shortTag: 'SDO',
    getElement: getReferencedNamedElement,
    getChildren: getReferencedChildren,
    getIdentity: getNameIdentity,
  },
  DA: {
    shortTag: 'DA',
    getElement: getReferencedNamedElement,
    getChildren: getReferencedChildren,
    getIdentity: getDaIdentity,
  },
  BDA: {
    shortTag: 'BDA',
    getElement: getReferencedNamedElement,
    getChildren: getReferencedChildren,
    getIdentity: getNameIdentity,
  },
};
