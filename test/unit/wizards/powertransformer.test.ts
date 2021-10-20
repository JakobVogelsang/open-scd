import { expect, fixture, html } from '@open-wc/testing';
import { Create, isCreate, WizardInput } from '../../../src/foundation.js';
import { WizardTextField } from '../../../src/wizard-textfield.js';
import {
  createPowerTransformerAction,
  createPowerTransformerWizard,
  editPowerTransformerWizard,
  render,
} from '../../../src/wizards/powertransformer.js';
import { MockWizard } from '../../mock-wizard.js';

describe('powertransformer wizards', () => {
  let element: MockWizard;
  let doc: XMLDocument;

  beforeEach(async () => {
    element = await fixture(html`<mock-wizard></mock-wizard>`);
    doc = await fetch('/base/test/testfiles/wizards/powertransformers.scd')
      .then(response => response.text())
      .then(str => new DOMParser().parseFromString(str, 'application/xml'));
  });
  describe('rendering function', () => {
    beforeEach(async () => {
      const wizard = [
        {
          title: 'title',
          content: render('myPRT', 'myDesc'),
        },
      ];
      element.workflow.push(wizard);
      await element.requestUpdate();
    });
    it('looks like the latest snapshot', () => {
      expect(element.wizardUI.dialog).to.equalSnapshot();
    });
  });

  describe('editing PowerTransformer wizard', () => {
    beforeEach(async () => {
      const wizard = editPowerTransformerWizard(
        doc.querySelector('PowerTransformer')!
      )!;
      element.workflow.push(wizard);
      await element.requestUpdate();
    });
    it('looks like the latest snapshot', () => {
      expect(element.wizardUI.dialog).to.equalSnapshot();
    });
  });

  describe('create PowerTransformer wizard', () => {
     beforeEach(async () => {
       const wizard = createPowerTransformerWizard(
         doc.querySelector('Bay')!
       )!;
       element.workflow.push(wizard);
       await element.requestUpdate();
     })
     it('looks like the latest snapshot', () => {
       expect(element.wizardUI.dialog).to.equalSnapshot();
     });
  });

  describe('create action', () => {
    let parent: Element;
    let inputs: WizardInput[];

    const noOp = () => {
      return;
    };
    const newWizard = (done = noOp) => {
      const element = document.createElement('mwc-dialog');
      element.close = done;
      return element;
    };

    beforeEach(async () => {
      parent = doc.querySelector('Bay')!;
      const wizard = createPowerTransformerWizard(parent!);
      element.workflow.push(wizard!);
      await element.requestUpdate();
      inputs = Array.from(element.wizardUI.inputs);
      await element.requestUpdate();
    });

    it('creates a PowerTransformer element', () => {
      inputs[0].value = 'myNewPTR';

      const editorAction = createPowerTransformerAction(parent);
      expect(editorAction(inputs, newWizard()).length).to.equal(1);
      expect(editorAction(inputs, newWizard())[0]).to.satisfy(isCreate);
      const createAction = <Create>editorAction(inputs, newWizard())[0];

      expect(createAction.new.element).to.have.attribute('name', 'myNewPTR');
      expect(createAction.new.element).to.not.have.attribute('desc');
      expect(createAction.new.element).to.have.attribute('type', 'PTR');
    });

    
    it('creates yet another PowerTransformer element', async() => {
      inputs[0].value = 'myOtherNewPTR';
      const desc = <WizardTextField>inputs[1];
      desc.nullSwitch?.click();
      desc.value = 'myOtherDesc';
      await desc.requestUpdate();

      const editorAction = createPowerTransformerAction(parent);
      expect(editorAction(inputs, newWizard()).length).to.equal(1);
      expect(editorAction(inputs, newWizard())[0]).to.satisfy(isCreate);
      const createAction = <Create>editorAction(inputs, newWizard())[0];

      expect(createAction.new.element).to.have.attribute(
        'name',
        'myOtherNewPTR'
      );
      expect(createAction.new.element).to.have.attribute('desc', 'myOtherDesc');
      expect(createAction.new.element).to.have.attribute('type', 'PTR');
    });
  });
});
