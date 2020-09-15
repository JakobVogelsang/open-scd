import {
  customElement,
  html,
  TemplateResult,
  query,
  property,
} from 'lit-element';

import '@material/mwc-switch';
import { Switch } from '@material/mwc-switch';
import { TextField } from '@material/mwc-textfield';

declare global {
  interface HTMLElementTagNameMap {
    'mwc-textfield-nullable': TextFieldNullable;
  }
}

@customElement('mwc-textfield-nullable')
export class TextFieldNullable extends TextField {
  @property({ type: String })
  defaultValue = '';

  @property({ type: Boolean }) null = false;

  /*

  @property({ type: String })
  get helper(): string {
    else return super.helper;
  }
  set helper(value: string) {
    super.helper = value;
  }

  @property({ type: Boolean })
  get helperPersistent(): boolean {
  }
  set helperPersistent(value: boolean) {
    super.helperPersistent = value;
  }

  @property({ type: Boolean, reflect: true })
  get disabled(): boolean {
    return this.null || super.disabled;
  }
  set disabled(value: boolean) {
    super.disabled = value;
  }

   */

  @query('mwc-switch') switch?: Switch;

  nulled = {
    value: this.value || this.defaultValue,
    helper: this.helper,
    helperPersistent: this.helperPersistent,
    disabled: this.disabled,
  };

  lastValue = '';
  toggleValue(): void {
    if (this.null) {
      this.nulled.value = this.value;
      this.value = '';

      this.nulled.helper = this.helper;
      this.helper = this.defaultValue
        ? 'Default: ' + this.defaultValue
        : 'No default value';
      this.nulled.helperPersistent = this.helperPersistent;
      this.helperPersistent = true;

      this.nulled.disabled = this.disabled;
      this.disabled = true;
    } else {
      this.value = this.nulled.value;
      this.helper = this.nulled.helper;
      this.helperPersistent = this.nulled.helperPersistent;
      this.disabled = this.nulled.disabled;
    }
  }

  render(): TemplateResult {
    return html`
      <div style="display: flex; flex-direction: row;align-items: center;">
        <div>${super.render()}</div>
        <mwc-switch
          style="margin-left: 24px;"
          .checked=${!null}
          @change=${() => {
            this.null = !this.null;
            this.toggleValue();
            this.requestUpdate();
          }}
        ></mwc-switch>
      </div>
    `;
  }
}
