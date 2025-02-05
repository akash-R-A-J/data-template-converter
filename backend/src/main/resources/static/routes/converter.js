const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const { Router } = require("express");
const multer = require("multer");

const converter = Router();

// Middleware to handle file uploads (using multer)
const upload = multer({ dest: 'uploads/' }).fields([
  { name: 'src', maxCount: 1 },
  { name: 'template', maxCount: 1 }
]);

// Endpoint 1: Accepts src as a string and template as a string
converter.post("/endpoint1", upload, async (req, res) => {
  console.log("endpoint-1");

  try {
    // Retrieve string data from form-data (if sent as text)
    const sourceData = req.body.src ? req.body.src : null;
    const template = req.body.template ? req.body.template : null;

    // Log the received source data and template
    console.log("Source Data:", sourceData);
    console.log("Template:", template);

    // Check if files exist (if they were uploaded)
    if (req.files && req.files["src"] && req.files["template"]) {
      console.log("Files uploaded:", req.files["src"][0].path, req.files["template"][0].path);
    } else {
      console.error("Error: Missing uploaded files");
      return res.status(400).send({ error: "Missing files" });
    }

    // File paths (update these to your actual file locations)
    
    const jsonFilePath = path.join(__dirname, "./uploads/src");
    const templateFilePath = path.join(__dirname, "../uploads/template.ftl");

    // Check if files exist
    if (!fs.existsSync(jsonFilePath) || !fs.existsSync(templateFilePath)) {
      console.error("Error: One or both files are missing.");
      return res.status(400).send({ error: "Missing file(s)" });
    }

    // Create a FormData object and append files for the request to the backend
    const formData = new FormData();
    formData.append("jsonFile", fs.createReadStream(jsonFilePath)); // Attach JSON file
    formData.append("templateFile", fs.createReadStream(templateFilePath)); // Attach FTL template

    // Make the request to the Java backend
    const response = await axios.post(
      "http://localhost:8080/convert/process-template",
      formData,
      {
        headers: {
          ...formData.getHeaders(), // Axios will automatically set Content-Type to multipart/form-data
        },
      }
    );

    console.log("Response from Java Backend:", response.data);
    return res.status(200).send(response.data);
  } catch (error) {
    console.error("Error calling Java backend:", error.message);
    return res.status(500).send({ error: error.message });
  }
});

// Endpoint 2: Accepts src as a string and template as a file
converter.post("/endpoint-2", (req, res) => {
  const srcString = req.body.src;
  if (!srcString) {
    return res.status(400).json({ message: "Missing 'src' string" });
  }

  // Save srcString to src.json (try to parse as JSON first)
  try {
    const jsonData = JSON.parse(srcString);
    fs.writeFileSync(
      path.join(__dirname, "src.json"),
      JSON.stringify(jsonData, null, 2),
      "utf8"
    );
  } catch (error) {
    // If not valid JSON, write as plain text
    fs.writeFileSync(path.join(__dirname, "src.json"), srcString, "utf8");
  }

  // Template file is available via req.file (as uploaded file)
  if (!req.file) {
    return res.status(400).json({ message: "Missing template file" });
  }
  const templateContent = fs.readFileSync(req.file.path, "utf8");
  fs.writeFileSync(
    path.join(__dirname, "template.file"),
    templateContent,
    "utf8"
  );

  res.status(200).json({ message: "Endpoint 1: Files saved successfully." });
});

// Endpoint 3: Accepts src as a file and template as a string
converter.post("/endpoint-3", (req, res) => {
  const templateString = req.body.template;
  if (!templateString) {
    return res.status(400).json({ message: "Missing 'template' string" });
  }

  // Read the src file uploaded via req.file
  if (!req.file) {
    return res.status(400).json({ message: "Missing src file" });
  }
  const srcContent = fs.readFileSync(req.file.path, "utf8");
  try {
    const jsonData = JSON.parse(srcContent);
    fs.writeFileSync(
      path.join(__dirname, "src.json"),
      JSON.stringify(jsonData, null, 2),
      "utf8"
    );
  } catch (error) {
    fs.writeFileSync(path.join(__dirname, "src.json"), srcContent, "utf8");
  }

  // Write the template string to template.file
  fs.writeFileSync(
    path.join(__dirname, "template.file"),
    templateString,
    "utf8"
  );

  res.status(200).json({ message: "Endpoint 2: Files saved successfully." });
});

const uploadBoth = multer({ dest: "uploads/" }).fields([
  { name: "src", maxCount: 1 },
  { name: "template", maxCount: 1 },
]);
// Endpoint 4: Accepts both src and template as files
converter.post("/endpoint-4", (req, res) => {
  if (!req.files || !req.files["src"] || !req.files["template"]) {
    return res.status(400).json({ message: "Missing src or template file" });
  }

  // Process src file
  const srcFile = req.files["src"][0];
  const srcContent = fs.readFileSync(srcFile.path, "utf8");
  try {
    const jsonData = JSON.parse(srcContent);
    fs.writeFileSync(
      path.join(__dirname, "src.json"),
      JSON.stringify(jsonData, null, 2),
      "utf8"
    );
  } catch (error) {
    fs.writeFileSync(path.join(__dirname, "src.json"), srcContent, "utf8");
  }

  // Process template file
  const templateFile = req.files["template"][0];
  const templateContent = fs.readFileSync(templateFile.path, "utf8");
  fs.writeFileSync(
    path.join(__dirname, "template.file"),
    templateContent,
    "utf8"
  );

  res.status(200).json({ message: "Endpoint 3: Files saved successfully." });
});

module.exports = { converter };
