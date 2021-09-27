import { assert, fixture, html } from '@open-wc/testing';
import { AmfLoader } from '../AmfLoader.js';
import '../../api-request-editor.js';

/** @typedef {import('@api-components/amf-helper-mixin').AmfDocument} AmfDocument */
/** @typedef {import('../..').ApiRequestEditorElement} ApiRequestEditorElement */

describe('ApiRequestEditorElement', () => {
  describe('APIC-689', () => {
    const apiFile = 'APIC-689';

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

        it('does not set URL query param for an optional enum', async () => {
          const method = store.lookupOperation(amf, '/test', 'get');
          const methodId = method['@id'];
          const editor = await modelFixture(amf, methodId);
          const values = editor.serialize();
          assert.equal(values.url, '/test', 'param value is not set');
        });

        it('sets URL query param for a required enum', async () => {
          const method = store.lookupOperation(amf, '/test', 'post');
          const methodId = method['@id'];
          const editor = await modelFixture(amf, methodId);
          const values = editor.serialize();
          assert.equal(values.url, '/test?param1=A', 'param value is set');
        });
      });
    });
  });
});
