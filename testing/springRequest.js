// input-> json object, template string
// output-> string
async function sendTemplateRequest(jsonData, templateString) {
  try {
    const response = await axios.post(
      "http://localhost:8080/convert/process-template-2",
      {
        jsonData: jsonData,
        templateString: templateString,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    console.log("Processed Output:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
  }
}

// Example usage:
// const jsonData = {
//     name: "Alice",
//     age: 25
//   };

//   const templateString = "Hello, ${name}. You are ${age} years old.";

//   sendTemplateRequest(jsonData, templateString);

// EXAMPLE-2
// {
//     "jsonData": {
//       "key1": "value1",
//       "key2": 123,
//       "key3": true
//     },
//     "templateString": "This is an example: ${key1}, number: ${key2}, boolean: ${key3}."
//   }

module.exports = sendTemplateRequest;
