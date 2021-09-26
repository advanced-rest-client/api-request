import { fixture, assert, html, aTimeout } from '@open-wc/testing';
import { AmfLoader } from '../AmfLoader.js';
import '../../api-request-editor.js';

/** @typedef {import('@api-components/amf-helper-mixin').AmfDocument} AmfDocument */
/** @typedef {import('../..').ApiRequestEditorElement} ApiRequestEditorElement */

describe('ApiRequestEditorElement', () => {
  describe('APIC-289', () => {
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

    const apiFile = 'APIC-289';
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

        it('generates query parameters model', async () => {
          const method = store.lookupOperation(amf, '/organization', 'get');
          const element = await modelFixture(amf, method['@id']);
          await aTimeout(0);
          await aTimeout(0);
          const model = element.parametersValue;
          assert.lengthOf(model, 1);
        });

        it('has OAS name on a parameter', async () => {
          const method = store.lookupOperation(amf, '/organization', 'get');
          const element = await modelFixture(amf, method['@id']);
          await aTimeout(0);
          await aTimeout(0);
          const model = element.parametersValue.find(p => p.parameter.name === 'foo_bar');
          assert.equal(model.parameter.paramName, 'foo');
        });

        it('render parameter name with the input', async () => {
          const method = store.lookupOperation(amf, '/organization', 'get');
          const element = await modelFixture(amf, method['@id']);
          await aTimeout(0);
          await aTimeout(0);
          const node = element.shadowRoot.querySelector('.form-input label');
          assert.equal(node.textContent.trim(), 'foo*');
        });
      });
    });
  });
});
