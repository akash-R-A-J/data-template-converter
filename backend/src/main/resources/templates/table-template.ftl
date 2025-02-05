<#list data as key, value>
   <tr>
      <td>${key}</td>
      <td>
         <#if value?is_hash>
            <#list value as subkey, subvalue>
                ${subkey}: ${subvalue} <br>
            </#list>
         <#elseif value?is_sequence>
            <#list value as item>
                ${item} <br>
            </#list>
         <#else>
            ${value}
         </#if>
      </td>
   </tr>
</#list>
