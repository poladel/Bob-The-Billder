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

        document
            .getElementById("edit-button")
            .addEventListener("click", editName);
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
}

function nextButton() {
    let totalBill = document.getElementById("total-bill").value;
    let kilowatt = document.getElementById("kwh").value;
    let submeter = document.getElementById("submeter").value;

    localStorage.setItem("bill", totalBill);
    localStorage.setItem("kwh", kilowatt);
    localStorage.setItem("sub", submeter);

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
            <td><input type="number" id="prev-${label}" onkeypress="restrictToNumbers(event)" required></td>
            <td><input type="number" id="curr-${label}" onkeypress="restrictToNumbers(event)" required></td>
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
            <td><input type="text" id="result-${label}" disabled></td>
            `;
        table.appendChild(row);
    }
}

function computeBill() {
    const result = document.getElementById("div-result");

    const totalBill = parseFloat(localStorage.getItem("bill"));
    const kwh = parseFloat(localStorage.getItem("kwh"));
    const subCount = parseInt(localStorage.getItem("sub")) || 1;

    const rateKWH = totalBill / kwh;

    const diffValues = [];
    let diffSum = 0;

    for (let i = 0; i < subCount; i++) {
        const label = String.fromCharCode(65 + i);

        const prev = parseFloat(document.getElementById(`prev-${label}`).value) || 0;
        const curr = parseFloat(document.getElementById(`curr-${label}`).value) || 0;

        let diff = curr - prev;
        diffSum += diff;

        diffValues.push(diff);
    }

    let sum = 0;
    for (let i = 0; i < subCount; i++) {
        sum += diffValues[i];
    }

    let perSub = (kwh - sum) / subCount;

    let totalValues = [];

    for (let i = 0; i < subCount; i++) {
        const label = String.fromCharCode(65 + i);

        let subtotal = (diffValues[i] + perSub) * rateKWH;
        subtotal = parseFloat(subtotal.toFixed(2));

        totalValues.push(subtotal);
        
        document.getElementById(`result-${label}`).value = totalValues[i];
    }

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
        const currentLabel = labelSpan.innerText;

        labelSpan.outerHTML = `<input type="text" id="edit-label-${label}" value="${currentLabel}" maxlength="15">`;
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

function saveEdit() {
    const subCount = parseInt(localStorage.getItem("sub")) || 1;
    for (let i = 0; i < subCount; i++) {
        const label = String.fromCharCode(65 + i);
        const editInput = document.getElementById(`edit-label-${label}`);
        const newLabel = editInput.value;

        const row = editInput.parentNode;
        row.innerHTML = `
            <td><span id="label-${newLabel}">${newLabel}</span></td>
            `;
    }

    const okButton = document.getElementById("ok-button");
    okButton.remove();

    const editButton = document.getElementById("edit-button");
    editButton.innerText = "Edit";
    editButton.onclick = editName;
}

function cancelEdit() {
    const subCount = parseInt(localStorage.getItem("sub")) || 1;
    for (let i = 0; i < subCount; i++) {
        const label = String.fromCharCode(65 + i);
        const editInput = document.getElementById(`edit-label-${label}`);
        const originalLabel = String.fromCharCode(65 + i);

        const row = editInput.parentNode;
        row.innerHTML = `
            <td><span id="label-${originalLabel}">${originalLabel}</span></td>
            `;
    }

    const okButton = document.getElementById("ok-button");
    if (okButton) {
        okButton.remove();
    }

    const editButton = document.getElementById("edit-button");
    editButton.innerText = "Edit";
    editButton.onclick = editName;
}

function confirmBack() {
    if (confirm("Going back will delete the entered data. Are you sure?")) {
        history.back();
    }
}
