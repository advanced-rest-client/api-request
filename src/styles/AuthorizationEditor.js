import { css } from 'lit-element';

export default css`
:host {
  display: block;
}
.auth-label,
.auth-selector-label {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 12px 8px;
}
.auth-selector-label {
  font-size: var(--arc-font-subhead-font-size);
  font-weight: var(--arc-font-subhead-font-weight);
  line-height: var(--arc-font-subhead-line-height);
}
`;
