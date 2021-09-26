import generator from '@api-components/api-model-generator';

/** @typedef {import('@api-components/api-model-generator/types').ApiConfiguration} ApiConfiguration */

/** @type {Map<string, ApiConfiguration>} */
const config = new Map();
config.set('demo-api/demo-api.raml', { type: "RAML 1.0" });
config.set('array-body/array-body.raml', { type: "RAML 1.0" });
config.set('google-drive-api/google-drive-api.raml', { type: "RAML 1.0" });
config.set('appian-api/appian-api.raml', { type: "RAML 1.0" });
config.set('httpbin/httpbin.json', { type: "OAS 2.0", mime: 'application/json' });
config.set('SE-12042/SE-12042.raml', { type: "RAML 1.0" });
config.set('SE-12224/SE-12224.raml', { type: "RAML 1.0" });
config.set('APIC-168/APIC-168.raml', { type: "RAML 1.0" });
config.set('APIC-289/APIC-289.yaml', { type: "OAS 2.0", mime: 'application/yaml' });
config.set('api-keys/api-keys.yaml', { type: "OAS 3.0", mime: 'application/yaml' });
config.set('oauth-flows/oauth-flows.yaml', { type: "OAS 3.0", mime: 'application/yaml' });
config.set('oas-bearer/oas-bearer.yaml', { type: "OAS 3.0", mime: 'application/yaml' });
config.set('oas-demo/oas-demo.yaml', { type: "OAS 3.0", mime: 'application/yaml' });
config.set('multi-server/multi-server.yaml', { type: "OAS 3.0", mime: 'application/yaml' });
config.set('loan-ms/loan-microservice.json', { type: "OAS 2.0", mime: 'application/json' });
config.set('async-api/async-api.yaml', { type: "ASYNC 2.0" });
config.set('annotated-parameters/annotated-parameters.raml', { type: "RAML 1.0" });
config.set('secured-unions/secured-unions.yaml', { type: "OAS 3.0" });
config.set('secured-api/secured-api.raml', { type: "RAML 1.0" });
config.set('oas-3-api/oas-3-api.yaml', { type: "OAS 3.0" });
config.set('streetlights/streetlights.yaml', { type: "ASYNC 2.0" });
config.set('modular-api/modular-api.raml', { type: "RAML 1.0" });
config.set('oauth-pkce/oauth-pkce.raml', { type: "RAML 1.0" });
config.set('petstore/petstore.yaml', { type: "OAS 3.0" });
config.set('21143/21143.json', { type: "OAS 2.0" });
config.set('APIC-298/APIC-298.json', { type: 'OAS 2.0', mime: 'application/json' });
config.set('APIC-289/APIC-289.yaml', { type: 'OAS 2.0', mime: 'application/yaml' });
config.set('APIC-689/APIC-689.raml', { type: 'RAML 1.0' });

generator.generate(config);
