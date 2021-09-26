import { fixture, assert, html, aTimeout } from '@open-wc/testing';
import sinon from 'sinon';
import { AmfLoader } from '../AmfLoader.js';
import '../../api-request-editor.js';

/** @typedef {import('@api-components/amf-helper-mixin').AmfDocument} AmfDocument */
/** @typedef {import('../..').ApiRequestEditorElement} ApiRequestEditorElement */

describe('ApiRequestEditorElement', () => {
  describe('SE-12042', () => {
    /**
     * @param {AmfDocument} amf
     * @param {string} selected
     * @returns {Promise<ApiRequestEditorElement>}
     */
    async function modelFixture(amf, selected) {
      return (fixture(html`<api-request-editor
        .amf="${amf}"
        .selected="${selected}"
        applyAuthorization></api-request-editor>`));
    }

    const apiFile = 'SE-12042';
    [
      ['Compact model', true],
      ['Full model', false]
    ].forEach(([label, compact]) => {
      describe(`${label}`, () => {
        describe('http method computation', () => {
          /** @type AmfLoader */
          let store;
          /** @type AmfDocument */
          let amf;
          before(async () => {
            store = new AmfLoader();
            amf = await store.getGraph(Boolean(compact), apiFile);
          });

          it('sets headers from the authorization method', async () => {
            const method = store.lookupOperation(amf, '/check/api-status', 'get');
            const element = await modelFixture(amf, method['@id']);
            await aTimeout(10);
            const spy = sinon.spy();
            element.addEventListener('api-request', spy);
            element.execute();
            const { detail } = spy.args[0][0];
            const { headers } = detail;
            assert.equal(headers,
              'Client-Id: 283a6722121141feb7a929793d5c\nClient-Secret: 1421b7a929793d51fe283a67221c');
          });

          it('sets query parameter from the authorization method', async () => {
            const method = store.lookupOperation(amf, '/check/api-status', 'get');
            const element = await modelFixture(amf, method['@id']);
            await aTimeout(0);
            const spy = sinon.spy();
            element.addEventListener('api-request', spy);
            element.execute();
            const { detail } = spy.args[0][0];
            const { url } = detail;

            assert.include(url,
              'api-status?testParam=x-test-value');
          });
        });
      });
    });
  });
});
