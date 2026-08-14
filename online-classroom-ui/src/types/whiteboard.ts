export interface WhiteboardStateResponse {
  elements: any[];
  appState: Record<string, any>;
  files: Record<string, any>;
  version: number;
}

export interface SaveWhiteboardStateRequest {
  elements: any[];
  appState?: Record<string, any>;
  files?: Record<string, any>;
}
