/* eslint-disable class-methods-use-this */
import { html } from 'lit-element';
import { ResponseViewElement } from '@advanced-rest-client/arc-response';
import { 
  responseTemplate, 
  rawTemplate, 
  urlStatusTemplate,
  responseOptionsItemsTemplate,
  contentActionHandler,
  responsePrefixTemplate,
} from '@advanced-rest-client/arc-response/src/internals.js';
import { DataExportEventTypes } from '@advanced-rest-client/arc-events';
import { dataValue, providerOptionsValue } from '@advanced-rest-client/arc-events/src/dataexport/Events.js';
import '@anypoint-web-components/anypoint-item/anypoint-icon-item.js';
import '@advanced-rest-client/arc-icons/arc-icon.js';
import '@advanced-rest-client/arc-headers/headers-list.js';
import elementStyles from '../styles/Response.styles.js';

/** @typedef {import('@advanced-rest-client/arc-events').ArcExportFilesystemEvent} ArcExportFilesystemEvent */
/** @typedef {import('@advanced-rest-client/arc-types').ArcResponse.Response} Response */
/** @typedef {import('lit-element').TemplateResult} TemplateResult */

export const saveFileHandler = Symbol('saveFileHandler');

export class ApiResponseViewElement extends ResponseViewElement {
  // @ts-ignore
  get styles() {
    return [elementStyles, super.styles];
  }

  static get properties() {
    return {
      /** 
       * Whether the response details view is opened.
       */
      details: { type: Boolean },
      /** 
       * Whether the source ("raw") view is opened.
       */
      source: { type: Boolean },
    };
  }

  constructor() {
    super();
    this.details = false;
    this.source = false;
    this[saveFileHandler] = this[saveFileHandler].bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener(DataExportEventTypes.fileSave, this[saveFileHandler]);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener(DataExportEventTypes.fileSave, this[saveFileHandler]);
  }

  /**
   * A handler for the content action drop down item selection
   * @param {CustomEvent} e
   */
  async [contentActionHandler](e) {
    const id = e.detail.selected;
    if (id === 'toggle-details') {
      this.details = !this.details;
      return undefined;
    }
    if (id === 'toggle-raw') {
      this.source = !this.source;
      return undefined;
    }
    return super[contentActionHandler](e);
  }

  /**
   * @param {ArcExportFilesystemEvent} e
   */
  [saveFileHandler](e) {
    const data = e[dataValue];
    const providerOptions = e[providerOptionsValue];
    const { file, contentType='text/plain' } = providerOptions;
    this.downloadFile(data, contentType, file);
  }

  /**
   * @param {BlobPart} data The exported data 
   * @param {string} mime The data content type
   * @param {string} file The export file name
   */
  downloadFile(data, mime, file) {
    const a = document.createElement('a');
    const blob = new Blob([data], { type: mime });
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = file;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);  
    }, 0); 
  }

  render() {
    if (!this.hasResponse) {
      return html``;
    }
    const { source } = this;
    return html`
    <style>${this.styles}</style>
    ${source ? this[rawTemplate]('raw', true) : this[responseTemplate]('response', true)}
    `;
  }

  /**
   * @returns {TemplateResult} The template for the response meta drop down options
   */
  [responseOptionsItemsTemplate]() {
    const { details, source } = this;
    const icon = details ? 'toggleOn' : 'toggleOff';
    const sourceLabel = source ? 'Formatted view' : 'Source view';
    return html`
    ${super[responseOptionsItemsTemplate]()}
    <anypoint-icon-item data-id="toggle-details" ?compatibility="${this.compatibility}">
      <arc-icon icon="${icon}" slot="item-icon"></arc-icon> Response details
    </anypoint-icon-item>
    <anypoint-icon-item data-id="toggle-raw" ?compatibility="${this.compatibility}">
      <arc-icon icon="code" slot="item-icon"></arc-icon> ${sourceLabel}
    </anypoint-icon-item>
    `;
  }

  /**
   * @returns {TemplateResult|string} The template for the response details, when rendered
   */
  [responsePrefixTemplate]() {
    const { details } = this;
    if (!details) {
      return '';
    }
    const info = /** @type Response */ (this.response);
    const headers = info && info.headers;
    return html`
    <div class="response-details">
      ${this[urlStatusTemplate]()}
      ${headers ? html`<headers-list class="summary-content" .headers="${headers}"></headers-list>` : html`<p class="summary-content">There are no recorded response headers</p>`}
    </div>
    `;
  }
}
