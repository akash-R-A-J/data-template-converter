function sendDataToNodeBackend() {
  document
    .getElementById("submitBtn")
    .addEventListener("click", async function (e) {
      e.preventDefault();

      const srcText = document.getElementById("srcText").value.trim();
      const srcFile = document.getElementById("srcFile").files[0];
      const templateText = document.getElementById("templateText").value.trim();
      const templateFile = document.getElementById("templateFile").files[0];

      let formData = new FormData();
      let endpoint = "";
      let isSrcFile = !!srcFile;
      let isTemplateFile = !!templateFile;

      try {
        if (!isSrcFile && !isTemplateFile) {
          console.log("Both are strings");
          endpoint = "http://localhost:5000/api/endpoint-1";
          const data = { src: srcText, template: templateText };

          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          console.log(response.data);

          const result = await response.json();
          document.getElementById(
            "response"
          ).innerHTML = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
        } else if (isSrcFile && !isTemplateFile) {
          endpoint = "http://localhost:5000/api/endpoint-2";
          formData.append("src", srcFile);
          formData.append("template", templateText);
        } else if (!isSrcFile && isTemplateFile) {
          endpoint = "http://localhost:5000/api/endpoint-3";
          formData.append("src", srcText);
          formData.append("template", templateFile);
        } else {
          endpoint = "http://localhost:5000/api/endpoint-4";
          formData.append("src", srcFile);
          formData.append("template", templateFile);
        }

        if (endpoint !== "http://localhost:5000/api/endpoint-1") {
          const response = await fetch(endpoint, {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          const result = await response.json();
          console.log(response);
          document.getElementById(
            "response"
          ).innerHTML = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
        }
      } catch (error) {
        console.error("Error:", error);
        document.getElementById("response").textContent =
          "Error: " + error.message;
      }
    });
}
