import { html, fixture, expect } from '@open-wc/testing';

import Templates from '../../../../src/editors/Templates.js';
import { Editing } from '../../../../src/Editing.js';
import { Wizarding } from '../../../../src/Wizarding.js';

import { getDocument } from '../../../data.js';

describe('Templates Plugin', () => {
  customElements.define('templates-plugin', Wizarding(Editing(Templates)));
  let element: Templates;
  beforeEach(async () => {
    element = await fixture(html`<templates-plugin></templates-plugin>`);
  });

  describe('without a doc loaded', () => {
    it('looks like the latest snapshot', () => {
      expect(element).shadowDom.to.equalSnapshot();
    });
  });

  describe('with a doc loaded', () => {
    beforeEach(async () => {
      element.doc = getDocument();
      await element.updateComplete;
    });
    it('looks like the latest snapshot', () => {
      expect(element).shadowDom.to.equalSnapshot();
    });
  });
});
