/* eslint-disable class-methods-use-this */
import { html } from 'lit-element';
import { ResponseViewElement } from '@advanced-rest-client/arc-response';
import { responseTemplate, responseHeadersTemplate, urlStatusTemplate } from '@advanced-rest-client/arc-response/src/internals.js';
import { DataExportEventTypes } from '@advanced-rest-client/arc-events';
import elementStyles from './styles/Response.styles.js';

/** @typedef {import('@advanced-rest-client/arc-events').ArcExportFilesystemEvent} ArcExportFilesystemEvent */

export const saveFileHandler = Symbol('saveFileHandler');

export class ApiResponseViewElement extends ResponseViewElement {
  get styles() {
    return elementStyles;
  }

  constructor() {
    super();
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
   * @param {ArcExportFilesystemEvent} e
   */
  [saveFileHandler](e) {
    const { providerOptions, data } = e;
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
    return html`
    ${this[urlStatusTemplate]()}
    ${this[responseHeadersTemplate]()}
    ${this[responseTemplate]('response', true)}
    `;
  }
}
