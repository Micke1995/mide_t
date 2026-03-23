const container_lec = document.getElementById("lect_cont");

latestMessages?.forEach(item => {

    let statusColor = "success";
    if (item.response_status >= 400) statusColor = "danger";
    if (item.response_status == 401) statusColor = "warning";
    if (item.response_status >= 405) statusColor = "danger";

    let methodColor = "primary";
    if (item.method === "GET") methodColor = "secondary";
    if (item.method === "POST") methodColor = "primary";
    if (item.method === "PUT") methodColor = "warning";
    if (item.method === "DELETE") methodColor = "danger";

    let card = document.createElement("div");
    card.className = "card shadow-sm m-2";
    card.style.width = "22rem";
    card.style.borderRadius = "12px";

    card.innerHTML = `
        <div class="card-header d-flex justify-content-between align-items-center">
            <span class="badge bg-${methodColor}">
                ${item.method}
            </span>
            <span class="badge bg-${statusColor}">
                ${item.response_status || 200}
            </span>
        </div>

        <div class="card-body">
            <h6 class="card-subtitle mb-2 text-muted">
                Origen: ${item.ip_address}
            </h6>

            <p class="card-text">
               <small><strong>Fecha:</strong> ${item.created_at}</small>
            </p>

            <div style="
                padding:8px;
                border-radius:6px;
                font-family: monospace;
                font-size:12px;
                max-height:120px;
                overflow:auto;
            ">
                ${item.body ? item.body.substring(0,300) : "Sin cuerpo"}
            </div>
        </div>
    `;

    container_lec.appendChild(card);
});
