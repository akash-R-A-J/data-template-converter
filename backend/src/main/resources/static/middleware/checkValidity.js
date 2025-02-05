const xml2js = require('xml2js');
const csvtojson = require('csvtojson');

async function validateData(req, res, next) {
  try {
    const { sourceData, template } = req.body;
    const format = req.detectedFormat; // Assumed to be set by a previous middleware

    // Validate the FTL template (basic check)
    if (!template || typeof template !== 'string' || !template.includes("<#")) {
      return res.status(400).json({ message: "Invalid FTL template provided." });
    }

    // Validate that sourceData is present
    if (!sourceData) {
      return res.status(400).json({ message: "Missing source data." });
    }

    // Validate the source data based on the detected format
    if (!format) {
      return res.status(400).json({ message: "Source data format was not detected." });
    }

    switch (format) {
      case "json":
        try {
          JSON.parse(sourceData);
        } catch (error) {
          return res.status(400).json({ message: "Invalid JSON data.", error: error.message });
        }
        break;
      case "xml":
      case "soap":
        try {
          const parser = new xml2js.Parser();
          await parser.parseStringPromise(sourceData);
        } catch (error) {
          return res.status(400).json({ message: "Invalid XML data.", error: error.message });
        }
        break;
      case "csv":
        try {
          await csvtojson().fromString(sourceData);
        } catch (error) {
          return res.status(400).json({ message: "Invalid CSV data.", error: error.message });
        }
        break;
      default:
        return res.status(400).json({ message: "Unsupported source data format." });
    }

    // If all validations pass, attach the validated format to the request and call next()
    req.validatedFormat = format;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = validateData;
