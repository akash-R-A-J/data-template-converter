<h2>User Data</h2>
<p><strong>Name:</strong> ${user.name!"Unknown User"}</p>
<p><strong>Email:</strong> ${user.email!"No Email"}</p>
<p><strong>Last Login:</strong> ${user.lastLogin!"N/A"}</p>

<h3>Products:</h3>
<ul>
    <#if products??>
        <#list products as product>
            <li><strong>${product.name!"N/A"}</strong> - ${product.category!"Unknown"} ($${product.price!"0.00"})</li>
        </#list>
    <#else>
        <p>No products available.</p>
    </#if>
</ul>

<h3>Order History:</h3>
<#if orderHistory??>
    <#list orderHistory as order>
        <p>Order ID: ${order.orderId!"N/A"} (Status: ${order.status!"Pending"}, Total: $${order.total!"0.00"})</p>
    </#list>
<#else>
    <p>No order history available.</p>
</#if>

<h3>Recent Events:</h3>
<ul>
    <#if eventLogs??>
        <#list eventLogs as event>
            <li>${event.event!"No Event"} at ${event.timestamp!"Unknown Time"}</li>
        </#list>
    <#else>
        <p>No recent events.</p>
    </#if>
</ul>
