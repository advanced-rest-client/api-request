import { html } from 'lit-html';
import { ApiDemoPage } from '@advanced-rest-client/arc-demo-helper';
import '@anypoint-web-components/anypoint-checkbox/anypoint-checkbox.js';
import '@advanced-rest-client/arc-demo-helper/arc-interactive-demo.js';
import '@api-components/api-navigation/api-navigation.js';
import '@advanced-rest-client/oauth-authorization/oauth2-authorization.js';
import '@advanced-rest-client/oauth-authorization/oauth1-authorization.js';
import '../xhr-simple-request.js';
import '../api-request-panel.js';

class ComponentDemo extends ApiDemoPage {
  constructor() {
    super();

    this.initObservableProperties([
      'outlined',
      'readOnly',
      'disabled',
      'narrow',
      'selectedAmfId',
      'allowCustom',
      'allowHideOptional',
      'allowDisableParams',
      'noDocs',
      'noUrlEditor',
      'renderCustomServer',
      'allowCustomBaseUri',
      'noServerSelector',
      'urlLabel',
      'selectedServerValue',
    ]);
    this.componentName = 'api-request-panel';
    this.allowCustom = false;
    this.allowHideOptional = true;
    this.allowDisableParams = true;
    this.renderCustomServer = false;
    this.noServerSelector = false;
    this.allowCustomBaseUri = false;
    this.urlLabel = false;
    this.readOnly = false;
    this.disabled = false;
    this.noUrlEditor = false;

    this.demoStates = ['Filled', 'Outlined', 'Anypoint'];
    /* eslint-disable-next-line no-restricted-globals */
    this.redirectUri = `${location.origin}/node_modules/@advanced-rest-client/oauth-authorization/oauth-popup.html`;
    this._serverChangeHandler = this._serverChangeHandler.bind(this);
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
      ['google-drive-api', 'Google Drive'],
      ['httpbin', 'httpbin.org'],
      ['demo-api', 'Demo API'],
      ['multi-server', 'Multiple servers'],
      ['appian-api', 'Applian API'],
      ['loan-microservice', 'Loan microservice (OAS)'],
      ['array-body', 'Request body with an array (reported issue)'],
      ['SE-12042', 'Default values issue (SE-12042)'],
      ['SE-12224', 'Scope is not an array issues (SE-12224)'],
      ['APIC-168', 'Custom scheme support (APIC-168)'],
      ['async-api', 'AsyncAPI'],
    ].map(
      ([file, label]) => html`
        <anypoint-item data-src="${file}-compact.json"
          >${label} - compact model</anypoint-item
        >
      `
    );
  }

  _addCustomServers() {
    if (!this.renderCustomServer) {
      return html``;
    }
    return html`<anypoint-item
        slot="custom-base-uri"
        value="http://customServer.com"
        >http://customServer.com</anypoint-item
      >
      <anypoint-item slot="custom-base-uri" value="http://customServer.com2"
        >http://customServer.com2</anypoint-item
      >`;
  }

  _serverChangeHandler(e) {
    const { value } = e.detail;
    // The parent keeps current selection which is then passed back to the
    // server selector. In API Console, the console holds the selected value
    // so it can be distributed between api-documentation and api-request-panel,
    // even when panels are re-rendered. This way the application don't loose
    // track of that was selected.
    // The selector take cares of a situation when current selection is no
    // longer available and clears the state.
    this.selectedServerValue = value;
  }

  _demoTemplate() {
    const {
      demoStates,
      darkThemeActive,
      outlined,
      compatibility,
      readOnly,
      disabled,
      amf,
      redirectUri,
      allowCustom,
      allowHideOptional,
      allowDisableParams,
      selectedAmfId,
      noServerSelector,
      allowCustomBaseUri,
      noUrlEditor,
      urlLabel,
      selectedServerValue,
    } = this;
    return html` <section class="documentation-section">
      <h3>Interactive demo</h3>
      <p>
        This demo lets you preview the API request panel element with various
        configuration options.
      </p>
      <arc-interactive-demo
        .states="${demoStates}"
        @state-changed="${this._demoStateHandler}"
        ?dark="${darkThemeActive}"
      >
        <div slot="content">
          <api-request-panel
            .amf="${amf}"
            .selected="${selectedAmfId}"
            ?allowCustom="${allowCustom}"
            ?allowHideOptional="${allowHideOptional}"
            ?allowDisableParams="${allowDisableParams}"
            ?outlined="${outlined}"
            ?compatibility="${compatibility}"
            ?readOnly="${readOnly}"
            ?disabled="${disabled}"
            ?noUrlEditor="${noUrlEditor}"
            ?urlLabel="${urlLabel}"
            ?noServerSelector="${noServerSelector}"
            ?allowCustomBaseUri="${allowCustomBaseUri}"
            .redirectUri="${redirectUri}"
            .serverValue="${selectedServerValue}"
            @apiserverchanged="${this._serverChangeHandler}"
          >
            ${this._addCustomServers()}
          </api-request-panel>
        </div>
        <label slot="options" id="mainOptionsLabel">Options</label>
        <anypoint-checkbox
          aria-describedby="mainOptionsLabel"
          slot="options"
          name="readOnly"
          @change="${this._toggleMainOption}"
          >Read only</anypoint-checkbox
        >
        <anypoint-checkbox
          aria-describedby="mainOptionsLabel"
          slot="options"
          name="disabled"
          @change="${this._toggleMainOption}"
          >Disabled</anypoint-checkbox
        >
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
          name="allowDisableParams"
          .checked="${allowDisableParams}"
          @change="${this._toggleMainOption}"
          >Allow disable params</anypoint-checkbox
        >
        
        <anypoint-checkbox
          aria-describedby="mainOptionsLabel"
          slot="options"
          name="noUrlEditor"
          @change="${this._toggleMainOption}"
          >No URL editor</anypoint-checkbox
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
          name="renderCustomServer"
          @change="${this._toggleMainOption}"
          >Slot custom servers</anypoint-checkbox
        >
        <anypoint-checkbox
          aria-describedby="mainOptionsLabel"
          slot="options"
          name="allowCustomBaseUri"
          @change="${this._toggleMainOption}"
          >Allow Custom Base Uri</anypoint-checkbox
        >
        <anypoint-checkbox
          aria-describedby="mainOptionsLabel"
          slot="options"
          name="noServerSelector"
          @change="${this._toggleMainOption}"
          >No Server Selector</anypoint-checkbox
        >
      </arc-interactive-demo>
    </section>`;
  }

  _introductionTemplate() {
    return html`
      <section class="documentation-section">
        <h3>Introduction</h3>
        <p>
          A web component to render accessible request data editor based on AMF
          model.
        </p>
        <p>This component implements Material Design styles.</p>
      </section>
    `;
  }

  _usageTemplate() {
    return html` <section class="documentation-section">
      <h2>Usage</h2>
      <p>API request panel comes with 3 predefined styles:</p>
      <ul>
        <li><b>Filled</b> (default)</li>
        <li>
          <b>Outlined</b> - Material design outlined inputs, use
          <code>outlined</code> property
        </li>
        <li>
          <b>Compatibility</b> - To provide compatibility with Anypoint design,
          use <code>compatibility</code> property
        </li>
      </ul>

      <h3>Handling request event</h3>
      <p>
        The element do not perform a request. It dispatches
        <code>api-request</code> custom event with request object on the detail
        property of the event. The hosting application should handle this event
        and perform the request. When the response is ready the application
        should dispatch <code>api-response</code> property with the same
        <code>id</code> value from the request object. The element clears its
        state when the event is handled.
      </p>

      <h3>AMF model selection</h3>
      <p>
        The element handles selected shape computation after
        <code>selected</code> property is set. The property should be set to AMF
        supportedOperation node's <code>@id</code> value.
      </p>
      <p>
        Use
        <a href="https://github.com/advanced-rest-client/api-navigation">
          api-navigation
        </a>
        element to provide the user with accessible navigation through the AMF
        model.
      </p>

      <h3>Override base URI</h3>
      <p>
        Sometimes you may need to override APIs base URI. The element provides
        <code>baseUri</code>
        property that can be set to replace API's base URI to some other value.
      </p>

      <h3>Allowing custom properties</h3>
      <p>
        By default the editor only renders form controls to the ones defined in
        the API spec file. When model for URI/query parameters, headers, or body
        is not present then the corresponding editor is not rendered. Also, when
        the editors are rendered there's no option for the user to defined a
        parameter that is not defined in the API specification.
      </p>

      <p>
        To allow the user to add custom properties in the editors use
        <code>allowCustom</code>
        property. It will force query parameters editor to appear when hidden
        and the editors renders "add" button in their forms.
      </p>

      <h3>Partial model support</h3>
      <p>
        Partial model is generated by the AMF service (by MuleSoft) to reduce
        data transfer size and to reach the performance budget when initializing
        applications like API Console.<br />
        Partial model contains data that are only required to generate view for
        current API selection.
      </p>

      <p>
        The element renders the model that is given to it. However, partial
        model may be missing information about server, protocols, and API
        version which are required to properly compute URL value.
      </p>

      <p>
        Note, this can be ignored when setting <code>baseUri</code> as this
        overrides any API model value.
      </p>

      <p>
        Pass corresponding model values to <code>server</code>,
        <code>protocols</code>, and <code>version</code>
        properties when expecting partial AMF model.
      </p>

      <h3>OAuth 2</h3>
      <p>
        You need to set <code>redirectUri</code> property to a OAuth 2 redirect
        popup location. Otherwise authorization won't be initialized.
      </p>

      <h3>Validation</h3>
      <p>
        The element sets <code>invalid</code> attribute when the editor contains
        invalid data. You can use it to style the element for invalid input.
      </p>

      <p>
        * When all forms are reported valid but OAuth 2 has no access token
        value the element still reports it as valid. When the user try to press
        the send button it will try to force authorization on currently selected
        authorization panel before making the request.
      </p>
    </section>`;
  }

  contentTemplate() {
    return html`
      <oauth2-authorization></oauth2-authorization>
      <oauth1-authorization></oauth1-authorization>
      <xhr-simple-request></xhr-simple-request>
      <h2 class="centered main">API request panel</h2>
      ${this._demoTemplate()} ${this._introductionTemplate()}
      ${this._usageTemplate()}
    `;
  }
}
const instance = new ComponentDemo();
instance.render();
