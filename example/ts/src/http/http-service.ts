import {
  HTTPModule,
  HTTPFactory,
  AxiosError,
  ErrorInteractModule,
  ErrorMessage,
} from "../../../..";
import ServerConfig from "../configs/sever-config.json";
import { RequestLogger } from "./interceptors/request-logger.interceptor";
import { WithOk } from "./operators/ok-operator.pipe";

@HTTPModule({
  server: ServerConfig,
  operators: [WithOk],
  interceptors: [RequestLogger],
})
export class AppModule implements ErrorInteractModule {
  errorInteract(errMsg: ErrorMessage, err: AxiosError): void {}
}

export async function main() {
  const http = HTTPFactory.create(AppModule);

  // const { avatar, ok } = await http
  // .get("/users/youncccat")
  // .pipe(({ data }) => data.avatar_url)
  // .pipe((avatar) => ({ avatar }))
  // .withOk()
  // .expect(() => "Network Error");

  const res = await http
    .get("/urs/youncccat")
    .post("/")
    .expect(() => "");

  console.info(res);
}

main();
