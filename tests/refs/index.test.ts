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

describe("params", () => {
  it("should retrieve params from application/json components $ref", async () => {
    const res = await tester.test((app) =>
      supertest(app).post("/components").send({
        id: 123,
      })
    );
    expect(res).toEqual({
      schemaComponent: {
        id: 123,
      },
    } as DefaultApi["components"][0]);
  });

  it("should retrieve params from application/json file $ref", async () => {
    const res = await tester.test((app) =>
      supertest(app).post("/file").send({
        id: 123,
        name: "Taro",
      })
    );
    expect(res).toEqual({
      fileObject: {
        id: 123,
        name: "Taro",
      },
    } as DefaultApi["file"][0]);
  });
});
