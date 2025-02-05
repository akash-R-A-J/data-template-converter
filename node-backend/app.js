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
const convertData = require("./helper");
const FormData = require("form-data");

const app = express();
const port = 3500;

// Middleware to parse JSON requests
app.use(bodyParser.json());
app.use(cors());

// Define the POST endpoint to receive the data and write it to respective files
app.post("/text-data", async (req, res) => {
  console.log("-----------------");
  const { sourceData, template } = req.body;

  console.log("received request!");
  // Define the file paths for saving the data
  const sourceDataFilePath = path.join(__dirname, "sourceData.txt"); // ?
  const templateFilePath = path.join(__dirname, "template.ftl");

  try {
    // Write sourceData to sourceData.txt
    fs.writeFileSync(
      sourceDataFilePath,
      JSON.stringify(sourceData, null, 2),
      "utf8"
    );
    console.log("Source Data saved to sourceData.txt");

    // Write template data to template.ftl
    fs.writeFileSync(templateFilePath, template.toString(), "utf8");
    console.log("Template saved to template.ftl");

    // Example usage
    const dataTransform_json = fs.readFileSync(sourceDataFilePath, "utf8");
    const jsonData = await convertData(dataTransform_json); // convertData

    // Send JSON data to Java backend for Freemarker processing
    sendFilesToSpringBoot(jsonData);

    console.log("sending response to the frontend!");
    return res.status(200).json({ message: "Files saved successfully!" });
  } catch (error) {
    console.log("error-1");
    console.error("Error writing files:", error);
    res
      .status(500)
      .json({ message: "Error saving data to files", error: error.message });
  }
});

async function sendFilesToSpringBoot(jsonData) {
  try {
    console.log("----------------------------------");
    console.log("jsonData" + jsonData);
    fs.writeFile("output.json", JSON.stringify(jsonData, null, 2), (err) => {
      if (err) {
        console.log("error-2");
        console.error("Error writing to file", err);
      } else {
        console.log("JSON data successfully written to output.json");
      }
    });

    // Create a FormData object
    const formData = new FormData();

    // File paths (update these with actual file locations)
    const jsonFilePath = path.join(__dirname, "output.json");
    const templateFilePath = path.join(__dirname, "template.ftl");

    // Append files to formData
    formData.append("jsonFile", fs.createReadStream(jsonFilePath)); // Attach JSON file
    formData.append("templateFile", fs.createReadStream(templateFilePath)); // Attach FTL template

    console.log(formData.jsonFile);
    // Send request to Spring Boot
    const response = await axios.post(
      "http://localhost:8080/convert/process-template",
      formData,
      {
        headers: {...formData.getHeaders(),}
      }
    );

    console.log("Response from Spring Boot:", response.data);
  } catch (error) {
    console.error("Error sending request:", error.message);
  }
}

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
