import { Constructable, HTTPInterceptors } from "../core";
import "reflect-metadata";
import { ServerConfigInfo } from "../services";

export const HTTP_MODULE_METADATA_KEY = Symbol("HTTP_MODULE_METADATA_KEY");

export interface HTTPModuleMetadata {
  interceptors?: Constructable<HTTPInterceptors>[];
  server: ServerConfigInfo;
}

export const HTTPModule = (config: HTTPModuleMetadata) => (target: any) =>
  Reflect.defineMetadata(HTTP_MODULE_METADATA_KEY, config, target);
