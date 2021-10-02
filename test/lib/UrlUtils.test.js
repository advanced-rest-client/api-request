import { assert } from '@open-wc/testing';
import { AmfLoader } from '../AmfLoader.js';
import {
  computeApiBaseUri,
  computeEndpointUri,
  wwwFormUrlEncode,
  applyUrlVariables,
  applyUrlParameters,
} from '../../src/lib/UrlUtils.js';

/** @typedef {import('@api-components/amf-helper-mixin').ApiServer} ApiServer */
/** @typedef {import('@api-components/amf-helper-mixin').AmfDocument} AmfDocument */

describe('Libraries', () => {
  describe('URL library', () => {
    /** @type AmfLoader */
    let store;
    /** @type AmfDocument */
    let demoApiModel;
    /** @type AmfDocument */
    let petstoreModel;
    /** @type AmfDocument */
    let oas3Model;
    before(async () => {
      store = new AmfLoader();
      demoApiModel = await store.getGraph(true, 'demo-api');
      petstoreModel = await store.getGraph(true, 'petstore');
      oas3Model = await store.getGraph(true, 'oas-3-api');
    });

    describe('computeApiBaseUri', () => {
      const baseUri = 'https://api.com';

      it('returns the passed base URI', () => {
        const result = computeApiBaseUri({
          baseUri,
        });

        assert.equal(result, baseUri);
      });

      it('returns empty string when no server', () => {
        const result = computeApiBaseUri({});

        assert.equal(result, '');
      });

      it('returns base URI defined in the APiServer', () => {
        const server = /** @type ApiServer */ ({
          id: '',
          types: [],
          customDomainProperties: [],
          url: baseUri,
          variables: [],
        });
        const result = computeApiBaseUri({ server });

        assert.equal(result, baseUri);
      });

      it('removes the path part from the server', () => {
        const server = /** @type ApiServer */ ({
          id: '',
          types: [],
          customDomainProperties: [],
          url: `${baseUri}/`,
          variables: [],
        });
        const result = computeApiBaseUri({ server });

        assert.equal(result, baseUri);
      });

      it('adds the protocol from the server model', () => {
        const server = /** @type ApiServer */ ({
          id: '',
          types: [],
          customDomainProperties: [],
          url: 'api.com',
          protocol: 'amp',
          variables: [],
        });
        const result = computeApiBaseUri({ server });

        assert.equal(result, 'amp://api.com');
      });

      it('adds the protocol from the passed argument', () => {
        const server = /** @type ApiServer */ ({
          id: '',
          types: [],
          customDomainProperties: [],
          url: 'api.com',
          variables: [],
        });
        const result = computeApiBaseUri({ server, protocols: ['smtp'] });

        assert.equal(result, 'smtp://api.com');
      });

      it('server protocol takes precedence over passed argument', () => {
        const server = /** @type ApiServer */ ({
          id: '',
          types: [],
          customDomainProperties: [],
          url: 'api.com',
          protocol: 'amp',
          variables: [],
        });
        const result = computeApiBaseUri({ server, protocols: ['smtp'] });

        assert.equal(result, 'amp://api.com');
      });

      it('ignores the protocol when no URI', () => {
        const server = /** @type ApiServer */ ({
          id: '',
          types: [],
          customDomainProperties: [],
          url: undefined,
          protocol: 'amp',
          variables: [],
        });
        const result = computeApiBaseUri({ server, protocols: ['smtp'] });

        assert.equal(result, '');
      });

      it('replaces the version value', () => {
        const server = /** @type ApiServer */ ({
          id: '',
          types: [],
          customDomainProperties: [],
          url: `${baseUri}/{version}`,
          variables: [],
        });
        const result = computeApiBaseUri({ server, version: 'v1' });

        assert.equal(result, `${baseUri}/v1`);
      });
    });

    describe('computeEndpointUri', () => {
      const baseUri = 'https://api.com';

      it('returns base URI when no endpoint', () => {
        const server = store.getServers(demoApiModel)[0];
        const result = computeEndpointUri({ server });
        assert.equal(result, 'http://{instance}.domain.com');
      });

      it('adds endpoint\'s path', () => {
        const server = store.getServers(demoApiModel)[0];
        const endpoint = store.getEndpoint(demoApiModel, '/test-parameters/{feature}');
        const result = computeEndpointUri({ server, endpoint });
        assert.equal(result, 'http://{instance}.domain.com/test-parameters/{feature}');
      });

      it('uses the passed base URI', () => {
        const server = store.getServers(demoApiModel)[0];
        const endpoint = store.getEndpoint(demoApiModel, '/test-parameters/{feature}');
        const result = computeEndpointUri({ baseUri, server, endpoint });
        assert.equal(result, `${baseUri}/test-parameters/{feature}`);
      });

      it('uses incomplete server definition', () => {
        const server = store.getServers(petstoreModel)[0];
        const endpoint = store.getEndpoint(petstoreModel, '/pet/findByStatus');
        const result = computeEndpointUri({ server, endpoint });
        assert.equal(result, `/v3/pet/findByStatus`);
      });

      it('uses a complex server definition', () => {
        const server = store.getServers(oas3Model)[3];
        const endpoint = store.getEndpoint(oas3Model, '/pets');
        const result = computeEndpointUri({ server, endpoint });
        assert.equal(result, `https://{username}.gigantic-server.com:{port}/{basePath}/pets`);
      });

    });

    describe('wwwFormUrlEncode()', () => {
      it('returns empty string when no input', () => {
        const result = wwwFormUrlEncode(undefined, false);
        assert.equal(result, '');
      });
  
      it('normalizes spaces to %20', () => {
        const result = wwwFormUrlEncode('test value', false);
        assert.equal(result, 'test%20value');
      });
  
      it('normalizes spaces to + with replacePlus', () => {
        const result = wwwFormUrlEncode('test value', true);
        assert.equal(result, 'test+value');
      });
    });

    describe('applyUrlVariables()', () => {
      it('returns a regexp with the name', () => {
        const result = applyUrlVariables(
          'https://{username}.gigantic-server.com:{port}/{basePath}',
          {
            username: 'uname',
            port: '1234',
            basePath: 'v1'
          },
          false,
        );
        assert.equal(result, 'https://uname.gigantic-server.com:1234/v1');
      });

      it('ignores unknown variables', () => {
        const result = applyUrlVariables(
          'https://{username}.gigantic-server.com:{port}/{basePath}',
          {
            username: 'uname',
            port: '1234',
          },
          false,
        );
        assert.equal(result, 'https://uname.gigantic-server.com:1234/{basePath}');
      });

      it('handles the "+" character in the variable name', () => {
        const result = applyUrlVariables(
          'https://{username}.gigantic-server.com:{port}/{+basePath}',
          {
            username: 'uname',
            port: '1234',
            '+basePath': 'v2'
          },
          false,
        );
        assert.equal(result, 'https://uname.gigantic-server.com:1234/v2');
      });

      it('handles the "#" character in the variable name', () => {
        const result = applyUrlVariables(
          'https://{username}.gigantic-server.com:{port}/{#basePath}',
          {
            username: 'uname',
            port: '1234',
            '#basePath': 'v2'
          },
          false,
        );
        assert.equal(result, 'https://uname.gigantic-server.com:1234/v2');
      });

      it('encodes the parameters', () => {
        const result = applyUrlVariables(
          'https://{username}.gigantic-server.com:{port}/{basePath}',
          {
            username: 'uname',
            port: '1234',
            basePath: '/v1'
          },
          true,
        );
        assert.equal(result, 'https://uname.gigantic-server.com:1234/%2Fv1');
      });
    });

    describe('applyUrlParameters()', () => {
      const baseUri = 'https://api.com';

      it('adds query parameters to the URL', () => {
        const result = applyUrlParameters(baseUri, {
          a: 'b',
          c: 'd',
        }, false);
        assert.equal(result, `${baseUri}?a=b&c=d`);
      });

      it('appends query parameters to the URL', () => {
        const result = applyUrlParameters(`${baseUri}?test=value`, {
          a: 'b',
          c: 'd',
        }, false);
        assert.equal(result, `${baseUri}?test=value&a=b&c=d`);
      });

      it('encodes the parameters', () => {
        const result = applyUrlParameters(`${baseUri}?test=value`, {
          a: 'b c',
          c: 'd',
        }, true);
        assert.equal(result, `${baseUri}?test=value&a=b+c&c=d`);
      });

      it('handles array values', () => {
        const result = applyUrlParameters(baseUri, {
          a: ['b', 'c'],
          c: 'd',
        }, true);
        assert.equal(result, `${baseUri}?a=b&a=c&c=d`);
      });;

      it('handles deep array values', () => {
        const result = applyUrlParameters(baseUri, {
          a: ['b', ['c', 'd']],
          c: 'd',
        }, false);
        assert.equal(result, `${baseUri}?a=b&a=c,d&c=d`);
      });
    });
  });
});
