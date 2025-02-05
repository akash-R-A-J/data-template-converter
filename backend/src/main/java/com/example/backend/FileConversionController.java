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
import java.util.Map;

@RestController
@RequestMapping("/convert")
public class FileConversionController {

    @Autowired
    private Configuration freemarkerConfig;

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

            System.out.println(processedOutput);

            // Return the processed output (without assuming it's HTML)
            return ResponseEntity.ok(processedOutput);

        } catch (IOException | TemplateException e) {
            System.out.println("error caught in controller");
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error processing the request: " + e.getMessage());
        }
    }
}
