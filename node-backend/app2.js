const fs = require("fs");
const axios = require("axios");
const xml2js = require("xml2js");
const csvtojson = require("csvtojson");
const cheerio = require("cheerio");
const { simpleParser } = require("mailparser");
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");

const app = express();
const port = 3500;

// Middleware to parse JSON requests
app.use(bodyParser.json());
app.use(cors());

// Define the POST endpoint to receive the data and write it to respective files
app.post("/text-data", (req, res) => {
  console.log("-----------------");
  const { sourceData, template } = req.body;

  console.log("received request!");
  // Define the file paths for saving the data
  const sourceDataFilePath = path.join(__dirname, "sourceData.txt"); // ?
  const templateFilePath = path.join(__dirname, "template.ftl");

  try {
    // Write sourceData to sourceData.txt
    fs.writeFileSync(sourceDataFilePath, sourceData, "utf8"); // ?
    console.log("Source Data saved to sourceData.txt");

    // Write template data to template.ftl
    fs.writeFileSync(templateFilePath, template, "utf8");
    console.log("Template saved to template.ftl");

    // Example usage
    const dataTransform_json = fs.readFileSync("sourceData.txt", "utf-8");
    const response = convertData(dataTransform_json);
    console.log("sending response to the frontend!");
    
    return res.status(200).send(response);
  } catch (error) {
    console.log("error-1");
    console.error("Error writing files:", error);
    res
      .status(500)
      .json({ message: "Error saving data to files", error: error.message });
  }
});

async function detectFormat(data) {
  if (typeof data === "string") {
    const trimmedData = data.trim();
    
    console.log("trimmedData.startsWith(`{`) : " + trimmedData.startsWith("{"));
    console.log(trimmedData.charAt(0));

    if (trimmedData.startsWith("<")) {
      // Check if the data includes common HTML tags
      if (
        trimmedData.includes("<html>") ||
        trimmedData.includes("<head>") ||
        trimmedData.includes("<body>") ||
        trimmedData.includes("<div>") ||
        trimmedData.includes("<span>") ||
        trimmedData.includes("<script>") ||
        trimmedData.includes("<meta>") ||
        trimmedData.includes("<link>")
      ) {
        return "html"; // If any of these tags are present, it's likely HTML
      }
      return "xml"; // Otherwise, it's likely XML
    } else if (trimmedData.startsWith("{") || trimmedData.startsWith("[")) {
      return "json";
    } else if (
      trimmedData.includes("From:") &&
      trimmedData.includes("Subject:")
    ) {
      // Likely Email format (contains common email headers)
      return "email";
    } else if (trimmedData.includes(",") && /\r?\n/.test(trimmedData)) {
      // Likely CSV format (contains commas and new lines for row separation)
      return "csv";
    } else {
      throw new Error("Unknown data format");
    }
  } else if (Buffer.isBuffer(data)) {
    // Handle file buffers
    const fileContent = data.toString().trim();

    if (fileContent.startsWith("<")) {
      if (
        fileContent.includes("<html>") ||
        fileContent.includes("<head>") ||
        fileContent.includes("<body>") ||
        fileContent.includes("<div>") ||
        fileContent.includes("<span>") ||
        fileContent.includes("<script>") ||
        fileContent.includes("<meta>") ||
        fileContent.includes("<link>")
      ) {
        return "html"; // If any of these tags are present, it's likely HTML
      }
      return "xml"; // Otherwise, it's likely XML
    } else if (fileContent.includes(",") && /\r?\n/.test(fileContent)) {
      return "csv";
    } else if (
      fileContent.includes("From:") &&
      fileContent.includes("Subject:")
    ) {
      return "email";
    }
    throw new Error("Unsupported file type");
  }

  throw new Error("Unable to detect format");
}

async function convertXmlToJson(xmlData) {
  const parser = new xml2js.Parser({
    explicitArray: false, // Prevents unnecessary arrays for single elements
    mergeAttrs: true, // Merges attributes into objects directly
  });

  try {
    let json = await parser.parseStringPromise(xmlData);
    json = normalizeJson(json); // Normalize structure
    return json;
  } catch (error) {
    console.error("Error parsing XML:", error);
    throw error;
  }
}

function normalizeJson(json) {
  // Recursive function to ensure proper array handling
  if (typeof json !== "object" || json === null) return json;

  for (const key in json) {
    if (Object.prototype.hasOwnProperty.call(json, key)) {
      if (Array.isArray(json[key])) {
        // Convert single-item arrays to objects
        json[key] = json[key].map(normalizeJson);
      } else if (typeof json[key] === "object") {
        json[key] = normalizeJson(json[key]);
      }
    }
  }

  return json;
}

// Example XML Input
async function convertCsvToJson(csvData) {
  const json = await csvtojson().fromString(csvData);
  return json;
}
async function convertHtmlToJson(htmlData) {
  const $ = cheerio.load(htmlData); // Load the HTML into Cheerio

  // Function to recursively parse each element and handle nested elements
  const parseElement = (element) => {
    const children = [];
    let content = "";

    // Iterate over each child of the current element
    $(element)
      .children()
      .each((index, child) => {
        const childJson = parseElement(child); // Recursive call for child elements
        if (childJson) {
          children.push(childJson); // Add child to the children array
        }
      });

    // Get the text content of the current element (excluding children)
    $(element)
      .contents()
      .each((index, node) => {
        // Check if it's a text node (not an element)
        if (node.type === "text") {
          content += $(node).text().trim() + "\n"; // Add text content
        }
      });

    // Clean up content (remove unnecessary whitespace and newlines)
    content = content.trim();

    const elementJson = {
      tag: element.tagName, // Tag name of the element
      content: content, // Content of the current element
      children: children, // Recursively captured children
    };

    return elementJson;
  };

  // Parse the body content
  const bodyContent = [];
  $("body")
    .children()
    .each((index, el) => {
      const elementJson = parseElement(el); // Get JSON representation for each child of body
      bodyContent.push(elementJson);
    });

  // Final JSON structure
  const jsonData = {
    title: $("title").text(), // Extract the title of the HTML page
    bodyContent: bodyContent, // List of body content as parsed
  };

  return jsonData;
}

// Function to convert .eml to JSON
// async function convertEmlToJson(emlData) {
//   // console.log("-------------------");
//   // console.log("emlData: ");
//   // console.log(emlData);

//   try {
//     // Parse the .eml file to extract email details
//     const parsedEmail = await simpleParser(emlData);
//     // console.log("parsedEmail: ");
//     // console.log(parsedEmail);

//     // Structure the parsed email into JSON format
//     const emailJson = {
//       from: parsedEmail.from.text,
//       to: parsedEmail.to.text,
//       subject: parsedEmail.subject,
//       date: parsedEmail.date,
//       text: parsedEmail.text,
//       html: parsedEmail.html || "",
//       attachments: parsedEmail.attachments.map((att) => ({
//         filename: att.filename,
//         contentType: att.contentType,
//         contentDisposition: att.contentDisposition,
//       })),
//     };

//     // Write the JSON output to a file
//     fs.writeFileSync("output.json", JSON.stringify(emailJson, null, 2));

//     console.log("EML converted to JSON successfully!");
//     return emailJson;
//   } catch (error) {
//     console.error("Error while converting EML to JSON:", error);
//   }
// }

async function convertData(data) {
  try {
    let jsonData;
    const type = await detectFormat(data);
    console.log("type : " + type);

    switch (type) {
      case "xml":
        jsonData = await convertXmlToJson(data).then((json) =>
          console.log(JSON.stringify(json, null, 2))
        );
        break;
      case "csv":
        jsonData = await convertCsvToJson(data);
        break;
      case "json":
        console.log("type json detected");
        jsonData = JSON.parse(data);
        break;
      case "html":
        jsonData = await convertHtmlToJson(data);
        break;
      default:
        throw new Error("Unsupported format detected");
    }

    // Send JSON data to Java backend for Freemarker processing
    return await sendDataToBackend(jsonData);
  } catch (error) {
    console.error("Error detecting or converting data:", error);
  }
}

// Sending converted JSON to backend
async function sendDataToBackend(jsonData) {
  try {
    console.log("----------------------------------");
    fs.writeFile("output.json", JSON.stringify(jsonData, null, 2), (err) => {
      if (err) {
        console.log("error-2");
        console.error("Error writing to file", err);
      } else {
        console.log("JSON data successfully written to output.json");
      }
    });

    const data = {
      jsonFile: "output.json",
      templateFile: "template.ftl",
    };

    // how to send data fron node.js to spring-boot?
    const response = await axios.post(
      `http://localhost:8080/convert/process-template?jsonfile=${output.json}&templateFile=${template.ftl}`
    );

    console.log("Response from Java Backend:", response.data);
    return res.status(200).send(response.data);
  } catch (error) {
    console.error("Error sending data to backend:", error);
  }
}

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
