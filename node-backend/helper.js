async function detectFormat(data) {
  try {
    console.log("detectFormat");
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
    return type;
  } catch (error) {
    console.log(error);
  }
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
    const format = await detectFormat(data);
    console.log("type : " + format);

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

    return jsonData;
  } catch (error) {
    console.log("error while converting data " + error);
  }
}

module.exports = convertData;
