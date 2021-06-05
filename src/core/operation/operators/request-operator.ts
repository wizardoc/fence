import { PartialRequestOptions } from "../../../factory";
import { OperatorResponse } from "../../../services";
import { BeginOperatorContext, BeginOperatorExec } from "../operation";

const maybeFn = <T>(target: unknown, value: unknown): T =>
  typeof target === "function" ? target(value) : target;

export abstract class RequestOperator implements BeginOperatorExec {
  exec(
    context: BeginOperatorContext,
    url: string | ((value: unknown) => string),
    data?: unknown | ((value: unknown) => unknown),
    options?: PartialRequestOptions
  ): unknown {
    const { value } = context;
    return this.sendRequest(
      context,
      maybeFn(url, value),
      maybeFn(data, value),
      options
    );
  }

  abstract sendRequest(
    context: BeginOperatorContext,
    url: string,
    data: unknown,
    options: PartialRequestOptions
  ): OperatorResponse;
}
