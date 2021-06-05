import {
  TerminalOperator,
  TerminalOperatorContext,
  TerminalOperatorExec,
} from "../operation";

@TerminalOperator({ name: "unwrap" })
export class Unwrap implements TerminalOperatorExec {
  exec({ err }: TerminalOperatorContext): void {
    if (err) {
      // rethrow the error that occur when send request
      throw err;
    }
  }
}
