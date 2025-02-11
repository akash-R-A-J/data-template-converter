const axios = require("axios");
const path = require("path");
const xml2js = require("xml2js");
const { parse } = require("csv-parse/sync");

// Function to send FTL string to backend
/* return true if the ftl string is valid else false
    input->string, output->boolean
*/
async function validateFTL(ftlString) {
  try {
    const response = await axios.post(
      "http://localhost:8080/convert/validate/ftl",
      {
        ftlString: ftlString, // Send FTL string in request body
      },
      {
        headers: { "Content-Type": "application/json" }, // Ensure JSON format
      }
    );

    return response.data; // Return true/false from backend
  } catch (error) {
    console.error("Error:", error.message);
    return false; // Return false in case of an error
  }
}

/* function to detect format of the given string
    returns format of the string
    input->string, output->string
*/
async function detectFormat(data) {
  try {
    console.log("detectFormat");
    let type = "";

    if (typeof data === "string" || data != "") {
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

    return type;
  } catch (error) {
    console.log(error);
  }
}

/* Function to determine file type
    use this for calling it: 
        1.  for this case: upload.single("file")
            const fileType = getFileType(req.file); -> when this is the case: 
             
        2.  for this case: upload.fields([{ name: "src" }, { name: "template" }])
            const srcFileType = getFileType(req.files["src"][0]);
            const templateFileType = getFileType(req.files["template"][0]);
            
    input->file, output->string 
*/
function getFileType(file) {
  if (!file || !file.originalname || !file.mimetype) {
    return null; // Invalid input
  }

  const allowedTypes = {
    "application/json": "json",
    "application/xml": "xml",
    "text/xml": "xml",
    "application/soap+xml": "soap",
    "text/csv": "csv",
    "application/csv": "csv",
  };

  const fileExtension = path
    .extname(file.originalname)
    .toLowerCase()
    .replace(".", "");
  const mimeType = file.mimetype.toLowerCase();

  return (
    allowedTypes[mimeType] ||
    (["xml", "soap", "csv", "json"].includes(fileExtension)
      ? fileExtension
      : null)
  );
}

/*
    VALIDATING FUNCTIONS
*/

// to validate the content of xml file if it is valid or not
// input->string, output->boolean
async function isValidXML(xmlString) {
  const parser = new xml2js.Parser({ strict: true, normalize: true });

  return new Promise((resolve) => {
    parser.parseString(xmlString, (err) => {
      resolve(err ? false : true);
    });
  });
}

// to validate the content of json file if it is valid or not
// input->string, output->boolean
function isValidJSON(jsonString) {
  try {
    JSON.parse(jsonString); // Attempt to parse the JSON string
    return true; // If no error, it's valid JSON
  } catch (error) {
    return false; // If an error occurs, it's invalid JSON
  }
}

// to validate the content of soap file if it is valid or not
// input->string, output->boolean
async function isValidSOAP(soapString) {
  const parser = new xml2js.Parser({ explicitArray: false });

  try {
    const result = await parser.parseStringPromise(soapString); // Parse XML to JSON

    // Check if required SOAP structure exists
    if (
      result.Envelope ||
      result["soapenv:Envelope"] ||
      result["soap:Envelope"] // Different namespace variations
    ) {
      return true; // It's a valid SOAP message
    } else {
      return false; // Missing SOAP structure
    }
  } catch (error) {
    return false; // Invalid XML or parsing error
  }
}

// to validate the content of csv file if it is valid or not
// input->string, output->boolean
function isValidCSV(csvString) {
  try {
    // Parse CSV with auto-detection of delimiter
    const records = parse(csvString, {
      columns: false,
      relax_column_count: true,
    });

    // Ensure at least one row exists
    if (records.length === 0) {
      return false;
    }

    // Check if all rows have the same number of columns
    const columnCount = records[0].length;
    if (!records.every((row) => row.length === columnCount)) {
      return false; // Row length mismatch → invalid CSV
    }

    return true; // CSV is valid
  } catch (error) {
    return false; // Parsing error → invalid CSV
  }
}

/* 
    CONVERSION FUNCTIONS
*/

// convert xml string to json object
// input->string, output->json object
async function xmlToJson(xmlString) {
  try {
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xmlString);
    return result;
  } catch (error) {
    throw new Error("Invalid XML format: " + error.message);
  }
}

// convert csv string to json object
// input->string, output->json object
function csvToJson(csvString) {
  try {
    const records = parse(csvString, { columns: true, skip_empty_lines: true });
    return records;
  } catch (error) {
    throw new Error("Invalid CSV format: " + error.message);
  }
}

// convert soap string to json object
// input->string, output->json object
async function soapToJson(soapString) {
  try {
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(soapString);

    // SOAP envelope extraction
    if (result["soap:Envelope"] && result["soap:Envelope"]["soap:Body"]) {
      return result["soap:Envelope"]["soap:Body"];
    }
    return result;
  } catch (error) {
    throw new Error("Invalid SOAP format: " + error.message);
  }
}

// function to convert src string to json object
// input->string, output->json object
async function convertSrcToJson(src) {
  try {
    const type = await detectFormat(src);
    console.log("Detected Type:", type);
    
    let json = {};

    switch (type) {
      case "xml":
        if (await isValidXML(src)) {
          json = await xmlToJson(src);
        } else {
          throw new Error("Invalid XML.");
        }
        break;
      case "soap":
        if (await isValidSOAP(src)) {
          json = await soapToJson(src);
        } else {
          throw new Error("Invalid SOAP.");
        }
        break;
      case "csv":
        if (await isValidCSV(src)) {
          json = await csvToJson(src);
        } else {
          throw new Error("Invalid CSV.");
        }
        break;
      case "json":
        if (await isValidJSON(src)) {
          json = JSON.parse(src);
        } else {
          throw new Error("Invalid JSON.");
        }
        break;
      default:
        throw new Error("Invalid source type.");
    }

    return json;
  } catch (error) {
    console.error("Error converting source:", error.message);
    return { error: error.message };
  }
}


module.exports = {
  validateFTL,
  detectFormat,
  getFileType,
  isValidXML,
  isValidJSON,
  isValidSOAP,
  isValidCSV,
  xmlToJson,
  csvToJson,
  soapToJson,
  convertSrcToJson,
};
