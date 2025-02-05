<#-- Template Example -->
<html>
<head>
    <title>Converted Template</title>
</head>
<body>
    <h1>Data from JSON</h1>
    <ul>
        <#list data as item>
            <li>${item.key}: ${item.value}</li>
        </#list>
    </ul>
</body>
</html>
