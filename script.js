document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("initial-form")) {
        document
            .getElementById("initial-form")
            .addEventListener("submit", function (event) {
                event.preventDefault();
                nextButton();
            });

        document
            .getElementById("clear-button")
            .addEventListener("click", clearFields);
    }

    if (document.getElementById("bill-form")) {
        submeterRows();
        resultRows();

        document
            .getElementById("bill-form")
            .addEventListener("submit", function (event) {
                event.preventDefault();
                computeBill();
            });

        // onclick (not addEventListener) so the Edit/Cancel toggle replaces the handler
        document.getElementById("edit-button").onclick = editName;
    }
});

function restrictToNumbers(event) {
    const pattern = /[0-9.]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
        event.preventDefault();
    }
}

function clearFields() {
    document.getElementById("total-bill").value = "";
    document.getElementById("kwh").value = "";
    document.getElementById("submeter").value = 1;
    document.getElementById("split").value = "equal";
}

function nextButton() {
    let totalBill = document.getElementById("total-bill").value;
    let kilowatt = document.getElementById("kwh").value;
    let submeter = document.getElementById("submeter").value;
    let split = document.getElementById("split").value;

    localStorage.setItem("bill", totalBill);
    localStorage.setItem("kwh", kilowatt);
    localStorage.setItem("sub", submeter);
    localStorage.setItem("split", split);

    window.location.href = "compute.html";
}

function submeterRows() {
    const subCount = parseInt(localStorage.getItem("sub")) || 1;
    const table = document.getElementById("bill-table");

    for (let i = 0; i < subCount; i++) {
        const label = String.fromCharCode(65 + i);

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${label}</td>
            <td><input type="number" id="prev-${label}" onkeypress="restrictToNumbers(event)" required step="any" min="0"></td>
            <td><input type="number" id="curr-${label}" onkeypress="restrictToNumbers(event)" required step="any" min="0"></td>
            `;
        table.appendChild(row);
    }
}

function resultRows() {
    const subCount = parseInt(localStorage.getItem("sub")) || 1;
    const table = document.getElementById("summary-table");

    for (let i = 0; i < subCount; i++) {
        const label = String.fromCharCode(65 + i);

        const row = document.createElement("tr");
        row.innerHTML = `
            <td><span id="label-${label}">${label}</span></td>
            <td><input type="text" id="kwh-${label}" disabled></td>
            <td><input type="text" id="result-${label}" disabled></td>
            `;
        table.appendChild(row);
    }
}

function showError(message) {
    const error = document.getElementById("error-msg");
    error.textContent = message;
    error.style.display = message ? "block" : "none";
}

function formatPeso(value) {
    return "₱" + value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function computeBill() {
    const result = document.getElementById("div-result");

    const totalBill = parseFloat(localStorage.getItem("bill"));
    const kwh = parseFloat(localStorage.getItem("kwh"));
    const subCount = parseInt(localStorage.getItem("sub")) || 1;
    const split = localStorage.getItem("split") || "equal";

    if (!(totalBill > 0) || !(kwh > 0)) {
        showError("Total Bill and kWh must be greater than 0. Go back and re-enter them.");
        return;
    }

    const rateKWH = totalBill / kwh;

    const diffValues = [];
    let diffSum = 0;

    for (let i = 0; i < subCount; i++) {
        const label = String.fromCharCode(65 + i);

        const prev = parseFloat(document.getElementById(`prev-${label}`).value) || 0;
        const curr = parseFloat(document.getElementById(`curr-${label}`).value) || 0;

        if (curr < prev) {
            showError(`Submeter ${label}: current reading is lower than the previous reading.`);
            return;
        }

        let diff = curr - prev;
        diffSum += diff;

        diffValues.push(diff);
    }

    showError("");

    // kWh recorded by the main meter but not by any submeter (common areas, losses)
    const unaccounted = kwh - diffSum;

    // Billed kWh per submeter: own usage plus a share of the unaccounted kWh
    const billedKwh = diffValues.map(function (diff) {
        if (split === "proportional" && diffSum > 0) {
            return diff + unaccounted * (diff / diffSum);
        }
        return diff + unaccounted / subCount;
    });

    // Work in centavos and give the rounding remainder to the biggest user,
    // so the amounts always add up exactly to the total bill
    const cents = billedKwh.map((b) => Math.round(b * rateKWH * 100));
    const remainder = Math.round(totalBill * 100) - cents.reduce((a, b) => a + b, 0);
    const biggest = billedKwh.indexOf(Math.max(...billedKwh));
    cents[biggest] += remainder;

    for (let i = 0; i < subCount; i++) {
        const label = String.fromCharCode(65 + i);

        document.getElementById(`kwh-${label}`).value = billedKwh[i].toFixed(2);
        document.getElementById(`result-${label}`).value = formatPeso(cents[i] / 100);
    }

    const splitText = split === "proportional" ? "split by usage" : "split equally";
    let details = `Rate: ${formatPeso(rateKWH)}/kWh · Submeters: ${diffSum.toFixed(2)} kWh · ` +
        `Unaccounted: ${unaccounted.toFixed(2)} kWh (${splitText})`;
    if (unaccounted < 0) {
        details += " ⚠ Submeters read more than the main meter. Please double-check the readings.";
    }
    document.getElementById("summary-details").textContent = details;

    const summaryHeader = document.getElementById('summary-header');
    if (summaryHeader) {
        const date = new Date();
        const month = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();
        summaryHeader.textContent = `${month} ${year} Bill Summary`;
    }
    result.style.visibility = "visible";
}

function editName() {
    const subCount = parseInt(localStorage.getItem("sub")) || 1;
    for (let i = 0; i < subCount; i++) {
        const label = String.fromCharCode(65 + i);
        const labelSpan = document.getElementById(`label-${label}`);

        const input = document.createElement("input");
        input.type = "text";
        input.id = `edit-label-${label}`;
        input.maxLength = 15;
        input.value = labelSpan.textContent;
        input.dataset.original = labelSpan.textContent;
        labelSpan.replaceWith(input);
    }

    const editButton = document.getElementById("edit-button");
    editButton.innerText = "Cancel";
    editButton.onclick = cancelEdit;

    const okButton = document.createElement("button");
    okButton.innerText = "OK";
    okButton.id = "ok-button";
    okButton.type = "button";
    okButton.onclick = saveEdit;
    editButton.parentNode.appendChild(okButton);
}

function finishEdit(keepNewNames) {
    const subCount = parseInt(localStorage.getItem("sub")) || 1;
    for (let i = 0; i < subCount; i++) {
        const label = String.fromCharCode(65 + i);
        const editInput = document.getElementById(`edit-label-${label}`);

        const span = document.createElement("span");
        span.id = `label-${label}`;
        span.textContent = keepNewNames
            ? editInput.value.trim() || editInput.dataset.original
            : editInput.dataset.original;
        editInput.replaceWith(span);
    }

    const okButton = document.getElementById("ok-button");
    if (okButton) {
        okButton.remove();
    }

    const editButton = document.getElementById("edit-button");
    editButton.innerText = "Edit";
    editButton.onclick = editName;
}

function saveEdit() {
    finishEdit(true);
}

function cancelEdit() {
    finishEdit(false);
}

function confirmBack() {
    if (confirm("Going back will delete the entered data. Are you sure?")) {
        history.back();
    }
}
