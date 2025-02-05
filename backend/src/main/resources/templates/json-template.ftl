{
    "data": [
        <#list rows as row>
        {
            <#list headers as header>
            "${header}": "${row[headers?index_of(header)]}"<#if header_has_next>,</#if>
            </#list>
        }<#if row_has_next>,</#if>
        </#list>
    ]
}
