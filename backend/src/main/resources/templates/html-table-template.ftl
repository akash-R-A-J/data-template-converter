<table border="1">
    <tr>
        <#list headers as header>
            <th>${header}</th>
        </#list>
    </tr>
    <#list rows as row>
        <tr>
            <#list row as cell>
                <td>${cell}</td>
            </#list>
        </tr>
    </#list>
</table>
