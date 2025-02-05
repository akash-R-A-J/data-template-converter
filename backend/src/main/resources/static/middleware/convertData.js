const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const csvtojson = require('csvtojson');

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
    const srcJsonFilePath = path.join(__dirname, '../uploads/src.json');
    fs.writeFileSync(srcJsonFilePath, JSON.stringify(jsonData, null, 2), "utf8");
    console.log("Converted source data saved to", srcJsonFilePath);
    
    // Retrieve the FreeMarker template data from req.body.template and write it to "template.ftl"
    const ftlData = req.body.template;
    if (!ftlData || typeof ftlData !== 'string') {
      console.warn("No valid template data provided.");
    } else {
      const templateFilePath = path.join(__dirname, '../uploads/template.ftl');
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
    mergeAttrs: true      // Merges attributes into objects directly
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
