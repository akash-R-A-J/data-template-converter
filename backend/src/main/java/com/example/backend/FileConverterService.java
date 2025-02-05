package com.example.backend;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvException;
import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.util.*;

@Service
public class FileConverterService {

    private final Configuration freemarkerConfig;

    public FileConverterService(Configuration freemarkerConfig) {
        this.freemarkerConfig = freemarkerConfig;
    }

    public String convertFile(MultipartFile file, String templateName)
            throws IOException, TemplateException, CsvException {

        String fileType = detectFileType(file.getOriginalFilename()); // Auto-detect file type
        Map<String, Object> dataModel = parseFile(file, fileType); // Convert input into standard format
        return generateOutput(templateName, dataModel); // Generate using the selected template
    }

    // returns the type of the file based on the extension of the file
    private String detectFileType(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            throw new IllegalArgumentException("Invalid file format");
        }
        String extension = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();

        return switch (extension) {
            case "csv" -> "csv";
            case "json" -> "json";
            case "xml" -> "xml";
            case "xls", "xlsx" -> "excel";
            case "yml", "yaml" -> "yaml";
            default -> throw new IllegalArgumentException("Unsupported file type: " + extension);
        };
    }

    // converts the file into Map<String, Object>
    private Map<String, Object> parseFile(MultipartFile file, String inputType) throws IOException, CsvException {
        Map<String, Object> dataModel = new HashMap<>();
        if ("csv".equalsIgnoreCase(inputType)) {
            dataModel = parseCsv(file);
        } else if ("json".equalsIgnoreCase(inputType)) {
            dataModel = parseJson(file);
        }
        return dataModel;
    }

    // converts CSV file into Map<String, Object>
    private Map<String, Object> parseCsv(MultipartFile file) throws IOException, CsvException {
        List<List<String>> rows = new ArrayList<>();
        List<String> headers = new ArrayList<>();

        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            List<String[]> data = reader.readAll();
            if (!data.isEmpty()) {
                headers = Arrays.asList(data.get(0)); // First row is headers
                for (int i = 1; i < data.size(); i++) {
                    rows.add(Arrays.asList(data.get(i)));
                }
            }
        }
        Map<String, Object> model = new HashMap<>();
        model.put("headers", headers);
        model.put("rows", rows);
        return model;
    }

    // converts JSON file into Map<String, Object>
    private Map<String, Object> parseJson(MultipartFile file) throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        return objectMapper.readValue(file.getInputStream(), HashMap.class);
    }

    // generates output based on the selected template and using Map<String, Object>
    private String generateOutput(String templateName, Map<String, Object> dataModel)
            throws IOException, TemplateException {
        Template template = freemarkerConfig.getTemplate(templateName);
        Writer out = new StringWriter();
        template.process(dataModel, out);
        return out.toString();
    }
}
