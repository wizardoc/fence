import "reflect-metadata";
import { getErrorInteractFromModule, Interceptor } from "../core";
import { HTTPModuleMetadata, HTTP_MODULE_METADATA_KEY } from "../module";
import { HTTPService } from "./http-service";
import Axios from "axios";
import { OperatorResponse, OperatorService, ServerConfig } from "../services";
import { BrowserClient } from "../clients";

const NOT_A_MODULE_ERROR_MESSAGE =
  "HTTP Factory cannot create a service base on the module, please make sure the params has been decorated by @HTTPModule.";

export class HTTPFactory {
  static create(Module: any): OperatorResponse {
    const moduleMetadata: HTTPModuleMetadata = Reflect.getMetadata(
      HTTP_MODULE_METADATA_KEY,
      Module
    );

    // Check the params whether is module or not
    if (!moduleMetadata) {
      throw new Error(NOT_A_MODULE_ERROR_MESSAGE);
    }

    // Can Inject some context info into module here
    const module = new Module();

    const interceptor = new Interceptor(Axios);
    const errorInteract = getErrorInteractFromModule(module);
    const serverConfig = new ServerConfig(moduleMetadata.server);

    // Set interceptors on raw axios
    interceptor.use(moduleMetadata.interceptors ?? []);

    const client = new BrowserClient({
      addr: serverConfig.getAbsPath(),
      axios: Axios,
      catcher: errorInteract,
      operators: moduleMetadata.operators ?? [],
    });

    const operatorService = new OperatorService(moduleMetadata.operators);
    const httpService = new HTTPService(client);

    // Return a new operatorSet when call http every time
    return new Proxy(
      {},
      {
        get: (_: any, key: string) =>
          operatorService.parseOperators(errorInteract, httpService)[key],
      }
    ) as unknown as OperatorResponse;
  }
}
