import { OperatorCallback, PipeOperator, PipeOperatorExec } from "../operation";

@PipeOperator({
  name: "pipe",
})
export class Pipe implements PipeOperatorExec {
  exec({ value }, cb: OperatorCallback): unknown {
    return cb(value);
  }
}
