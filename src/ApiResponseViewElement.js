/* eslint-disable class-methods-use-this */
import { html } from 'lit-element';
import { ResponseViewElement } from '@advanced-rest-client/arc-response';
import { responseTemplate, responseHeadersTemplate, urlStatusTemplate } from '@advanced-rest-client/arc-response/src/internals.js';
import elementStyles from './styles/Response.styles.js';

export class ApiResponseViewElement extends ResponseViewElement {
  get styles() {
    return elementStyles;
  }

  render() {
    if (!this.hasResponse) {
      return html``;
    }
    return html`
    ${this[urlStatusTemplate]()}
    ${this[responseHeadersTemplate]()}
    ${this[responseTemplate]('response', true)}
    `;
  }
}
