import {
  OperatorCallback,
  TerminalOperator,
  TerminalOperatorContext,
  TerminalOperatorExec,
} from "../operation";

@TerminalOperator({ name: "expect" })
export class Expect implements TerminalOperatorExec {
  exec(
    { catcher, value, err }: TerminalOperatorContext,
    cb: OperatorCallback
  ): void {
    catcher(cb(value) as string, err);
  }
}
