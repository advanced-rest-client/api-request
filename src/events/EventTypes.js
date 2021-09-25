export const EventTypes = Object.freeze({
  Security: Object.freeze({
    settingsChanged: 'securitysettingsinfochanged',
  }),
  Request: Object.freeze({
    apiRequest: 'apirequest',
    apiRequestLegacy: 'api-request',
    abortApiRequest: 'apiabort',
    abortApiRequestLegacy: 'abort-api-request',
    apiResponse: 'apiresponse',
    apiResponseLegacy: 'api-response',
    redirectUriChange: 'oauth2redirecturichange',
    redirectUriChangeLegacy: 'oauth2-redirect-uri-changed',
    populateAnnotatedFields: 'populateannotatedfields',
    populateAnnotatedFieldsLegacy: 'populate_annotated_fields',
  }),
});
