import { assert, fixture, html } from '@open-wc/testing';
import { AmfLoader } from '../AmfLoader.js';
import '../../api-request-editor.js';
import * as InputCache from '../../src/lib/InputCache.js';


/** @typedef {import('@api-components/amf-helper-mixin').AmfDocument} AmfDocument */
/** @typedef {import('../..').ApiRequestEditorElement} ApiRequestEditorElement */

describe('ApiRequestEditorElement', () => {
  describe('SE-12957', () => {
    const apiFile = 'SE-12957';

    /*
     * This issue is about rendering URI parameters in the operation parameters,
     * as URI parameters can appear in the Server, Endpoint, and Operation model.
     */

    /**
     * @param {AmfDocument} amf
     * @param {string} selected
     * @returns {Promise<ApiRequestEditorElement>}
     */
    async function modelFixture(amf, selected) {
      return (fixture(html`<api-request-editor
        .amf="${amf}"
        .selected="${selected}"></api-request-editor>`));
    }

    // 2021-09-27T14:55:33.688

    [true, false].forEach((compact) => {
      describe(compact ? 'Compact model' : 'Full model', () => {
        /** @type AmfLoader */
        let store;
        /** @type AmfDocument */
        let amf;

        before(async () => {
          store = new AmfLoader();
          amf = await store.getGraph(compact, apiFile);
        });

        it('renders the input for the URI parameter', async () => {
          const method = store.lookupOperation(amf, '/api/v1/alarm/{scada-object-key}', 'get');
          const methodId = method['@id'];
          const editor = await modelFixture(amf, methodId);
          const input = editor.shadowRoot.querySelector('[name="scada-object-key"]');
          assert.ok(input);
        });

        // 
        // accidentally I discovered that the `dateTime` input is not rendering correctly
        // after updating the cached values.
        // 

        it('renders the dateTime query parameter', async () => {
          const method = store.lookupOperation(amf, '/api/v1/alarm/{scada-object-key}', 'get');
          const methodId = method['@id'];
          const editor = await modelFixture(amf, methodId);
          const input = editor.shadowRoot.querySelector('[name="time-on"]');
          assert.ok(input);
        });

        it('sets the proper value on the dateTime parameter', async () => {
          const method = store.lookupOperation(amf, '/api/v1/alarm/{scada-object-key}', 'get');
          const methodId = method['@id'];
          const editor = await modelFixture(amf, methodId);
          const input = /** @type HTMLInputElement */ (editor.shadowRoot.querySelector('[name="time-on"]'));
          // this is valid value but the <input> filed ignores this format.
          InputCache.set(editor, input.dataset.domainId, '2021-09-27T14:55:33.688Z', false);
          await editor.requestUpdate();
          assert.equal(input.value, '2021-09-27T14:55:33.688');
        });
      });
    });
  });
});
