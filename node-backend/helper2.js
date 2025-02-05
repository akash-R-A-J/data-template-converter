const fs = require("fs");
const path = require("path");
const xml2js = require("xml2js");
const csvtojson = require("csvtojson");

async function detectFormat(req, res, next) {
  try {
    console.log("detectFormat");
    const data = req.body.sourceData;
    let type = "";

    console.log(data);
    console.log(typeof data);

    if (typeof data === "string") {
      const trimmedData = data.trim();

      // Check for JSON: starts with '{' or '['
      if (trimmedData.startsWith("{") || trimmedData.startsWith("[")) {
        type = "json";
      }
      // Check for XML/soap: starts with '<'
      else if (trimmedData.startsWith("<")) {
        // Check if it is a SOAP envelope (common SOAP tags)
        if (
          trimmedData.includes("soap:Envelope") ||
          trimmedData.includes("SOAP-ENV:Envelope")
        ) {
          type = "soap";
        } else if (trimmedData.includes("xml")) {
          type = "xml";
        }
      }
      // Check for CSV: look for commas and newlines
      else if (trimmedData.includes(",") && /\r?\n/.test(trimmedData)) {
        type = "csv";
      } else {
        throw new Error("Unknown data format");
      }
    } else if (Buffer.isBuffer(data)) {
      // Convert buffer to string
      const fileContent = data.toString().trim();

      if (fileContent.startsWith("{") || fileContent.startsWith("[")) {
        type = "json";
      } else if (fileContent.startsWith("<")) {
        if (
          fileContent.includes("soap:Envelope") ||
          fileContent.includes("SOAP-ENV:Envelope")
        ) {
          type = "soap";
        } else if (trimmedData.includes("xml")) {
          type = "xml";
        }
      } else if (fileContent.includes(",") && /\r?\n/.test(fileContent)) {
        type = "csv";
      } else {
        throw new Error("Unsupported file type");
      }
    } else {
      throw new Error("Unable to detect format");
    }

    // Attach the detected format to the request object
    req.detectedFormat = type;
    next();
  } catch (error) {
    next(error);
  }
}

async function validateData(req, res, next) {
  try {
    const { sourceData, template } = req.body;
    const format = req.detectedFormat; // Assumed to be set by a previous middleware

    // Validate the FTL template (basic check)
    if (!template || typeof template !== "string" || !template.includes("<#")) {
      return res
        .status(400)
        .json({ message: "Invalid FTL template provided." });
    }

    // Validate that sourceData is present
    if (!sourceData) {
      return res.status(400).json({ message: "Missing source data." });
    }

    // Validate the source data based on the detected format
    if (!format) {
      return res
        .status(400)
        .json({ message: "Source data format was not detected." });
    }

    switch (format) {
      case "json":
        try {
          JSON.parse(sourceData);
        } catch (error) {
          return res
            .status(400)
            .json({ message: "Invalid JSON data.", error: error.message });
        }
        break;
      case "xml":
      case "soap":
        try {
          const parser = new xml2js.Parser();
          await parser.parseStringPromise(sourceData);
        } catch (error) {
          return res
            .status(400)
            .json({ message: "Invalid XML data.", error: error.message });
        }
        break;
      case "csv":
        try {
          await csvtojson().fromString(sourceData);
        } catch (error) {
          return res
            .status(400)
            .json({ message: "Invalid CSV data.", error: error.message });
        }
        break;
      default:
        return res
          .status(400)
          .json({ message: "Unsupported source data format." });
    }

    // If all validations pass, attach the validated format to the request and call next()
    req.validatedFormat = format;
    next();
  } catch (error) {
    next(error);
  }
}

// Middleware to convert sourceData (of type json, csv, xml, or soap) into JSON,
// and write the JSON to src.json and the provided template (FTL data) into template.ftl.
async function convertData(req, res, next) {
  try {
    let jsonData;
    const data = req.body.sourceData;
    const format = req.detectedFormat; // expected to be one of "json", "csv", "xml", or "soap"

    // Process the sourceData according to its detected format
    switch (format) {
      case "json":
        try {
          jsonData = JSON.parse(data);
        } catch (error) {
          throw new Error("Invalid JSON data: " + error.message);
        }
        break;
      case "csv":
        // Convert CSV string to JSON using csvtojson
        jsonData = await convertCsvToJson(data);
        break;
      case "xml":
      case "soap":
        // For both XML and SOAP, use the same conversion function.
        jsonData = await convertXmlToJson(data);
        break;
      default:
        throw new Error("Unsupported format detected: " + format);
    }

    // Write the converted JSON data to a file named "src.json"
    const srcJsonFilePath = path.join(__dirname, "../uploads/src.json");
    fs.writeFileSync(
      srcJsonFilePath,
      JSON.stringify(jsonData, null, 2),
      "utf8"
    );
    console.log("Converted source data saved to", srcJsonFilePath);

    // Retrieve the FreeMarker template data from req.body.template and write it to "template.ftl"
    const ftlData = req.body.template;
    if (!ftlData || typeof ftlData !== "string") {
      console.warn("No valid template data provided.");
    } else {
      const templateFilePath = path.join(__dirname, "../uploads/template.ftl");
      fs.writeFileSync(templateFilePath, ftlData, "utf8");
      console.log("Template data saved to", templateFilePath);
    }

    // Optionally, attach the converted JSON data to the request for further processing
    req.convertedData = jsonData;
    next();
  } catch (error) {
    console.error("Error converting data:", error);
    next(error);
  }
}

// Helper function: Convert XML (or SOAP XML) string to JSON using xml2js
async function convertXmlToJson(xmlData) {
  const parser = new xml2js.Parser({
    explicitArray: false, // Prevents unnecessary arrays for single elements
    mergeAttrs: true, // Merges attributes into objects directly
  });
  try {
    let json = await parser.parseStringPromise(xmlData);
    json = normalizeJson(json); // Optional normalization of structure
    return json;
  } catch (error) {
    console.error("Error parsing XML:", error);
    throw error;
  }
}

// Helper function: Normalize JSON structure (recursive normalization)
function normalizeJson(json) {
  if (typeof json !== "object" || json === null) return json;
  for (const key in json) {
    if (Object.prototype.hasOwnProperty.call(json, key)) {
      if (Array.isArray(json[key])) {
        json[key] = json[key].map(normalizeJson);
      } else if (typeof json[key] === "object") {
        json[key] = normalizeJson(json[key]);
      }
    }
  }
  return json;
}

// Helper function: Convert CSV string to JSON using csvtojson
async function convertCsvToJson(csvData) {
  try {
    const json = await csvtojson().fromString(csvData);
    return json;
  } catch (error) {
    console.error("Error converting CSV:", error);
    throw error;
  }
}

module.exports = convertData;
module.exports = validateData;
module.exports = detectFormat;
