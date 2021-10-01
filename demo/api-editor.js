import { html } from 'lit-html';
import { ApiDemoPage } from '@advanced-rest-client/arc-demo-helper';
import { MonacoLoader } from '@advanced-rest-client/monaco-support';
import '@anypoint-web-components/anypoint-checkbox/anypoint-checkbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-item.js';
import '@advanced-rest-client/arc-demo-helper/arc-interactive-demo.js';
import '@advanced-rest-client/authorization/oauth2-authorization.js';
import '@advanced-rest-client/authorization/oauth1-authorization.js';
import '../xhr-simple-request.js';
import '../api-request-editor.js';

class ComponentDemo extends ApiDemoPage {
  constructor() {
    super();
    this.initObservableProperties([
      'outlined',
      'selectedAmfId',
      'allowCustom',
      'allowHideOptional',
      'responseBody',
      'urlLabel',
      'urlEditor',
      'renderCustomServer',
      'allowCustomBaseUri',
      'noServerSelector',
      'applyAuthorization',
    ]);
    this.componentName = 'api-request-editor';
    this.allowCustom = true;
    this.allowHideOptional = true;
    this.urlLabel = false;
    this.urlEditor = true;
    this.renderCustomServer = false;
    this.noServerSelector = false;
    this.allowCustomBaseUri = false;
    this.applyAuthorization = true;

    this.demoStates = ['Filled', 'Outlined', 'Anypoint'];
    this._demoStateHandler = this._demoStateHandler.bind(this);
    this._toggleMainOption = this._toggleMainOption.bind(this);
    this._responseReady = this._responseReady.bind(this);
    this._apiRequestHandler = this._apiRequestHandler.bind(this);
    this.redirectUri = `${window.location.origin}/node_modules/@advanced-rest-client/oauth-authorization/oauth-popup.html`;
    this.loadMonaco();
  }

  async loadMonaco() {
    const base = `../node_modules/monaco-editor/`;
    MonacoLoader.createEnvironment(base);
    await MonacoLoader.loadMonaco(base);
    await MonacoLoader.monacoReady();
  }

  _demoStateHandler(e) {
    const state = e.detail.value;
    this.outlined = state === 1;
    this.compatibility = state === 2;
    this._updateCompatibility();
  }

  _authSettingsChanged(e) {
    const value = e.detail;
    this.authSettings = value;
    this.authSettingsValue = value ? JSON.stringify(value, null, 2) : '';
  }

  _navChanged(e) {
    this.selectedAmfId = undefined;
    this.responseBody = undefined;
    const { selected, type } = e.detail;
    if (type === 'method') {
      this.selectedAmfId = selected;
      this.hasData = true;
    } else {
      this.hasData = false;
    }
  }

  _apiListTemplate() {
    return [
      ['demo-api', 'Demo API'],
      ['google-drive-api', 'Google Drive'],
      ['multi-server', 'Multiple servers'],
      ['httpbin', 'httpbin.org'],
      ['APIC-168', 'APIC-168: Custom scheme support'],
      ['apic-169', 'apic-169'],
      ['APIC-289', 'APIC-289: OAS param names'],
      ['APIC-298', 'APIC-298: OAS param names 2'],
      ['APIC-480', 'APIC-480'],
      ['APIC-613', 'APIC-613'],
      ['APIC-689', 'APIC-689: Enum values'],
      ['SE-12042', 'SE-12042: Default values issue'],
      ['SE-12224', 'SE-12224: Scope is not an array issues'],
      ['SE-12957', 'SE-12957: OAS query parameters documentation'],
      ['api-keys', 'API key'],
      ['oas-demo', 'OAS Demo API'],
      ['oauth-flows', 'OAS OAuth Flow'],
      ['oas-bearer', 'OAS Bearer'],
      ['secured-api', 'Security demo'],
      ['21143', '21143'],
      ['annotated-parameters', 'annotated-parameters'],
    ].map(([file, label]) => html`
      <anypoint-item data-src="${file}-compact.json">${label}</anypoint-item>
      `);
      // <anypoint-item data-src="${file}.json">${label}</anypoint-item>
  }

  _responseReady(e) {
    const { isError, response } = e.detail;
    if (isError) {
      this.responseBody = 'Error in response';
    } else {
      this.responseBody = response.payload;
    }
  }

  _apiRequestHandler(e) {
    console.log(e.detail);
  }

  requestChangeHandler() {
    console.log('requestChangeHandler');
  }

  dispatchAnnotations() {
    const detail = { 
      values: [
        { annotationName: 'credentialType', annotationValue: 'id', fieldValue: 'test value 1' },
        { annotationName: 'credentialType', annotationValue: 'secret', fieldValue: 'test value 2' },
      ] 
    };
    document.dispatchEvent(new CustomEvent('populate_annotated_fields', { detail, bubbles: true }));
  }

  _demoTemplate() {
    const {
      demoStates,
      darkThemeActive,
      outlined,
      compatibility,
      amf,
      redirectUri,
      allowCustom,
      allowHideOptional,
      selectedAmfId,
      responseBody,
      urlLabel,
      urlEditor,
      noServerSelector,
      allowCustomBaseUri,
      applyAuthorization,
    } = this;
    return html `
    <section class="documentation-section">
      <h3>Interactive demo</h3>
      <p>
        This demo lets you preview the API Request Editor element with various
        configuration options.
      </p>


      <arc-interactive-demo
        .states="${demoStates}"
        @state-changed="${this._demoStateHandler}"
        ?dark="${darkThemeActive}"
      >

        <div slot="content">
          <api-request-editor
            .amf="${amf}"
            .selected="${selectedAmfId}"
            ?allowCustom="${allowCustom}"
            ?allowHideOptional="${allowHideOptional}"
            ?outlined="${outlined}"
            ?compatibility="${compatibility}"
            ?urlLabel="${urlLabel}"
            ?urlEditor="${urlEditor}"
            ?applyAuthorization="${applyAuthorization}"
            globalCache
            .redirectUri="${redirectUri}"
            ?noServerSelector="${noServerSelector}"
            ?allowCustomBaseUri="${allowCustomBaseUri}"
            @api-request="${this._apiRequestHandler}"
            @change="${this.requestChangeHandler}"
          >
            ${this._addCustomServers()}
          </api-request-editor>
          ${responseBody ? html`<h3>Latest response</h3>
          <output class="response-output" tabindex="0">${responseBody}</output>` : ''}
        </div>

        <label slot="options" id="mainOptionsLabel">Options</label>
        
        <anypoint-checkbox
          aria-describedby="mainOptionsLabel"
          slot="options"
          name="allowCustom"
          .checked="${allowCustom}"
          @change="${this._toggleMainOption}"
          >Allow custom</anypoint-checkbox
        >
        <anypoint-checkbox
          aria-describedby="mainOptionsLabel"
          slot="options"
          name="allowHideOptional"
          .checked="${allowHideOptional}"
          @change="${this._toggleMainOption}"
          >Allow hide optional</anypoint-checkbox
        >
        <anypoint-checkbox
          aria-describedby="mainOptionsLabel"
          slot="options"
          name="urlLabel"
          @change="${this._toggleMainOption}"
          >URL label</anypoint-checkbox
        >
        <anypoint-checkbox
          aria-describedby="mainOptionsLabel"
          slot="options"
          name="urlEditor"
          @change="${this._toggleMainOption}"
          .checked="${urlEditor}"
          >URL editor</anypoint-checkbox
        >
        <anypoint-checkbox
          aria-describedby="mainOptionsLabel"
          slot="options"
          name="renderCustomServer"
          @change="${this._toggleMainOption}"
          >Custom servers</anypoint-checkbox
        >
        <anypoint-checkbox
          aria-describedby="mainOptionsLabel"
          slot="options"
          name="allowCustomBaseUri"
          @change="${this._toggleMainOption}"
          >Custom Base Uri</anypoint-checkbox
        >
        <anypoint-checkbox
          aria-describedby="mainOptionsLabel"
          slot="options"
          name="noServerSelector"
          @change="${this._toggleMainOption}"
        >
          Remove Server Selector
        </anypoint-checkbox>
        <anypoint-checkbox
          aria-describedby="mainOptionsLabel"
          slot="options"
          name="applyAuthorization"
          .checked="${applyAuthorization}"
          @change="${this._toggleMainOption}"
          title="Applies authorization configuration to the request when dispatching the event"
        >
          Apply authorization
        </anypoint-checkbox>
      </arc-interactive-demo>
    </section>`;
  }

  _addCustomServers() {
    if (!this.renderCustomServer) {
      return '';
    }
    const { compatibility } = this;
    return html`
    <div class="other-section" slot="custom-base-uri">Other options</div>
    <anypoint-item
      slot="custom-base-uri"
      data-value="http://mocking.com"
      ?compatibility="${compatibility}"
    >Mocking service</anypoint-item>
    <anypoint-item
      slot="custom-base-uri"
      data-value="http://customServer.com2"
      ?compatibility="${compatibility}"
    >Custom instance</anypoint-item>`;
  }

  _annotationsEventTemplate() {
    return html `
      <section class="documentation-section">
        <h3>Annotations event</h3>
        <p>
          Dispatch event to update values from annotations.
          <anypoint-button @click="${this.dispatchAnnotations}">Dispatch</anypoint-button>
        </p>
      </section>
    `;
  }

  contentTemplate() {
    return html`
    <xhr-simple-request @api-response="${this._responseReady}"></xhr-simple-request>
    <oauth1-authorization></oauth1-authorization>
    <oauth2-authorization></oauth2-authorization>
    <h2 class="centered main">API request editor</h2>
    ${this._demoTemplate()}
    ${this._annotationsEventTemplate()}
    `;
  }
}
const instance = new ComponentDemo();
instance.render();
