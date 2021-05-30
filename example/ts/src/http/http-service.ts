import {
  HTTPModule,
  HTTPFactory,
  RequestHook,
  ErrorInteractModule,
  AxiosError,
  ErrorMessage,
} from "../../../..";
import ServerConfig from "../configs/sever-config.json";
import { RequestLogger } from "./interceptors/request-logger.interceptor";

@HTTPModule({
  server: ServerConfig,
  interceptors: [RequestLogger],
})
export class AppModule implements RequestHook, ErrorInteractModule {
  errorInteract(errMsg: ErrorMessage, err: AxiosError): void {
    console.info(errMsg);
  }

  beforeRequest() {
    console.info("before request");
  }

  afterResponse() {
    console.info("after response");
  }
}

const http = HTTPFactory.create(AppModule);

(async () => {
  const res = await http
    .get("/users/youncccat")
    .pipe((v) => v)
    .match(
      (data: unknown) => data,
      (err: AxiosError) => console.info(err.message)
    );

  console.info(res);
})();
