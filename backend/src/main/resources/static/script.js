async function sendDataToBackend() {
    // Get the values from the input fields
    const sourceData = document.getElementById("sourceData").value;
    const template = document.getElementById("template").value;
    // const srcFile = document.getElementById("src").files[0];
    // const templateFile = document.getElementById("templateFile").files[0];
    
    // Prepare the data to be sent in the request body
    const data = {
        sourceData: sourceData,
        template: template
    };

    try {
        const response = await fetch('http://localhost:3500/text-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Indicating the request body is JSON
            },
            body: JSON.stringify(data), // Convert the data object to JSON
        });

        console.log("received response from the backend!");
        console.log(response.data);
        // Check if the response is successful
        // if (response.ok) {
        //     const result = await response.json(); // Assuming the backend returns a JSON response
        //     console.log('Response from server:', result);
        // } else {
        //     console.error('Error:', response.status, response.statusText);
        // }
    } catch (error) {
        console.error('Error sending data to backend:', error);
    }
}


// async function sendDataToBackend() {
//     const sourceData = document.getElementById("sourceData").value;
//     const template = document.getElementById("template").value;
//     // const srcFile = document.getElementById("src").files[0];
//     // const templateFile = document.getElementById("templateFile").files[0];

//     const formData = new FormData();
//     formData.append("sourceData", sourceData);
//     formData.append("template", template);
//     // if (srcFile) formData.append("src", srcFile);
//     // if (templateFile) formData.append("templateFile", templateFile);

//     try {
//         const response = await fetch('http://localhost:3500/text-data', {
//             method: 'POST',
//             body: formData,
//         });

//         // Check if the response is successful
//         if (!response.ok) {
//             throw new Error(`Server responded with status: ${response.status}`);
//         }

//         const result = await response.json(); // Parse JSON if response is successful
//         console.log("Response from server:", result);
//     } catch (error) {
//         console.error("Error sending data to backend:", error);
//     }
// }
