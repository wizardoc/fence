import { RequestOptions } from "../../../factory";
import { BeginOperator, BeginOperatorContext } from "../operation";
import { RequestOperator } from "./request-operator";

@BeginOperator({
  name: "post",
})
export class Post extends RequestOperator {
  sendRequest(
    { httpService }: BeginOperatorContext,
    url: string,
    data: unknown,
    options: Partial<RequestOptions>
  ) {
    return httpService.post(url, data, options);
  }
}
