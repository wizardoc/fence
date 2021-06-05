import { RequestOptions } from "../../../factory";
import { BeginOperator, BeginOperatorContext } from "../operation";
import { RequestOperator } from "./request-operator";

@BeginOperator({
  name: "delete",
})
export class Delete extends RequestOperator {
  sendRequest(
    { httpService }: BeginOperatorContext,
    url: string,
    data: unknown,
    options: Partial<RequestOptions>
  ) {
    return httpService.delete(url, data, options);
  }
}
