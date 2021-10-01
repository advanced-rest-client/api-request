import { fixture, assert, html } from '@open-wc/testing';
import { AmfLoader } from '../AmfLoader.js';
import '../../api-request-editor.js';

/** @typedef {import('@api-components/amf-helper-mixin').AmfDocument} AmfDocument */
/** @typedef {import('../..').ApiRequestEditorElement} ApiRequestEditorElement */

describe('ApiRequestEditorElement', () => {
  describe('APIC-298', () => {
    const apiFile = 'APIC-298';

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

    [true].forEach((compact) => {
      describe(compact ? 'Compact model' : 'Full model', () => {
        let methodId;

        /** @type AmfLoader */
        let store;
        /** @type AmfDocument */
        let amf;
        before(async () => {
          store = new AmfLoader();
          amf = await store.getGraph(compact, apiFile);
        });

        /** @type ApiRequestEditorElement */
        let element;
        beforeEach(async () => {
          const method = store.lookupOperation(amf,  '/prescreens/{id}', 'get');
          methodId = method['@id'];
          element = await modelFixture(amf, methodId);
        });

        it('computes pth uri parameters', () => {
          const params = element.parametersValue;
          assert.lengthOf(params, 1, 'pathModel has no elements');
          const [param] = params;
          assert.equal(param.binding, 'path', 'has a path item only');
        });

        it('has OAS property name', () => {
          const params = element.parametersValue;
          const [param] = params;
          assert.equal(param.parameter.paramName, 'id');
        });
      });
    });
  });
});
