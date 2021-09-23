import { css } from 'lit-element';

export default css`
.form-input {
  flex: 1;
  margin: 0;
}

.params-section {
  margin: 20px 0;
}

.section-title .label {
  font-style: var(--http-request-section-title-font-size, 1.2rem);
  font-weight: var(--http-request-section-title-font-weight, 500);
}

.form-item {
  margin: 12px 0;
  display: flex;
  align-items: center;
  flex-direction: row;
}

.array-form-item {
  padding-left: 8px;
  border-left: 1px var(--http-request-array-section-border-color, rgba(0, 0, 0, 0.14)) solid;
}

.subtitle {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 12px 8px;
}

.section-title {
  margin: 20px 8px 0px 8px;
  display: block;
}

arc-marked {
  background-color: var(--inline-documentation-background-color, #FFF3E0);
  padding: 4px;
}

anypoint-input, anypoint-dropdown-menu, anypoint-masked-input {
  flex: 1;
  width: auto;
  margin: 20px 0;
}

.form-item anypoint-input,
.form-item anypoint-dropdown-menu,
.form-item anypoint-masked-input {
  margin: 0;
}

`;
