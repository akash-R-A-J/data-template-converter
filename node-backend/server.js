const express = require("express");
const multer = require("multer");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Multer setup for handling file uploads
const upload = multer({ dest: "uploads/" });

// Endpoint-1: Both src and template are strings
app.post("/api/endpoint-1", (req, res) => {
    const { src, template } = req.body;
    console.log("Received String:", { src, template });
    res.json({ message: "Processed string-string input", data: { src, template } });
});

// Endpoint-2: src is file, template is string
app.post("/api/endpoint-2", upload.single("src"), (req, res) => {
    console.log("Received File for src, String for template");
    res.json({
        message: "Processed file-string input",
        file: req.file,
        template: req.body.template
    });
});

// Endpoint-3: src is string, template is file
app.post("/api/endpoint-3", upload.single("template"), (req, res) => {
    console.log("Received String for src, File for template");
    res.json({
        message: "Processed string-file input",
        src: req.body.src,
        file: req.file
    });
});

// Endpoint-4: Both src and template are files
app.post("/api/endpoint-4", upload.fields([{ name: "src" }, { name: "template" }]), (req, res) => {
    console.log("Received Files for both src and template");
    res.json({
        message: "Processed file-file input",
        srcFile: req.files["src"][0],
        templateFile: req.files["template"][0]
    });
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
