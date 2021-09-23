import { fixture, assert, html, aTimeout } from '@open-wc/testing';
import { ApiViewModel } from '@api-components/api-forms'
import { AmfLoader } from '../AmfLoader.js';
import '../../api-request-editor.js';

/** @typedef {import('../..').ApiRequestEditorElement} ApiRequestEditorElement */

describe('ApiRequestEditorElement', () => {
  describe('APIC-289', () => {
    /**
     * @returns {Promise<ApiRequestEditorElement>}
     */
    async function modelFixture(amf, selected) {
      return (fixture(html`<api-request-editor
        .amf="${amf}"
        .selected="${selected}"></api-request-editor>`));
    }

    const apiFile = 'APIC-289';
    [
      ['Compact model', true],
      ['Full model', false]
    ].forEach(([label, compact]) => {
      describe(`${label}`, () => {
        let factory = /** @type ApiViewModel */ (null);
        let amf;
        before(async () => {
          amf = await AmfLoader.load({ fileName: apiFile, compact });
          factory = new ApiViewModel();
        });

        after(() => {
          factory = null;
        });

        afterEach(() => {
          factory.clearCache();
        });

        it('generates query parameters model', async () => {
          const method = AmfLoader.lookupOperation(amf, '/organization', 'get');
          const element = await modelFixture(amf, method['@id']);
          await aTimeout(0);
          await aTimeout(0);
          const model = element._queryModel;
          assert.lengthOf(model, 1);
        });

        it('has OAS name on a parameter', async () => {
          const method = AmfLoader.lookupOperation(amf, '/organization', 'get');
          const element = await modelFixture(amf, method['@id']);
          await aTimeout(0);
          await aTimeout(0);
          const model = element._queryModel;
          assert.equal(model[0].name, 'foo');
        });
      });
    });
  });
});
