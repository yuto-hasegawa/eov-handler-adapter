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
  it("should retrieve params from application/json body", async () => {
    const res = await tester.test((app) =>
      supertest(app).post("/application_json").send({
        name: "Mike",
        age: 4,
      })
    );
    expect(res).toEqual({
      applicationJsonRequest: {
        name: "Mike",
        age: 4,
      },
    } satisfies DefaultApi["applicationJson"][0]);
  });

  it("should retrieve params from application/x-www-form-urlencoded", async () => {
    const res = await tester.test((app) =>
      supertest(app)
        .post("/x_www_form_urlencoded")
        .send(
          "type=healthcheck&links[0][name]=sns&links[0][url]=https://sns.example.com&links[1][name]=website&links[1][url]=https://example.com"
        )
    );
    expect(res).toEqual({
      type: "healthcheck",
      links: [
        { name: "sns", url: "https://sns.example.com" },
        { name: "website", url: "https://example.com" },
      ],
    } as DefaultApi["xWwwFormUrlencoded"][0]);
  });

  it("should retrieve params from multipart/form-data body", async () => {
    const res = await tester.test((app) =>
      supertest(app)
        .post("/multipart_form_data")
        .field("name", "Vaccination")
        .field("authority", '{"name": "WHO", "url": "https://www.who.int/"}')
        .attach("photo", Buffer.from("Hello?"), {
          filename: "hello.txt",
          contentType: "text/plain",
        })
        .attach("attachments", Buffer.from("Hello?"), {
          filename: "hello.txt",
          contentType: "text/plain",
        })
        .attach("attachments", Buffer.from("Hello?"), {
          filename: "hello.txt",
          contentType: "text/plain",
        })
    );
    expect(res).toEqual({
      name: "Vaccination",
      authority: { name: "WHO", url: "https://www.who.int/" },
      photo: {
        fieldname: "photo",
        originalname: "hello.txt",
        encoding: "7bit",
        mimetype: "text/plain",
        buffer: Buffer.from("Hello?"),
        size: 6,
      },
      attachments: [
        {
          fieldname: "attachments",
          originalname: "hello.txt",
          encoding: "7bit",
          mimetype: "text/plain",
          buffer: Buffer.from("Hello?"),
          size: 6,
        },
        {
          fieldname: "attachments",
          originalname: "hello.txt",
          encoding: "7bit",
          mimetype: "text/plain",
          buffer: Buffer.from("Hello?"),
          size: 6,
        },
      ],
    } satisfies DefaultApi["multipartFormData"][0]);
  });

  it("should retrieve params from application/octet-stream body", async () => {
    const buf = Buffer.from("Hello?");
    const res = await tester.test((app) =>
      supertest(app)
        .post("/octet_stream")
        .send(buf)
        .set("Content-Type", "application/octet-stream")
    );
    expect(res).toEqual({
      body: buf,
    } as DefaultApi["octetStream"][0]);
  });

  it("should retrieve params from text/plain body", async () => {
    const res = await tester.test((app) =>
      supertest(app)
        .post("/text_plain")
        .send("I wish I didn't need")
        .set("Content-Type", "text/plain")
    );
    expect(res).toEqual({
      body: "I wish I didn't need",
    } as DefaultApi["textPlain"][0]);
  });

  it("should accepet www-form-urlencoded request body", async () => {
    const res = await tester.test((app) =>
      supertest(app).post("/mixed").send("name=cat")
    );
    expect(res).toEqual({
      name: "cat",
    } satisfies DefaultApi["mixed"][0]);
  });

  it("should accept application/json request body", async () => {
    const res = await tester.test((app) =>
      supertest(app).post("/mixed").send({ age: 4 })
    );
    expect(res).toEqual({ mixedRequest: { age: 4 } });
  });
});
