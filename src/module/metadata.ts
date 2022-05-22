import { HTTPInterceptors } from "../core";
import "reflect-metadata";
import { ServerConfigInfo } from "../services";
import { RawOperator } from "../core/operation";
import { Constructable } from "../typings/construct";

export const HTTP_MODULE_METADATA_KEY = Symbol("HTTP_MODULE_METADATA_KEY");

export interface HTTPModuleMetadata {
  interceptors?: Constructable<HTTPInterceptors>[];
  operators?: RawOperator[];
  server: ServerConfigInfo;
}

export const HTTPModule = (config: HTTPModuleMetadata) => (target: any) =>
  Reflect.defineMetadata(HTTP_MODULE_METADATA_KEY, config, target);
