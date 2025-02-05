<!DOCTYPE html>
<html>
<head>
    <title>JSON to HTML</title>
    <style>
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid black; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h2>JSON Data</h2>
    <#macro renderJson data>
        <#if data?is_hash>
            <table>
                <tr>
                    <th>Key</th>
                    <th>Value</th>
                </tr>
                <#list data?keys as key>
                    <tr>
                        <td><b>${key}</b></td>
                        <td><@renderJson data[key] /></td>
                    </tr>
                </#list>
            </table>
        <#elseif data?is_sequence>
            <table>
                <tr>
                    <th>Index</th>
                    <th>Value</th>
                </tr>
                <#list data as item>
                    <tr>
                        <td>${item?index}</td>
                        <td><@renderJson item /></td>
                    </tr>
                </#list>
            </table>
        <#else>
            ${data}
        </#if>
    </#macro>
    
    <@renderJson data />
</body>
</html>
