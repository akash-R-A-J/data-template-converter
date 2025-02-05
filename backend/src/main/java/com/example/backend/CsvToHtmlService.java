package com.example.backend;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvException;

import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.util.*;

@Service
public class CsvToHtmlService {
    private final Configuration freemarkerConfig;

    public CsvToHtmlService(Configuration freemarkerConfig) {
        this.freemarkerConfig = freemarkerConfig;
    }

    public String convertCsvToHtml(MultipartFile file, String templateName) throws IOException, TemplateException {
        // Read CSV file
        List<List<String>> rows = new ArrayList<>();
        List<String> headers = new ArrayList<>();

        File csvFile = File.createTempFile("uploaded", ".csv");
        file.transferTo(csvFile);

        try (CSVReader reader = new CSVReader(new FileReader(csvFile))) {
            List<String[]> data;
            try {
                data = reader.readAll();
            } catch (CsvException e) {
                throw new RuntimeException("Error reading CSV file: " + e.getMessage(), e);
            }

            if (!data.isEmpty()) {
                headers = Arrays.asList(data.get(0)); // assumin first row is headers
                for (int i = 1; i < data.size(); i++) {
                    rows.add(Arrays.asList(data.get(i)));
                }
            }
        }

        // Prepare model for FreeMarker
        Map<String, Object> model = new HashMap<>();
        model.put("headers", headers);
        model.put("rows", rows);

        // Process template
        Template template = freemarkerConfig.getTemplate(templateName);
        Writer out = new StringWriter();
        template.process(model, out);
        return out.toString();
    }
}
