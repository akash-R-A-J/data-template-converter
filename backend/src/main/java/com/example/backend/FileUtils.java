package com.example.backend;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvException;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.List;

public class FileUtils {

    public static String convertCsvToJsonString(MultipartFile file) throws IOException {
        // Create an InputStreamReader from the uploaded file
        InputStreamReader reader = new InputStreamReader(file.getInputStream());
        // Create a CSVReader to read the content of the file
        CSVReader csvReader = new CSVReader(reader);
        System.out.println("\n2. converting csv to json.\n");

        try {
            // Read all lines from the CSV file into a List of String arrays
            List<String[]> lines = csvReader.readAll();
            System.out.println("3. -----------------------------");
            System.out.println(lines);
            System.out.println("-----------------------------");

            // Now, convert lines into a JSON structure
            return convertRowsToJson(lines);
        } catch (CsvException e) {
            // Handle CSV reading error here, possibly log it or rethrow as IOException
            throw new IOException("Error while processing CSV file", e);
        } finally {
            try {
                // Close the reader and CSVReader
                csvReader.close();
                reader.close();
            } catch (IOException e) {
                // Log or handle the closing exception if needed
                e.printStackTrace();
            }
        }
    }

    private static String convertRowsToJson(List<String[]> rows) {
        // Example: convert the list of rows into a JSON format using a library like
        // Jackson
        System.out.println("\n4. converting rows to json.\n");
        try {
            // Assuming you have Jackson's ObjectMapper available
            ObjectMapper objectMapper = new ObjectMapper();
            String jsonRowsString = objectMapper.writeValueAsString(rows);
            System.out.println("\n5. jsonrowstring\n");
            System.out.println(jsonRowsString);
            return jsonRowsString;

        } catch (JsonProcessingException e) {
            e.printStackTrace();
            return null;
        }
    }
}
