import { CSSResult, TemplateResult } from 'lit-element';
import { ResponseViewElement } from '@advanced-rest-client/arc-response';
import { ArcExportFilesystemEvent } from '@advanced-rest-client/arc-events';

export declare const saveFileHandler: unique symbol;

export declare class ApiResponseViewElement extends ResponseViewElement {
  get styles(): CSSResult;

  constructor();

  connectedCallback(): void;

  disconnectedCallback(): void;

  [saveFileHandler](e: ArcExportFilesystemEvent): void;

  /**
   * @param data The exported data 
   * @param mime The data content type
   * @param file The export file name
   */
  downloadFile(data: BlobPart, mime: string, file: string): void;

  render(): TemplateResult;
}
