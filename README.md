# **Data Transformation Application**

## **Overview**
This application allows users to input data in different formats (JSON, XML, SOAP, CSV) along with a template, then transforms the data using a backend processing system. The transformation follows a structured workflow using a **Node.js backend** to handle input conversion and a **Spring Boot backend** for processing templates.

## **Features**
- Supports **JSON, XML, SOAP, and CSV** as source input.
- Accepts **templates as text or files**.
- Uses **Spring Boot with FreeMarker** for template processing.
- Provides a **REST API** for seamless integration.
- Displays the processed output to the user.

## **Architecture**
```
[Frontend]
    |
    |--> User inputs (src & template)
    |--> Sends data to Node.js backend
    |
[Node.js Backend]
    |
    |--> Converts src input to JSON (if needed)
    |--> Sends JSON & template to Spring Boot backend
    |
[Spring Boot Backend]
    |
    |--> Validates & processes data using FreeMarker
    |--> Returns processed output
    |
[Node.js Backend]
    |
    |--> Handles response & sends to frontend
    |
[Frontend]
    |
    |--> Displays final output
```

## **Technologies Used**
- **Frontend:** JavaScript (HTML/CSS/JS)
- **Backend:** Node.js (Express) & Spring Boot
- **Libraries & Tools:**
  - Multer (Node.js) for file uploads
  - xml2js & csv-parser for data conversion
  - Axios for HTTP requests
  - FreeMarker for template processing
  
## **Installation & Setup**

### **1. Clone the repository**
```sh
git clone https://github.com/your-repo/data-transform-app.git
cd data-transform-app
```

### **2. Install Dependencies**
#### **Node.js Backend**
```sh
cd testing
npm install
```

#### **Spring Boot Backend**
```sh
cd backend
mvn clean install
```

### **3. Run the Application**
#### **Start Node.js Backend**
```sh
cd testing
node server.js
```

#### **Start Spring Boot Backend**
```sh
cd backend
mvn spring-boot:run
```

### **4. Open Frontend**
- Open `index.html` in a browser or serve it using a local server.

## **Usage**
1. **Provide Input:** Enter text or upload a file for `src` and `template`.
2. **Click Transform:** The backend will process the input.
3. **View Output:** The transformed data appears on the frontend.

## **Error Handling**
- **Frontend:** Ensures both `src` and `template` are provided before sending.
- **Node.js Backend:**
  - Checks for missing input.
  - Converts input to JSON if necessary.
- **Spring Boot Backend:**
  - Validates JSON & template format.
  - Catches template processing errors.

## **Contributing**
1. Fork the repository.
2. Create a new branch (`feature-branch`).
3. Commit your changes.
4. Push to your fork and submit a PR.

