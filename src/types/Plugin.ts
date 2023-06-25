export interface PluginRequest {
  requestId: string;
  name: string;
  developer: {
    name: string;
    email: string;
  };
  path: string;
}
