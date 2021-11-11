export interface DownloadResponse {
  success: Boolean;
  errors?: string[];
}

export interface BuildResponse {
  success: Boolean;
  build: {
    success: Boolean;
    time: number;
    errors?: string[];
  };
  upload: {
    success: Boolean;
    files: string[];
  };
}

export interface UploadResponse {
  success: Boolean;
  files: string[];
}

export interface WebpackResponse {
  success: Boolean;
  stats: object;
}
