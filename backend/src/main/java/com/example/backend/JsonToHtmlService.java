package com.example.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class JsonToHtmlService {

    @Autowired
    private Configuration freemarkerConfig;

    public Resource convertJsonToHtml(MultipartFile file, String templateName) throws IOException, TemplateException {
        // Step 1: Read JSON file and convert to Map
        ObjectMapper objectMapper = new ObjectMapper();
        Map<String, Object> data = objectMapper.readValue(file.getInputStream(), Map.class);

        System.out.println("Parsed JSON Data: " + data);

        // Step 2: Load FreeMarker Template
        Template template = freemarkerConfig.getTemplate(templateName);

        // Step 3: Generate HTML Output
        File outputFile = new File("output.html");
        FileWriter fileWriter = new FileWriter(outputFile);
        template.process(Map.of("data", convertToStrings(data)), fileWriter);
        fileWriter.close();

        System.out.println("OutputFile : " + outputFile);

        // Step 4: Return HTML File as Resource
        Path path = Paths.get(outputFile.getAbsolutePath());
        System.out.println("Path: " + path);
        return new UrlResource(path.toUri());
    }

    private Map<String, Object> convertToStrings(Map<String, Object> data) {
        return data.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> (e.getValue() instanceof String) ? e.getValue() : e.getValue().toString()));
    }

}
