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
        } else {
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
        } else {
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

module.exports = detectFormat;
