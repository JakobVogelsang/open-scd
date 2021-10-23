import {
  css,
  customElement,
  html,
  LitElement,
  property,
  query,
  TemplateResult,
} from 'lit-element';
import { translate } from 'lit-translate';

import { newActionEvent, newWizardEvent } from '../foundation.js';
import {
  cloneSubstationElement,
  renderFunctions,
  selectors,
  startMove,
  styles,
} from './foundation.js';
import { wizards } from '../wizards/wizard-library.js';

import { IconButton } from '@material/mwc-icon-button';

import './voltage-level-editor.js';
import '../editor-container.js';

/** [[`Substation`]] plugin subeditor for editing `Substation` sections. */
@customElement('substation-editor')
export class SubstationEditor extends LitElement {
  /** The edited `Element`, a common property of all Substation subeditors. */
  @property({ attribute: false })
  element!: Element;
  @property({ type: Boolean })
  readonly = false;

  @property({ attribute: false })
  getAttachedIeds?: (element: Element) => Element[] = () => {
    return [];
  };

  @query('mwc-icon-button[icon="account_tree"]') lnodeButton!: IconButton;
  @query('mwc-icon-button[icon="content_copy"]') copyButton!: IconButton;
  @query('mwc-icon-button[icon="edit"]') editButton!: IconButton;
  @query('mwc-icon-button[icon="delete"]') removeButton!: IconButton;
  @query('mwc-icon-button[icon="forward"]') moveButton!: IconButton;

  /** Opens a [[`WizardDialog`]] for editing [[`element`]]. */
  openEditWizard(): void {
    const wizard = wizards['Substation'].edit(this.element);
    if (wizard) this.dispatchEvent(newWizardEvent(wizard));
  }

  /** Opens a [[`WizardDialog`]] for editing `LNode` connections. */
  openLNodeWizard(): void {
    const wizard = wizards['LNode'].edit(this.element);
    if (wizard) this.dispatchEvent(newWizardEvent(wizard));
  }

  /** Deletes [[`element`]]. */
  remove(): void {
    this.dispatchEvent(
      newActionEvent({
        old: {
          parent: this.element.parentElement!,
          element: this.element,
          reference: this.element.nextSibling,
        },
      })
    );
  }

  renderIedContainer(): TemplateResult {
    const ieds = this.getAttachedIeds?.(this.element) ?? [];
    return ieds?.length
      ? html`<div id="iedcontainer" slot="container">
          ${ieds.map(ied => html`<ied-editor .element=${ied}></ied-editor>`)}
        </div>`
      : html``;
  }

  renderActionButtons(): TemplateResult {
    return html`<abbr slot="header" title="${translate('lnode.tooltip')}">
        <mwc-icon-button
          icon="account_tree"
          @click=${() => this.openLNodeWizard()}
        ></mwc-icon-button>
      </abbr>
      <abbr slot="header" title="${translate('duplicate')}">
        <mwc-icon-button
          icon="content_copy"
          @click=${() => cloneSubstationElement(this)}
        ></mwc-icon-button>
      </abbr>
      <abbr slot="header" title="${translate('edit')}">
        <mwc-icon-button
          icon="edit"
          @click=${() => this.openEditWizard()}
        ></mwc-icon-button>
      </abbr>
      <abbr slot="header" title="${translate('move')}">
        <mwc-icon-button
          icon="forward"
          @click=${() => startMove(this, SubstationEditor, SubstationEditor)}
        ></mwc-icon-button>
      </abbr>
      <abbr slot="header" title="${translate('remove')}">
        <mwc-icon-button
          icon="delete"
          @click=${() => this.remove()}
        ></mwc-icon-button
      ></abbr>`;
  }

  render(): TemplateResult {
    return html`<editor-container .element=${this.element}
      >${this.renderActionButtons()}${this.renderIedContainer()}${renderFunctions(
        this.element
      )}
      ${Array.from(this.element.querySelectorAll(selectors.VoltageLevel)).map(
        voltageLevel =>
          html`<voltage-level-editor
            slot="container"
            .element=${voltageLevel}
            .getAttachedIeds=${this.getAttachedIeds}
            ?readonly=${this.readonly}
          ></voltage-level-editor>`
      )}</editor-container
    > `;
  }

  static styles = css`
    ${styles}
  `;
}
