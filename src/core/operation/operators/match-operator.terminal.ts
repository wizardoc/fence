import { AxiosError } from "axios";
import {
  OperatorCallback,
  TerminalOperator,
  TerminalOperatorContext,
  TerminalOperatorExec,
} from "../operation";

@TerminalOperator({ name: "match" })
export class Match implements TerminalOperatorExec {
  exec(
    { value, err }: TerminalOperatorContext,
    successfulCallback: (data: unknown) => unknown,
    errorCallback: (err: AxiosError) => unknown
  ): unknown {
    if (err) {
      return errorCallback(err);
    }

    return successfulCallback(value);
  }
}
