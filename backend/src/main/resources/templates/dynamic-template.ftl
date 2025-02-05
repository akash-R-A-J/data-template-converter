<html>
<head>
    <title>Dynamic JSON to HTML</title>
    <style>
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid black; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        ul { padding-left: 20px; }
    </style>
</head>
<body>

<h2>JSON Data in HTML</h2>

<#macro renderObject obj>
<table>
    <#list obj?keys as key>
        <tr>
            <th>${key}</th>
            <td>
                <#if obj[key]??>
                    <#if obj[key] is number>
                        ${obj[key]}
                    <#elseif obj[key] is boolean>
                        ${obj[key]?c}
                    <#elseif obj[key] is sequence>
                        <ul>
                        <#list obj[key] as item>
                            <li>
                                <#if item?is_hash>
                                    <@renderObject item />
                                <#else>
                                    ${item}
                                </#if>
                            </li>
                        </#list>
                        </ul>
                    <#elseif obj[key] is hash>
                        <@renderObject obj[key] />
                    <#else>
                        ${obj[key]}
                    </#if>
                </#if>
            </td>
        </tr>
    </#list>
</table>
</#macro>

<@renderObject data />

</body>
</html>
