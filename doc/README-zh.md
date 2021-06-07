<div align="center">
  <img width="700px" src="https://github.com/wizardoc/http-request/blob/main/doc/logo-with-text.png" />
</div>

[English](../README.md) | 中文文档

## 什么是 Fence🐟

`Fence` 是一个基于操作符的请求库，它提供了一系列 API 让你更轻松处理作请求流。因为`Fence` 默认基于 Axios，所以`Fence` 在浏览器和服务器中也可以正常工作。

## 特性

- 🌊 **基于操作符** `Fence`整个体系是基于`操作符`的，并且内置了 8 个 操作符。你也可以自定义一些`操作符`来配合内置的`操作符`一起完成数据请求。
- 🍵 **面向对象** 如果你喜欢`面向对象编程`，那么这个库非常适合你，并且我们会在将来支持`Function API`。
- 🚴 **轻量级** 我们没有为用户提供过多的`操作符`，因为用户可以自定义`操作符`，并将它们组合成新的`操作符`。
- 🙅‍♂️ **完善的错误处理体系** 许多开发人员经常忘记或不正确地处理来自请求流的错误，`Fence` 会强制您处理这些错误或显式忽略这些错误。
- ⚙️ **可拆卸** 你可以根据需求来决定要使用那些`操作符`，也可以删除一些没有使用到的`操作符`。
- 🏹️ **灵活性** 你可以结合现有的`操作符`来创造更多的`操作符`。

## 用法

你可以使用`yarn`或者`npm`来安装`Fence`。

```sh
# YARN
yarn add @wizardoc/fence

# NPM
npm i @wizardoc/fence
```

### 简单案例

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
  const http = HTTPFactory.create(AppModule);

  const res = await http.get("/users/youncccat").expect(() => "Network Error");

  console.info(res);
}

main();
```

> 你可以查看更多详细的[案例](https://github.com/wizardoc/http-request/tree/main/example).

## 操作符体系

`Fence`是基于操作符体系设计的，同样操作符体系也是`Fence`的核心。

<img src="https://github.com/wizardoc/http-request/blob/main/doc/request-flow.png" />

如你所见，请求就像一个流，你可以定义一些管道操作符，在数据响应之前终止请求。
例如，我想从 GitHub 获取 `youncccat` 的 `avatar_url`。

```ts
const res = await http
    .get("/users/youncccat")
    .pipe(({data}) => data)
    .pipe({avatar_url: avatar} => avatar)
    .expect(() => "Network Error");
```

`pipe` 的巧妙之处在于可以将逻辑分解成细小的块，这些块是可复用和可测试的，你可以在任何地方使用这些块来帮你完成需求，而无需编写重复的代码。

在操作符体系中，一共包含一下三种`操作符`类型：

- **开始操作符** 像 `get`, `post`, `put` 或类似的
- **管道操作符** 像 `pipe`
- **终止操作符** 想 `unwrap`, `expect`, `match`

### 开始操作符

开始操作符位于整个请求流的开头，你应该调用开始操作符位来启动请求流。

```ts
http.get("/");
```

`get`仅仅是一个开始操作符，它可以向目标服务器发送`GET`请求，你可以在另一个开始操作符之后调用开始操作符，就像下面的代码：

```ts
http.get("/").post("/foo").get("/bar");
```

你也可以混入一些管道操作符

```ts
http
  .get("/")
  .pipe(({ data }) => data.avatar_url)
  .post((avatar) => avatar);
```

这样就优雅的解决了请求嵌套的问题。在上面的例子中，`get` 请求的响应数据是`post` 请求的依赖，所以我们必须等待`get` 请求完成并从响应数据中获取`avatar`，然后发送`post` `请求`。

在 `fetch API` 中，我们也许会这样做：

```ts
fetch("/")
  .then((res) => res.json())
  .then(({ data }) => fetch(data.avatar_url, { method: "POST" }));
```

如果我有五个相互依赖的请求，使用“Fetch API”的情况下，将会导致“回调地狱”：

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

它不太美观并且难以维护 。

> 注意：如果你尝试运行以上的`Fence`示例代码，你会发现请求没有发送出去，原因在于你忘记了在请求流中可能发生的错误，所以请求不会发送出去。 `Fence` 反对任何不处理错误的请求，你必须处理错误的情况，从而帮助您编写一个健壮的应用程序。在本章的其余部分，将介绍终止操作符，它可以在发送真实请求时处理错误。

### 管道操作符

你可以使用管道操作符在终止请求流之前处理数据。 `Fence` 内置了 `pipe` 的管道操作符。

```ts
http.get("/foo").pipe(data => /** Do whatever you wanna do */).unwrap()
```

> 注意：当请求发生错误时，`pipe` 操作符不会被调用。

### 终止操作符

通常情况下终止操作符包含错误处理逻辑 ，发送请求中只需在调用链上使用一个终止操作符。

```ts
http.get().post().pipe().unwrap();
```

如果你忘记使用终止操作符，这个请求将不会被发送出去。这是有意而为之的，你必须为每个请求处理错误来确保程序的健壮性。

`Fence` 内置了三个终止操作符，我们将在接下来的章节中介绍。

### 自定义操作符

除了可以使用内置操作符，还可以通过`Fence operator API`来自定义操作符。

例如，你想在外部上下文中知道请求发送是否成功。

```ts
const res = http.get("/foo").unwrap();

// Do something if no error occurred on the request.
// but now I can't know any information of this request in outside,
// though I just wanna know this request is success or not
// ...
```

请求发生错误时不会调用管道操作符，所以无法使用管道操作符来处理这种情况，我们可以自定义一个操作符来处理这个情况。

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

然后在我们的应用程序中注册这个操作符。

```ts
@HTTPModule({
  server: ServerConfigInfo,
  operators: [WithOk], // <---- register the withOk operator
  interceptors: [],
})
export class AppHttpModule {}
```

现在让我们发送一个请求，并在请求成功发送时在外面做一些事情。

```ts
const { ok } = http.get("/foo").withOk().unwrap();

if (ok) {
  // do something
}
```

你也可以定义很多有趣的操作符来解决你的问题。

## 模板

使用`Fence`，你需要定义一个包含错误处理和配置项的根模块，例如：

```ts
@HTTPModule({
  server: ServerConfigInfo,
  operators: [],
  interceptors: [],
})
export class AppHttpModule {}
```

### 服务器配置

`ServerConfigInfo` 是后端服务器的配置：

```ts
export interface ServerConfigInfo {
  baseUrl: string;
  protocol: string;
  port?: number;
  prefix?: string;
}
```

在 fence 中`ServerConfigInfo` 被解析为`[protocol]://[baseUrl]:[port][prefix]`

## 拦截器

因为`Fence`是基于 Axios，所以拦截器的原理与`Axios Interceptor`类似，但与 Axios 有所不同。

**响应拦截器**

```ts
import { HTTPResponseInterceptor, AxiosResponse } from "@wizardoc/fence";

export class Bar implements HTTPResponseInterceptor {
  onResponse(res: AxiosResponse): AxiosResponse | Promise<AxiosResponse> {
    /** intercept logic */
  }
}
```

**请求拦截器**

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

你应该在根模块中注册你的拦截器：

```ts
@HTTPModule({
  server: ServerConfigInfo,
  interceptors: [Foo, Bar] /** Register interceptor here */,
})
export class AppHttpModule {}
```

现在一切工作正常:)

### 例子

让我们定义一个记录拦截器在发送请求时打印请求 url。

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

**输出**

```sh
request ===>  https://api.github.com/users/youncccat
```

## 错误处理

错误处理是请求中至关重要的，如果您忘记处理错误，你的应用程序中则可能发生意外的错误。但是如果你编写全局的请求错误处理逻辑，它就失去了灵活性。当然你可以在终止操作符中定义自己的错误处理逻辑，我们也提供了三种处理错误的方式。

### 0x1 全局错误处理

在处理请求流中的一些异常时，我们通常需要一个`global space`来处理来自每个请求的错误，为此我们提供了`expect`的终止操作符，它接收一个类似` () => string`的回调函数，函数的返回值是提供给`global space`的错误消息。

```
http.get('/foo').expect(() => 'Cannot visit foo')

http.get('/bar').expect(() => 'Cannot visit bar')

http.post('/user').expect(() => 'Cannot create the user')
```

`errorInteract` 就是我们上面讨论的`global space`，你可以在 `errorInteract` 函数中得到这些错误信息。

为了定义`global space`，你必须让`AppHttpModule`实现`ErrorInteractModule`接口，并实现`errorInteract`功能，参考如下：

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

> 注意：如果您不熟悉 `Expect` 运算符，没关系，我们很快就会介绍它。

如果 `http.get('/foo').expect(() => 'Cannot visit foo')` 失败，页面会提示 `Cannot visit foo`，但这没有意义，因为请求错误的类型很多，如果没有匹配的错误类型，则会默认返回“错误信息”。

所以我们会处理：

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

你也许注意到了，不必在 `Expect` 的回调中使用 ui 相关的函数（如 `toast`、`alert`、`modal` 等），我们应该对 ui 相关的代码和描述错误代码进行了解耦，`Expect`的回调只负责返回错误信息，`errorInteract`中定义这些错误信息如何在页面中展示。

### 0x2 不处理错误

有些情况你不想处理这些错误，你想使用`throw`将错误抛出，在外层捕获它们并做错误处理的逻辑。这时你可以使用`unwrap`终止操作符，它不会对错误做任何操作，只是将其当做原始 Axios 错误抛出。

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

### 0x3 单独处理错误

虽然 `unwrap` 终止操作符也可以单独处理错误，但是你必须编写烦人的 `try-catch` ，并且错误会抛出到外层，也许你只是想在当前层处理它，你可以使用 ` match` 终止运算符：

```ts
type Match = ((data: unknown) => unknown, (err: AxiosError) => unknown)) => Promise<unknown>
```

`match` 接受`successful callback` 和`failure callback` 两个回调，如果请求成功，则会执行`successful callback`，反之会执行`failure callback`。

```ts
const res = http.get("/foo").match(
    data => data,
    err => /** handing error logic */;
)
```

如果你了解 Rust 编程，你应该也熟悉 `match` :)

## 更多案例

你可以访问[这里](https://github.com/wizardoc/http-request/tree/main/example)了解更多细节。

## License

MIT.
