<div align="center">
  <img width="700px" src="https://github.com/wizardoc/http-request/blob/main/doc/logo-with-text.png" />
</div>

English | [中文文档](doc/README-zh.md)

## What's Fence🐟

Fence is an operator-based request library that provide a serises of APIs to help you more easily manipulate the request flow. And the `Fence` is works fine in browsers and server as well, cause `Fence` is based on Axios by default.

## Feature

- 🌊 **Operator-based** The `Fence` whole system is operator-based, the means that you can define a lot of `operator` to do something with request data in the request flow, and there are 8 build-in operator, you can working fine with these operators.
- 🍵 **Object-oriented** If you like `Object-Oriented Programing`, this library is perfect for you, we will cover `Function API` in the future.
- 🚴 **lightweight** We have not provide a lot of `operator` for users, cause users can define them own operator and combine them into new operator.
- 🙅‍♂️ **Perfect error handing system** Many developers often forget or incorrectly handing error which come from the request flow, `Fence` will force you to handing these errors or ignore these error by explicit, it can help developers understanding what they are doing rather than forget handing these errors.
- ⚙️ **Removable** That is you can use the operator that you wanna use, the same you can remove the operator that you don't wanna use.
- 🏹️ **Flexible** You can combine existing operators to create more possibilities.

## Usage

You can install `Fence` with NPM and YARN as well.

```sh
# YARN
yarn add @wizardoc/fence

# NPM
npm i @wizardoc/fence
```

### Simple example

```ts
import {
  HTTPModule,
  HTTPFactory,
  AxiosError,
  ErrorInteractModule,
  ErrorMessage,
} from "@wizardoc/fence";

@HTTPModule({
  server: {
    baseUrl: "api.github.com",
    protocol: "https",
  },
})
export class AppHttpModule implements ErrorInteractModule {
  errorInteract(errMsg: ErrorMessage, err: AxiosError): void {
    alert(errMsg);
  }
}

export async function main() {
  const http = HTTPFactory.create(AppHttpModule);
  const res = await http.get("/users/youncccat").expect(() => "Network Error");

  console.info(res);
}

main();
```

> You can see [Example](https://github.com/wizardoc/http-request/tree/main/example) for more detail.

## Operator system

The Operator system are the CORE of the `Fence`, in other word the `Fence` is designed to be based on operator system.

<img src="https://github.com/wizardoc/http-request/blob/main/doc/request-flow.png" />

As you can see the request is just like a flow, and you can define a lot of pipe-operator to manipulate the response data before terminated the request flow. For instance, I wanna get `avatar_url` of `youncccat` from GitHub.

```ts
const res = await http
    .get("/users/youncccat")
    .pipe(({data}) => data)
    .pipe({avatar_url: avatar} => avatar)
    .expect(() => "Network Error");
```

The beauty of the `pipe` is that can break the logics down into a smaller chunks, and these chunks is reusable and testable, you can use these chunks every where to help u complete whatever target you want to do without write duplicated code.

In the operator system, there are three operator type as you can used:

- **Begin-operator** like `get`, `post`, `put` or something like that
- **Pipe-operator** like `pipe`
- **Terminal-operator** like `unwrap`, `expect`, `match`

### Begin operator

The begin-operator is located beginning of the entire request flow, that means you should invoke a begin-operator to start a request flow.

```ts
http.get("/");
```

The `get` just is a begin-operator, that can send `GET` request to the target server, but more interested things is you can also invoke a begin-operator after the another begin-operator, for instance you can invoked like the following code:

```ts
http.get("/").post("/foo").get("/bar");
```

And you can also mixin some pipe-operator

```ts
http
  .get("/")
  .pipe(({ data }) => data.avatar_url)
  .post((avatar) => avatar);
```

This gracefully solve the problem of request nesting. In above example, the response data of the `get` request is the dependencies of the `post` request, so we have to wait for the `get` request to complete and get `avatar` from the response data before send the `post` request, cause the `post` request need the `avatar` as the url of the request.

In the `fetch API`, maybe we can do this with:

```ts
fetch("/")
  .then((res) => res.json())
  .then(({ data }) => fetch(data.avatar_url, { method: "POST" }));
```

As you can see, this workaround will leads `callback hell`, for example, if I have five requests that interdependent, using `Fetch API` :

```ts
fetch("/")
    .then(res => res.json())
    .then(({data}) =>
        fetch(data.avatar_url, {method: 'POST'})
            .then(res => res.json())
            .then(({data}) =>
                fetch(data.avatar_url, {method: 'POST'})
                    .then(res => res.json())
                    .then(({data}) =>
                        fetch(data.avatar_url, {method: 'POST'})
                            .then(res => res.json())
                            .then(({data}) =>
                                fetch(data.avatar_url, {method: 'POST'})
                                    .then(res => res.json())
                                    .then(() => /** ... */)

```

It's looks ugly and difficult to maintain.

> Notice: if you have try to run the above `Fence` example code, you will found the request does not send out, A simple reason is that you forget handing errors that probably occur from the request flow, so the real request will not send out. `Fence` will against any request that does not handing errors, it can help you to make a robust application, force you to handing errors. In the rest of the chapter, you will learned terminal-operator, that can handing error when sending the real request out.

### Pipe operator

Also you can invoke pipe-operator before terminated the request flow to process data. And the `Fence` contain a build-in pipe-operator named `pipe`.

```ts
http.get("/foo").pipe(data => /** Do whatever you wanna do */).unwrap()
```

> Notice: the `pipe` operator will not invoked when the request occurred errors.

### Terminal operator

Terminal-operator usually contain error-handing logic, so in order to send a request, you have to invoke only one terminal-operator on invoke chain.

```ts
http.get().post().pipe().unwrap();
```

If you forget to write terminal-operator, this request will not be send out, this design is by intent, cause you have to handing errors for every request to make your application robust more.

The `Fence` have three build-in terminal-operator, we will cover in following chapters.

### Define your own operator

Excepts that you can use the build-in operators, you can also define your own operator by `Fence operator API`.

For instance, you wanna know the request is sending successful or not in outside context.

```ts
const res = http.get("/foo").unwrap();

// Do something if no error occurred on the request.
// but now I can't know any information of this request in outside,
// though I just wanna know this request is success or not
// ...
```

Though I can't invoke a pipe-operator to process this condition, cause the `pipe` operator will not invoked when the request occurred errors. So we can define a own operator to process this condition.

```ts
import {
  OperatorRunEnv,
  PipeOperator,
  PipeOperatorContext,
  PipeOperatorExec,
} from "@wizardoc/fence";

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
```

And then we should register this operator in our application.

```ts
@HTTPModule({
  server: ServerConfigInfo,
  operators: [WithOk], // <---- register the withOk operator
  interceptors: [],
})
export class AppHttpModule {}
```

Now let's send a request and do something in outside when the request is success to send out.

```ts
const { ok } = http.get("/foo").withOk().unwrap();

if (ok) {
  // do something
}
```

Also you can define a lot of interesting operator to resolve your problem, let's happy hacking!

## Module

In order to use `Fence`, you need to define a root module that contain error handing function and some configure, it looks like:

```ts
@HTTPModule({
  server: ServerConfigInfo,
  operators: [],
  interceptors: [],
})
export class AppHttpModule {}
```

### Server config

The `ServerConfigInfo` is the configure of the endpoint of the backend server:

```ts
export interface ServerConfigInfo {
  baseUrl: string;
  protocol: string;
  port?: number;
  prefix?: string;
}
```

The `ServerConfigInfo` is resolved as `[protocol]://[baseUrl]:[port][prefix]` in fence

## Interceptors

The principle of interceptors in `Fence` is similar with `Axios Interceptor`, cause the `Fence` is based-on Axios, but difference with Axios.

**Response interceptor**

```ts
import { HTTPResponseInterceptor, AxiosResponse } from "@wizardoc/fence";

export class Bar implements HTTPResponseInterceptor {
  onResponse(res: AxiosResponse): AxiosResponse | Promise<AxiosResponse> {
    /** intercept logic */
  }
}
```

**Request interceptor**

```ts
import { HTTPRequestInterceptor, AxiosRequestConfig } from "@wizardoc/fence";

export class Foo implements HTTPRequestInterceptor {
  onRequest(
    config: AxiosRequestConfig
  ): AxiosRequestConfig | Promise<AxiosRequestConfig> {
    /** intercept logic */
  }
}
```

And then you should register your interceptors in the root module:

```ts
@HTTPModule({
  server: ServerConfigInfo,
  interceptors: [Foo, Bar] /** Register interceptor here */,
})
export class AppHttpModule {}
```

Now everything is working fine :)

### Example

Let's define a logger interceptor to print request url when send request.

```ts
import {
  HTTPRequestInterceptor,
  AxiosRequestConfig,
  HTTPFactory,
} from "@wizardoc/fence";

export class Logger implements HTTPRequestInterceptor {
  onRequest(
    config: AxiosRequestConfig
  ): AxiosRequestConfig | Promise<AxiosRequestConfig> {
    console.info("request ===> ", config.url);

    return config;
  }
}

@HTTPModule({
  server: {
    baseUrl: "api.github.com",
    protocol: "https",
  },
  interceptors: [Logger] /** Register interceptor here */,
})
export class AppHttpModule {}

// Main
const http = HTTPFactory.create(AppModule);

// Fetch user info
http.get("/users/youncccat").unwrap();
```

**output**

```sh
request ===>  https://api.github.com/users/youncccat
```

## Error handing

Error handing is a important things in request, if you forget handing errors, it could occur unexpect error in your application. But if you write all error handing logic in same place to make a global error handler, it dose not flexible, maybe you wanna process some error by separately. So we introduce the three ways to handle errors, of course you can defined your own error handler in terminal operator.

### 0x1 Global error handing

We often handle some exceptions in the request flow, also we need a "global space" to handing the error that come from every request, so we need to use a terminal-operator named `expect`, that receive a callback that's sign like `() => string`, the return value of the callback is a error message which you wanna provide to the "global space".

```
http.get('/foo').expect(() => 'Cannot visit foo')

http.get('/bar').expect(() => 'Cannot visit bar')

http.post('/user').expect(() => 'Cannot create the user')
```

And then you can get these error message in `errorInteract` function, as you can see that the `errorInteract` just is "global space" that we talk about in above.

In order to define the "global space", you have to make the `AppHttpModule` implements `ErrorInteractModule` interface, and implements the `errorInteract` function, refer the following code snap:

```ts
@HTTPModule({
  server: {
    baseUrl: "api.github.com",
    protocol: "https",
  },
})
export class AppHttpModule implements ErrorInteractModule {
  // The errorInteract will be invoked when the request was fail
  errorInteract(errMsg: ErrorMessage, err: AxiosError): void {
    // The errMsg is the return value of the Expect's callback
    alert(errMsg);
  }
}
```

> Notice: if you are not familiar about the `Expect` operator, it's ok we will cover `operator` soon.

That means if the `http.get('/foo').expect(() => 'Cannot visit foo')` was fail, the page will alert `Cannot visit foo`, but it doesn't make sense, cause there have a lot of type of the error, so actually the "error message" is just like if there have no error types is matched, then return the "error message".

So maybe we will write codes that something like this:

```ts
@HTTPModule({
  server: {
    baseUrl: "api.github.com",
    protocol: "https",
  },
})
export class AppHttpModule implements ErrorInteractModule {
  errorInteract(finalErrMsg: ErrorMessage, err: AxiosError): void {
    // The errMsg which is come from backend, but if the errMsg is undefined that means
    // we can't access the server of backend, so we can use the finalErrMsg that come
    // from the return value of the Expect's callback
    const errMsg = err.response?.data.err?.message;

    // You can use another function to show the error message to the page
    alert(errMsg ?? finalErrMsg);
  }
}
```

And maybe you notice that we don't have to use ui-related function(like `toast`, `alert`, `modal` etc.) in the `Expect`'s callback, cause we wanna separate ui-related code and describe error code, so the `Expect`'s callback just return error message without describe how to show the error message is the page, and we can define these code in `errorInteract` to interact with ui(page).

### 0x2 Do nothing with handling errors

Sometimes you don't wanna handing these errors, you just wanna throw them to outer layer just like `throw`, and write down the logic of handing error in outer layer and catch them, so you can use the `unwrap` terminal-operator that does not do anything extra with handing errors, but just throw it as a raw Axios error.

```ts
const getFoo = () => http.get("/foo").unwrap();

const bar = async () => {
  try {
    await getFoo();
  } catch (e) {
    console.error("Catch error: ", e);
  }
};

async function main() {
  bar();
}

main();
```

### 0x3 Handing errors by separately

Though the `unwrap` terminal-operator also can handing errors separately, but you have to write annoying `try-catch` block, and the error will throw to outer layer, maybe u just wanna process it in current layer, you can use `match` terminal-operator, the sign of `match` just like this:

```ts
type Match = ((data: unknown) => unknown, (err: AxiosError) => unknown)) => Promise<unknown>
```

The `match` function receive two callback named `successful callback` and `failure callback`, if the request is successful, the `successful callback` will be invoked, conversely the `failure callback` will be invoked.

```ts
const res = http.get("/foo").match(
    data => data,
    err => /** handing error logic */;
)
```

If you familiar Rust programming, you should also familiar to the `match` :)

## Examples

We have write some examples in [Examples](https://github.com/wizardoc/http-request/tree/main/example), you can access the link for more detail.

## License

MIT.
