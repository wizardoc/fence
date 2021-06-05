import {
  OperatorRunEnv,
  PipeOperator,
  PipeOperatorContext,
  PipeOperatorExec,
} from "../../../../../dist";

export type WithOkRes<T> = {
  ok: boolean;
} & T;

@PipeOperator({
  name: "withOk",
  env: OperatorRunEnv.ERROR_OCCUR,
})
export class WithOk implements PipeOperatorExec {
  exec({
    value,
    err,
  }: PipeOperatorContext<Record<string, unknown>>): WithOkRes<
    Record<string, unknown>
  > {
    return {
      ...(value ?? {}),
      ok: !err,
    };
  }
}
