import { HTTPMethod, Response, HttpType, HTTPClient } from "../clients";
import { RequestHook } from "../module";
import { OperatorResponse } from "../services";

export interface PostPayload<T = unknown> {
  [index: string]: T;
}

export interface RequestOptions {
  headers?: any;
  useHooks: boolean;
}

export type PartialRequestOptions = Partial<RequestOptions>;

export class HTTPService {
  constructor(private client: HTTPClient) {}

  get<T = {}>(path: string, data?: T, options?: PartialRequestOptions) {
    return this.simpleRequest("GET", path, data, options);
  }

  post<T = {}>(path: string, data?: T, options?: PartialRequestOptions) {
    return this.complexRequest("POST", path, data, options);
  }

  put<T = {}>(path: string, data?: T, options?: PartialRequestOptions) {
    return this.complexRequest("PUT", path, data, options);
  }

  delete<T = {}>(path: string, data?: T, options?: PartialRequestOptions) {
    return this.complexRequest("DELETE", path, data, options);
  }

  // Common request function that is wrapper of all request function, in other words
  // it can do anything before send real request or intercept response
  private request<R = any, T = {}>(
    type: HttpType,
    method: HTTPMethod,
    path: string,
    data?: T,
    options?: PartialRequestOptions
  ): OperatorResponse {
    return this.client
      .create<T, R>(type, {
        method,
        path,
        data,
        headers: options?.headers ?? {},
      })
      .Do();
  }

  private complexRequest<T = {}>(
    method: HTTPMethod,
    path: string,
    data?: T,
    options?: PartialRequestOptions
  ) {
    return this.request("ComplexHTTPMethod", method, path, data, options);
  }

  private simpleRequest<T = {}>(
    method: HTTPMethod,
    path: string,
    data?: T,
    options?: PartialRequestOptions
  ) {
    return this.request("SimpleHTTPMethod", method, path, data, options);
  }
}
