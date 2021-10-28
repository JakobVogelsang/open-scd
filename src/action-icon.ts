import {
  css,
  customElement,
  html,
  LitElement,
  property,
  state,
  TemplateResult,
} from 'lit-element';
import { classMap } from 'lit-html/directives/class-map';


@customElement('action-icon')
export class ActionIcon extends LitElement {
  @property({type: String})
  icon? : string;

  @property({ type: Boolean })
  small = false;

  @property({type: String})
  name? : string;

  @property({type: Boolean})
  endEllipsis = false;

  private renderIcon(): TemplateResult {
      if(this.icon) return html`<mwc-icon class="icon ${classMap({small: this.small})}">${this.icon}</mwc-icon>`;
      return html`<slot></slot>`;
  }

  protected override render(): TemplateResult {
    return html`<div class="container ${classMap({small: this.small})}" tabindex="0">
      ${this.renderIcon()}
      <slot name="action"></slot>
    </div>
    <h4 class="footer ${this.endEllipsis}">${this.name}</h4>`;
  }

  static styles = css`
    .container {
      color: var(--mdc-theme-on-surface);
      margin: auto;
      position: relative;
      transition: all 200ms linear;
    }

    .container:focus {
      outline: none;
    }

    .container {
      width: 64px;
      height: 64px;
    }

    .container.small {
      width: 50px;
      height: 50px;
    }

    .icon {
      color: var(--mdc-theme-on-surface);
      transition: transform 150ms linear, box-shadow 200ms linear;
      outline-color: var(--mdc-theme-primary);
      outline-style: solid;
      outline-width: 0px;
    }

    .icon {
      --mdc-icon-size: 64px;
    }

    .icon.small {
      --mdc-icon-size: 50px;
    }

    .container:hover > .icon {
      outline: 2px dashed var(--mdc-theme-primary);
      transition: transform 200ms linear, box-shadow 250ms linear;
    }

    .container:focus-within > .icon {
      outline: 2px solid var(--mdc-theme-primary);
      background: var(--mdc-theme-on-primary);
      transform: scale(0.8);
      transition: transform 200ms linear, box-shadow 250ms linear;
    }

    .container:focus-within > .icon + ::slotted(mwc-fab:nth-child(1)) {
          transform: translate(0px, -52px);
        }
    
    .container:focus-within > .icon + ::slotted(mwc-fab:nth-child(2)) {
          transform: translate(0px, 52px);
        }
    
    .container:focus-within > .icon  + ::slotted(mwc-fab:nth-child(3)) {
          transform: translate(52px, 0px);
        }
    
    .container:focus-within > .icon  + ::slotted(mwc-fab:nth-child(4)) {
          transform: translate(-52px, 0px);
        }

    .container:focus-within > .icon + ::slotted(mwc-fab:nth-child(5)){
          transform: translate(52px, -52px);
        }
    
    .container:focus-within > .icon  + ::slotted(mwc-fab:nth-child(6)) {
          transform: translate(-52px, 52px);
        }
    
    .container:focus-within > .icon  + ::slotted(mwc-fab:nth-child(7)) {
          transform: translate(-52px, -52px);
        }
    
    .container:focus-within > .icon  + ::slotted(mwc-fab:nth-child(8)) {
          transform: translate(52px, 52px);
        }

    .footer {
      color: var(--mdc-theme-on-surface);
      font-family: 'Roboto', sans-serif;
      font-weight: 300;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      margin: 0px;
      opacity: 1;
      transition: opacity 200ms linear;
      text-align: center;
    }

    .footer.right {
      direction: rtl;
    }

    ::slotted(mwc-fab) {
      color: var(--mdc-theme-on-surface);
      transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1),
        opacity 200ms linear;
      position: absolute;
      pointer-events: none;
      z-index: 1;
      opacity: 0;
    }

    .icon + ::slotted(mwc-fab) {
      top: 8px;
      left: 8px;
    }

    .icon.small + ::slotted(mwc-fab) {
      top: 2px;
      left: 2px;
    }

    .container:focus-within > ::slotted(mwc-fab) {
      transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1),
        opacity 250ms linear;
      pointer-events: auto;
      opacity: 1;
    }

  `;
}
