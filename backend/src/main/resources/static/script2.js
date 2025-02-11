function sendDataToNodeBackend() {
  document
    .getElementById("submitBtn")
    .addEventListener("click", async function () {
      const srcInput = document.getElementById("srcInput");
      const templateInput = document.getElementById("templateInput");

      let formData = new FormData();
      let endpoint = "";

      const isSrcFile = srcInput.files.length > 0;
      const isTemplateFile = templateInput.files.length > 0;

      if (!isSrcFile && !isTemplateFile) {
        // Both are strings
        endpoint = "/api/endpoint-1";
        const data = {
          src: srcInput.value,
          template: templateInput.value,
        };

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();
        console.log("Response:", result);
      } else if (isSrcFile && !isTemplateFile) {
        // src is a file, template is a string
        endpoint = "/api/endpoint-2";
        formData.append("src", srcInput.files[0]);
        formData.append("template", templateInput.value);
      } else if (!isSrcFile && isTemplateFile) {
        // src is a string, template is a file
        endpoint = "/api/endpoint-3";
        formData.append("src", srcInput.value);
        formData.append("template", templateInput.files[0]);
      } else {
        // Both are files
        endpoint = "/api/endpoint-4";
        formData.append("src", srcInput.files[0]);
        formData.append("template", templateInput.files[0]);
      }

      if (endpoint !== "/api/endpoint-1") {
        // Send FormData request if any input is a file
        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        console.log("Response:", result);
      }
    });
}
