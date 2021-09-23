interface Security {
  settingsChanged: string;
}

interface IEventTypes {
  Security: Readonly<Security>;
}

export const EventTypes: Readonly<IEventTypes>;
