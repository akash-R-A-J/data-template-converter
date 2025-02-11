package com.example.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.freemarker.FreeMarkerTemplateUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.StringReader;
import java.util.Map;

@RestController
@RequestMapping("/convert")
public class FileConversionController {

    @Autowired
    private Configuration freemarkerConfig;

    // we can convert json data of type Map<string, object> into the given template
    // of type string using

    @CrossOrigin(origins = "*") // Add the appropriate origin
    @PostMapping(value = "/process-template", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> processTemplate(
            @RequestParam("jsonFile") MultipartFile jsonFile,
            @RequestParam("templateFile") MultipartFile templateFile) {

        System.out.println("Received JSON file: " + jsonFile.getOriginalFilename());
        System.out.println("Received template file: " + templateFile.getOriginalFilename());
        System.out.println("Converting data into given template");
        try {
            // Convert JSON file into a Map
            ObjectMapper objectMapper = new ObjectMapper();
            Map<String, Object> jsonData = objectMapper.readValue(jsonFile.getInputStream(), Map.class);

            // Read and compile FreeMarker template
            Template template = new Template("uploaded_template",
                    new InputStreamReader(templateFile.getInputStream()), freemarkerConfig);

            // Process the template with JSON data
            String processedOutput = FreeMarkerTemplateUtils.processTemplateIntoString(template, jsonData);
            // template -> string, jsonData -> Map<string, object>

            System.out.println(processedOutput);

            // Return the processed output (without assuming it's HTML)
            return ResponseEntity.ok(processedOutput);

        } catch (IOException | TemplateException e) {
            System.out.println("error caught in controller");
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error processing the request: " + e.getMessage());
        }
    }

    // accept Map<string, object> :
    // {
    // "jsonData" : jsonData,
    // "templateString" : templateString
    // }

    @PostMapping(value = "/process-template-2", consumes = "application/json")
    public ResponseEntity<String> processTemplate(
            @RequestBody Map<String, Object> requestData) {

        try {
            // Extract JSON data and template from request
            Map<String, Object> jsonData = (Map<String, Object>) requestData.get("jsonData");
            String templateString = (String) requestData.get("templateString");

            System.out.println("jsonData : " + jsonData);
            System.out.println("templatestring : " + templateString);

            if (jsonData == null || templateString == null) {
                return ResponseEntity.badRequest().body("Missing jsonData or templateString in request.");
            }

            // Create FreeMarker template from string
            Template template = new Template("input_template", new StringReader(templateString), freemarkerConfig);

            // Process template with JSON data
            String processedOutput = FreeMarkerTemplateUtils.processTemplateIntoString(template, jsonData);

            System.out.println("Spring-boot result: " + processedOutput);

            return ResponseEntity.ok(processedOutput);

        } catch (TemplateException | IllegalArgumentException e) {
            return ResponseEntity.status(500).body("Template processing error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error processing the request: " + e.getMessage());
        }
    }

    @PostMapping("/validate/ftl")
    public ResponseEntity<Boolean> validateFTL(@RequestBody Map<String, String> requestBody) {
        String ftlString = requestBody.get("ftlString");

        if (ftlString == null || ftlString.isEmpty()) {
            return ResponseEntity.badRequest().body(false);
        }

        try {
            // Try compiling the FTL string
            Template template = new Template("testTemplate", new StringReader(ftlString), freemarkerConfig);

            // If no exception is thrown, the FTL string is valid
            return ResponseEntity.ok(true); // Valid FTL
        } catch (Exception e) {
            // If an exception occurs, the FTL string is invalid
            return ResponseEntity.ok(false); // Invalid FTL
        }
    }
}
