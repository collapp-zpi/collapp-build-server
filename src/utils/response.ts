export class ResponseSingleton {
  private static instance: ResponseSingleton;
  private static response: Response = {
    success: false,
    build: {
      success: false,
      time: 0,
      errors: [],
    },
    upload: {
      success: false,
      files: [],
    },
  };

  private constructor() {}

  public static getInstance(): ResponseSingleton {
    if (!ResponseSingleton.instance) {
      ResponseSingleton.instance = new ResponseSingleton();
    }
    return ResponseSingleton.instance;
  }

  public addBuildError(err: string) {
    ResponseSingleton.response.build.errors.push(err);
  }

  public addUploadFile(file: string) {
    ResponseSingleton.response.upload.files.push(file);
  }

  public success(success: Boolean) {
    ResponseSingleton.response.success = success;
  }

  public setBuildTime(time: number) {
    ResponseSingleton.response.build.time = time;
  }

  public buildSuccess(success: Boolean) {
    ResponseSingleton.response.build.success = success;
  }

  public uploadSuccess(success: Boolean) {
    ResponseSingleton.response.upload.success = success;
  }

  public response(): Response {
    ResponseSingleton.response.success =
      ResponseSingleton.response.build.success &&
      ResponseSingleton.response.upload.success;
    return ResponseSingleton.response;
  }

  public reset() {
    ResponseSingleton.response = {
      success: false,
      build: {
        success: false,
        time: 0,
        errors: [],
      },
      upload: {
        success: false,
        files: [],
      },
    };
  }
}

export interface Response {
  success: Boolean;
  build: {
    success: Boolean;
    time?: number;
    errors?: string[];
  };
  upload: {
    success: Boolean;
    files: string[];
  };
}
