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
  typeScriptNodeGenCoordinator()
);
const tester = new EOVRequestTester(SPEC_PATH, async (req) => {
  const params = paramsRetriever.retrieve(req as OpenApiRequest);
  return params;
});

type Params = DefaultApi["parameters"][0];

describe("params", () => {
  it("should retrieve params from path", async () => {
    const res = await tester.test((app) =>
      supertest(app).get("/parameters/abc")
    );
    expect(res).toEqual({ id: "abc" } satisfies Params);
  });

  it("should retrieve params from query", async () => {
    const res = await tester.test((app) =>
      supertest(app).get("/parameters/abc?limit=12&q=12")
    );
    expect(res).toEqual({ id: "abc", limit: 12, q: "12" } satisfies Params);
  });

  it("should retrieve params from header", async () => {
    const res = await tester.test((app) =>
      supertest(app).get("/parameters/abc").set("X-Request-ID", "hoge")
    );
    expect(res).toEqual({ id: "abc", xRequestID: "hoge" } satisfies Params);
  });

  it("should retrieve params from cookie", async () => {
    const res = await tester.test(async (app) => {
      const agent = supertest.agent(app);
      await agent.get("/parameters/abc").set("Cookie", ["sessionId=sess"]);
    });
    expect(res).toEqual({ id: "abc", sessionId: "sess" } satisfies Params);
  });

  it("should retrieve params from combined sources", async () => {
    const res = await tester.test((app) =>
      supertest(app).get("/parameters/abc?limit=12").set("X-Request-ID", "hoge")
    );
    expect(res).toEqual({
      id: "abc",
      limit: 12,
      xRequestID: "hoge",
    } satisfies Params);
  });
});
