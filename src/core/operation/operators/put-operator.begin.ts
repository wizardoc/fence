import { RequestOptions } from "../../../factory";
import { BeginOperator, BeginOperatorContext } from "../operation";
import { RequestOperator } from "./request-operator";

@BeginOperator({
  name: "put",
})
export class Put extends RequestOperator {
  sendRequest(
    { httpService }: BeginOperatorContext,
    url: string,
    data: unknown,
    options: Partial<RequestOptions>
  ) {
    return httpService.put(url, data, options);
  }
}
