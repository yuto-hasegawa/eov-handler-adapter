import path from "node:path";
import yaml from "js-yaml";
import fs from "node:fs";
import { OpenAPIV3 } from "express-openapi-validator/dist/framework/types.js";
import { ParamsRetriever } from "../../src/ParamsRetriever.js";
import { typeScriptNodeGenCoordinator } from "../../src/index.js";
import { EOVRequestTester } from "../../src/EOVRequestTester.js";
import { OpenApiRequest } from "../../src/types.js";
import { describe, expect, it } from "vitest";
import supertest from "supertest";
import { DefaultApi } from "./api/defaultApi.js";

const SPEC_PATH = path.join(__dirname, "./openapi.yaml");
const SPEC = yaml.load(
  fs.readFileSync(SPEC_PATH, "utf-8")
) as OpenAPIV3.Document;

const paramsRetriever = new ParamsRetriever(
  SPEC,
  typeScriptNodeGenCoordinator({ paramNaming: "original" })
);
const tester = new EOVRequestTester(SPEC_PATH, async (req) => {
  const params = paramsRetriever.retrieve(req as OpenApiRequest);
  return params;
});

describe("params", () => {
  it("should convert cases correctly", async () => {
    const res = await tester.test(async (app) => {
      const agent = supertest.agent(app);
      await agent
        .post(
          "/cases/abc/def/ghi?camelQuery=c&PascalQuery=p&snake_query=s&kebab-query=k"
        )
        .send({
          camelBody: "camel",
          PascalBody: "pascal",
          snake_body: "snake",
        })
        .set("xCamelHeader", "came")
        .set("XPascalHeader", "pas")
        .set("x_snake_header", "sna")
        .set("x-kebab-header", "keb")
        .set("Cookie", [
          "camelCookie=cc",
          "PascalCookie=pc",
          "snake_cookie=sc",
          "kebab-cookie=kc",
        ]);
    });
    expect(res).toEqual({
      camelPath: "abc",
      PascalPath: "def",
      snake_path: "ghi",

      camelQuery: "c",
      PascalQuery: "p",
      snake_query: "s",
      kebab_query: "k",

      xCamelHeader: "came",
      XPascalHeader: "pas",
      x_snake_header: "sna",
      x_kebab_header: "keb",

      camelCookie: "cc",
      PascalCookie: "pc",
      snake_cookie: "sc",
      kebab_cookie: "kc",

      CasesRequest: {
        camelBody: "camel",
        PascalBody: "pascal",
        snake_body: "snake",
      },
    } satisfies DefaultApi["cases"][0]);
  });

  it("should have correct case for camel case component", async () => {
    const res = await tester.test(async (app) =>
      supertest(app).post("/cases/components/camelCase").send({ id: "abc" })
    );
    expect(res).toEqual({
      CamelComponent: { id: "abc" },
    } satisfies DefaultApi["casesComponentCamelCase"][0]);
  });

  it("should have correct case for pascal case component", async () => {
    const res = await tester.test(async (app) =>
      supertest(app).post("/cases/components/PascalCase").send({ id: "abc" })
    );
    expect(res).toEqual({
      PascalComponent: { id: "abc" },
    } satisfies DefaultApi["casesComponentPascalCase"][0]);
  });

  it("should have correct case for snake case component", async () => {
    const res = await tester.test(async (app) =>
      supertest(app).post("/cases/components/snake_case").send({ id: "abc" })
    );
    expect(res).toEqual({
      SnakeComponent: { id: "abc" },
    } satisfies DefaultApi["casesComponentSnakeCase"][0]);
  });

  it("should have correct case for camel case file", async () => {
    const res = await tester.test(async (app) =>
      supertest(app).post("/cases/files/camelCase").send({ id: 1, name: "abc" })
    );
    expect(res).toEqual({
      CamelExternal: { id: 1, name: "abc" },
    } satisfies DefaultApi["casesFileCamelCase"][0]);
  });

  it("should have correct case for pascal case file", async () => {
    const res = await tester.test(async (app) =>
      supertest(app)
        .post("/cases/files/PascalCase")
        .send({ id: 1, name: "abc" })
    );
    expect(res).toEqual({
      PascalExternal: { id: 1, name: "abc" },
    } satisfies DefaultApi["casesFilePascalCase"][0]);
  });

  it("should have correct case for snake case file", async () => {
    const res = await tester.test(async (app) =>
      supertest(app)
        .post("/cases/files/snake_case")
        .send({ id: 1, name: "abc" })
    );
    expect(res).toEqual({
      SnakeExternal: { id: 1, name: "abc" },
    } satisfies DefaultApi["casesFileSnakeCase"][0]);
  });
});
