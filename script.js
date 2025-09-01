document.addEventListener("DOMContentLoaded", function () {
	if (document.getElementById("initial-form")) {
		document
			.getElementById("initial-form")
			.addEventListener("submit", function (event) {
				event.preventDefault();
				nextButton();
			});
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
	}
});

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
            <td><input type="text" id="prev-${label}" required></td>
            <td><input type="text" id="curr-${label}" required></td>
            `;
		table.appendChild(row);
	}

    if (diffValues.length > 0) {
        for (let i = 0; i < subCount; i++) {
            const label = String.fromCharCode(65 + i);
		
            document.getElementById(`result-${label}`).value = diffValues[i] || 0;
	    }
        
    }
}

function resultRows() {
	const subCount = parseInt(localStorage.getItem("sub")) || 1;
	const table = document.getElementById("summary-table");

	for (let i = 0; i < subCount; i++) {
		const label = String.fromCharCode(65 + i);

		const row = document.createElement("tr");
		row.innerHTML = `
            <td>${label}</td>
            <td><input type="text" id="result-${label}"></td>
            `;
		table.appendChild(row);
	}
}

function computeBill() {
	const totalBill = parseFloat(localStorage.getItem("bill"));
	const kwh = parseFloat(localStorage.getItem("kwh"));
	const subCount = parseInt(localStorage.getItem("sub")) || 1;

	const rateKWH = totalBill / kwh;

    const diffValues = [];

	for (let i = 0; i < subCount; i++) {
		const label = String.fromCharCode(65 + i);

        const prev = parseFloat(document.getElementById(`prev-${label}`).value) || 0;
        const curr = parseFloat(document.getElementById(`curr-${label}`).value) || 0;

        let diff = curr - prev;
        diff = parseFloat(diff.toFixed(2));

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

    localStorage.setItem("diffValues", JSON.stringify(diffValues));
    localStorage.setItem("totalValues", JSON.stringify(totalValues));
}
