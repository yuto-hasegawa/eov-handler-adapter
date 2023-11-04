import { describe, expect, it } from "vitest";
import supertest from "supertest";
import { ArgsRetriever } from "./ArgsRetriever.js";
import { OpenApiRequest } from "./types.js";
import * as path from "node:path";
import { EOVRequestTester } from "./EOVRequestTester.js";
import { typeScriptNodeGenCoordinator } from "./RequestBodyCoordinator/TypeScriptNodeGen.js";
import yaml from "js-yaml";
import * as fs from "node:fs";
import { OpenAPIV3 } from "express-openapi-validator/dist/framework/types.js";

const SPEC_PATH = path.join(__dirname, "../samples/openapi.yaml");
const SPEC = yaml.load(
  fs.readFileSync(SPEC_PATH, "utf-8")
) as OpenAPIV3.Document;

const paramsRetriever = new ArgsRetriever(SPEC, typeScriptNodeGenCoordinator);
const tester = new EOVRequestTester(SPEC_PATH, async (req) => {
  const params = paramsRetriever.retrieve(req as OpenApiRequest);
  return params;
});

describe("ArgsRetriever", () => {
  it("should retrieve params from path", async () => {
    const res = await tester.test((app) =>
      supertest(app).get("/parameters/abc")
    );
    expect(res).toEqual({ id: "abc" });
  });

  it("should retrieve params from query", async () => {
    const res = await tester.test((app) =>
      supertest(app).get("/parameters/abc?limit=12&q=12")
    );
    expect(res).toEqual({ id: "abc", limit: 12, q: "12" });
  });

  it("should retrieve params from header", async () => {
    const res = await tester.test((app) =>
      supertest(app).get("/parameters/abc").set("X-Request-ID", "hoge")
    );
    expect(res).toEqual({ id: "abc", xRequestID: "hoge" });
  });

  it("should retrieve params from cookie", async () => {
    const res = await tester.test(async (app) => {
      const agent = supertest.agent(app);
      await agent.get("/parameters/abc").set("Cookie", ["sessionId=sess"]);
    });
    expect(res).toEqual({ id: "abc", sessionId: "sess" });
  });

  it("should retrieve params from combined sources", async () => {
    const res = await tester.test((app) =>
      supertest(app).get("/parameters/abc?limit=12").set("X-Request-ID", "hoge")
    );
    expect(res).toEqual({
      id: "abc",
      limit: 12,
      xRequestID: "hoge",
    });
  });

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
    });
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
    });
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
    });
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
    });
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
    });
  });

  it("should retrieve params from application/json components $ref", async () => {
    const res = await tester.test((app) =>
      supertest(app).post("/application_json/components_ref").send({
        id: 123,
      })
    );
    expect(res).toEqual({
      schemaComponent: {
        id: 123,
      },
    });
  });

  it("should retrieve params from application/json file $ref", async () => {
    const res = await tester.test((app) =>
      supertest(app).post("/application_json/file_ref").send({
        id: 123,
      })
    );
    expect(res).toEqual({
      fileObject: {
        id: 123,
      },
    });
  });

  it("should retrieve params from mixed content types", async () => {
    {
      const res = await tester.test((app) =>
        supertest(app).post("/mixed").send("name=cat")
      );
      expect(res).toEqual({
        name: "cat",
      });
    }

    {
      const res = await tester.test((app) =>
        supertest(app).post("/mixed").send({ age: 4 })
      );
      expect(res).toEqual({ mixedRequest: { age: 4 } });
    }
  });

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
    });
  });
});
