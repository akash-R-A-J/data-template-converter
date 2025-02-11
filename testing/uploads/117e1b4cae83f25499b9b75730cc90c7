Company: ${company.name}
Location: ${company.location}

Departments:
<#list company.departments as department>
  - ${department.name}
  
  Employees:
  <#list department.employees as employee>
    * ID: ${employee.id}
      Name: ${employee.name}
      Designation: ${employee.designation}
      Skills: <#list employee.skills as skill>${skill}<#if skill_has_next>, </#if></#list>
      
      Projects:
      <#list employee.projects as project>
        - ${project.name} (${project.status})
      </#list>
  </#list>
</#list>
