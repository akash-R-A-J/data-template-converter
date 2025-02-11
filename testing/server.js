const express = require("express");
const multer = require("multer");
const axios = require("axios");
const cors = require("cors");
const utils = require("./utils");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

// Endpoint-1: Both are strings
app.post("/api/endpoint-1", async (req, res) => {
  try {
    const { src, template } = req.body;
    const response = await processTemplate(src, template);

    return res.status(200).json({ output: response });
  } catch (err) {
    console.error("Error: ", err.message || err);
    return res
      .status(500)
      .json({ msg: err.message || "Internal Server Error." });
  }
});

// Endpoint-2: src is a file, template is a string
app.post("/api/endpoint-2", upload.single("src"), async (req, res) => {
  try {
    const template = req.body.template;
    const src = fs.readFileSync(req.file.path, 'utf-8');
    const response = await processTemplate(src, template); // string

    return res.status(200).json({ output: response });
  } catch (err) {
    console.error("Error: ", err.message || err);
    return res
      .status(500)
      .json({ msg: err.message || "Internal Server Error." });
  }
});

// Endpoint-3: src is a string, template is a file
app.post("/api/endpoint-3", upload.single("template"), async (req, res) => {
  try {
    const src = req.body.src;
    const template = fs.readFileSync(req.file.path, 'utf-8');
    const response = await processTemplate(src, template); // string

    return res.status(200).json({ output: response });
  } catch (err) {
    console.error("Error: ", err.message || err);
    return res
      .status(500)
      .json({ msg: err.message || "Internal Server Error." });
  }
});

// Endpoint-4: Both are files
app.post(
  "/api/endpoint-4",
  upload.fields([{ name: "src" }, { name: "template" }]),
  async (req, res) => {
    try {
      const src = fs.readFileSync(req.files["src"][0].path, 'utf-8');
      const template = fs.readFileSync(req.files["template"][0].path, 'utf-8');
      const response = await processTemplate(src, template); // string

      return res.status(200).json({ output: response });
    } catch (err) {
      console.error("Error: ", err.message || err);
      return res
        .status(500)
        .json({ msg: err.message || "Internal Server Error." });
    }
  }
);

/**
 * Sends a request to the Spring Boot process-template-2 endpoint.
 * @param {Object} jsonData - The JSON data to be processed.
 * @param {string} templateString - The FreeMarker template string.
 * @returns {Promise<string>} - The processed output from the backend.
 */
async function processTemplate(src, template) {
  try {
    
    if (!src || !template) {
      return res.status(400).json({ msg: "Missing source or template." });
    }

    if (!(await utils.validateFTL(template))) {
      return res.status(400).json({ msg: "Invalid FTL." });
    }

    const jsonData = await utils.convertSrcToJson(src); // json object
    
    const response = await axios.post(
      "http://localhost:8080/convert/process-template-2",
      {
        jsonData: jsonData,
        templateString: template,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    console.log(response.data);

    return response.data; // Returning the processed output
  } catch (error) {
    console.error(
      "Error processing template:",
      error.response ? error.response.data : error.message
    );
    throw new Error(
      error.response ? error.response.data : "Failed to process template"
    );
  }
}

app.listen(5000, () => console.log("Server running on port 5000"));
