interface Security {
  settingsChanged: string;
}
interface Request {
  apiRequest: string;
  apiRequestLegacy: string;
  abortApiRequest: string;
  abortApiRequestLegacy: string;
  apiResponse: string;
  apiResponseLegacy: string;
}

interface IEventTypes {
  Security: Readonly<Security>;
  Request: Readonly<Request>;
}

export const EventTypes: Readonly<IEventTypes>;
