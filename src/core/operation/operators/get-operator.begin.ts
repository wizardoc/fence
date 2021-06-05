import { RequestOptions } from "../../../factory";
import { BeginOperator, BeginOperatorContext } from "../operation";
import { RequestOperator } from "./request-operator";

@BeginOperator({
  name: "get",
})
export class Get extends RequestOperator {
  sendRequest(
    { httpService }: BeginOperatorContext,
    url: string,
    data: unknown,
    options: Partial<RequestOptions>
  ) {
    return httpService.get(url, data, options);
  }
}
