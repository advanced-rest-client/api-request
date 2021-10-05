import { css } from 'lit-element';

export default css`
:host {
  display: block;
}

.content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content > * {
  margin: 0;
}

[hidden] {
  display: none !important;
}

.panel-warning {
  width: 16px;
  height: 16px;
  margin-left: 4px;
  color: var(--error-color, #FF7043);
}

.invalid-info {
  color: var(--error-color);
  margin-left: 12px;
}

.action-bar {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 8px;
}

.url-editor {
  display: flex;
  flex-direction: row;
  align-items: center;
}

api-url-editor {
  flex: 1;
}

.send-button {
  white-space: nowrap;
}

.section-title {
  margin: var(--arc-font-subhead-margin, 0.83em 8px);
  letter-spacing: var(--arc-font-subhead-letter-spacing, initial);
  font-size: var(--arc-font-subhead-font-size, 20px);
  font-weight: var(--arc-font-subhead-font-weight, 200);
  line-height: var(--arc-font-subhead-line-height);
}

.editor-section {
  margin: 8px 0;
}

:host([compatibility]) .section-title {
  font-size: var(--anypoint-subhead-font-size, var(--arc-font-subhead-font-size, 18px));
  font-weight: var(--anypoint-subhead-font-weight, var(--arc-font-subhead-font-weight, 400));
  letter-spacing: var(--anypoint-subhead-letter-spacing, var(--arc-font-subhead-letter-spacing, initial));
  margin: var(--anypoint-subhead-margin, var(--arc-font-subhead-margin, 1em 8px));
  line-height: var(--anypoint-subhead-line-height, var(--arc-font-subhead-line-height));
}

:host([narrow]) .content {
  display: flex;
  flex-direction: columns;
}

:host([narrow]) api-url-editor {
  width: auto;
}

.url-label {
  margin: 8px 0;
  padding: 12px 8px;
  border-radius: 3px;

  background-color: var(--api-request-editor-readonly-url-background-color, rgba(0, 0, 0, 0.12));
  color: var(--api-request-editor-readonly-url-color, currentColor);
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-all;
}

.params-editor {
  margin: 0 8px;
}

.auth-selector {
  margin: 12px 0;
}

.payload-mime-selector {
  display: flex;
  align-items: center;
}

.form-item {
  margin: 12px 0;
  display: flex;
  align-items: center;
  flex-direction: row;
}

:host([compatibility]) .form-item {
  margin: 20px 0 28px 0;
}

.array-form-item {
  padding-left: 8px;
  border-left: 1px var(--api-request-editor-array-section-border-color, rgba(0, 0, 0, 0.14)) solid;
}

.api-server-selector, .param-selector, .form-input {
  flex: 1 1 0%;
  margin: 0px;
}

.hide-optional .optional {
  display: none;
}

.custom-item .custom-name {
  margin-right: 4px;
}

.custom-item .custom-value {
  margin-left: 4px;
}

.url-input-wrapper {
  display: flex;
  margin: 16px 0;
}

.url-input {
  flex: 1;
  margin: 0;
}
`;
