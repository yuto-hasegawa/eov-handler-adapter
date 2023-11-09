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

type Params = DefaultApi["dates"][0];

describe("params", () => {
  it("should retrieve date params correctly", async () => {
    const res = await tester.test((app) =>
      supertest(app)
        .post("/dates")
        .field("createdAt", "2021-01-01T00:00:00.000+09:00")
        .field("holiday", "2021-01-01")
    );
    expect(res).toEqual({
      createdAt: new Date("2021-01-01T00:00:00.000+09:00"),
      holiday: "2021-01-01",
    } as Params);
  });
});
