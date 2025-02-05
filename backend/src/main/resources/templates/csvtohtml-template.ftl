<!DOCTYPE html>
<html>
<head>
    <title>CSV to HTML</title>
    <style>
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid black; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h2>CSV Data</h2>
    <table>
        <thead>
            <tr>
                <#list headers as header>
                    <th>${header}</th>
                </#list>
            </tr>
        </thead>
        <tbody>
            <#list rows as row>
                <tr>
                    <#list row as column>
                        <td>${column}</td>
                    </#list>
                </tr>
            </#list>
        </tbody>
    </table>
</body>
</html>
