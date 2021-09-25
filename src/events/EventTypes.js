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
  }),
});
