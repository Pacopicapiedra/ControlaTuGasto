let datos = JSON.parse(localStorage.getItem("ctg_data")) || {
  modelo: "", kmInicio: "", registros: [], historico: [],
  ultimaRuedaDel: null, ultimaRuedaTra: null
};

const $ = (id) => document.getElementById(id);
function guardarDatos() {
  localStorage.setItem("ctg_data", JSON.stringify(datos));
}

function renderFormulario() {
  const tipo = $("tipo").value;
  let html = "";
  if (tipo === "combustible") {
    html += '<label>Kilómetros:<input type="number" id="km"/></label>';
    html += '<label>Litros:<input type="number" id="litros"/></label>';
    html += '<label>Coste (€):<input type="number" id="coste"/></label>';
  } else if (tipo === "mantenimiento" || tipo === "averia") {
    html += '<label>Kilómetros:<input type="number" id="km"/></label>';
    html += '<label>Coste (€):<input type="number" id="coste"/></label>';
    html += '<label>Concepto:<input type="text" id="detalle"/></label>';
  } else if (tipo === "neumatico") {
    html += '<label>Coste (€):<input type="number" id="coste"/></label>';
    html += '<label>Modelo del neumático:<input type="text" id="modeloNeumatico" /></label>';
    html += '<label>Km al montarse:<input type="number" id="kmMontaje" /></label>';
}
    html += '<label>Kilómetros:<input type="number" id="km"/></label>';
    html += '<label>Coste (€):<input type="number" id="coste"/></label>';
    html += '<label>Posición (delantero/traseiro):<input type="text" id="detalle"/></label>';
  } else if (tipo === "papeles") {
    html += '<label>Coste (€):<input type="number" id="coste"/></label>';
    html += '<label>Concepto:<input type="text" id="detalle"/></label>';
  }
  $("formulario").innerHTML = html;
}

function resetSeModeloCambia() {
  if ($("modelo").value !== datos.modelo || $("kmInicio").value !== datos.kmInicio) {
    if (datos.registros.length > 0) {
      datos.historico.push({
        modelo: datos.modelo,
        kmInicio: datos.kmInicio,
        registros: datos.registros
      });
    }
    datos.modelo = $("modelo").value;
    datos.kmInicio = $("kmInicio").value;
    datos.registros = [];
    datos.ultimaRuedaDel = null;
    datos.ultimaRuedaTra = null;
    guardarDatos();
    renderResumen();
  }
}

function guardarRegistro() {
  const tipo = $("tipo").value;
  const fecha = new Date().toISOString().split("T")[0];
  const r = {
    modeloNeumatico: $("modeloNeumatico")?.value || "",
    kmMontaje: $("kmMontaje")?.value || "",
    tipo,
    fecha,
    km: $("km")?.value || "",
    litros: $("litros")?.value || "",
    coste: $("coste")?.value || "",
    detalle: $("detalle")?.value || ""
  };
  datos.registros.push(r);

  if (tipo === "neumatico") {
    const km = parseFloat(r.km);
    const pos = r.detalle.toLowerCase();
    if (pos.includes("del")) datos.ultimaRuedaDel = km;
    if (pos.includes("tras")) datos.ultimaRuedaTra = km;
  }

  guardarDatos();
  renderResumen();
  $("formulario").innerHTML = "";
}

function renderResumen() {
  let html = "<h3>Resumo actual</h3>";
  let kmInicio = parseFloat(datos.kmInicio) || 0;
  let finalKm = kmInicio;
  let litros = 0;
  let combustible = 0;

  datos.registros.forEach(r => {
    const km = parseFloat(r.km || "0");
    if (r.tipo === "combustible") {
      litros += parseFloat(r.litros || 0);
      combustible += parseFloat(r.coste || 0);
      if (km > finalKm) finalKm = km;
    } else {
      if (km > finalKm) finalKm = km;
    }
  });

  const kmRecorridos = finalKm - kmInicio;
  const l100 = kmRecorridos > 0 ? (litros / kmRecorridos) * 100 : 0;
  const costeKm = kmRecorridos > 0 ? combustible / kmRecorridos : 0;
  const coste100 = costeKm * 100;

  // Neumáticos
  let del = datos.ultimaRuedaDel !== null ? finalKm - datos.ultimaRuedaDel : "—";
  let tra = datos.ultimaRuedaTra !== null ? finalKm - datos.ultimaRuedaTra : "—";

  html += `<p>KM recorridos: ${kmRecorridos}</p>`;
  html += `<p>Litros: ${litros.toFixed(2)} L</p>`;
  html += `<p>Coste combustible: ${combustible.toFixed(2)} €</p>`;
  html += `<p>Media litros/100km: ${l100.toFixed(2)}</p>`;
  html += `<p>Coste medio/km combustible: ${costeKm.toFixed(3)} €</p>`;
  html += `<p>Coste medio cada 100 km: ${coste100.toFixed(2)} €</p>`;
  html += `<p>KM con neumáticos dianteiros: ${del}</p>`;
  html += `<p>KM con neumáticos traseiros: ${tra}</p>`;

  
  const gastoTotal = datos.registros.reduce((acc, r) => acc + parseFloat(r.coste || 0), 0);
  const gastoKm = kmRecorridos > 0 ? gastoTotal / kmRecorridos : 0;
  const gasto100 = gastoKm * 100;

  html += `<p><strong>💶 Gasto total:</strong> ${gastoTotal.toFixed(2)} €</p>`;
  html += `<p><strong>💶 Gasto total por km:</strong> ${gastoKm.toFixed(3)} €/km</p>`;
  html += `<p><strong>💶 Gasto total cada 100 km:</strong> ${gasto100.toFixed(2)} €/100km</p>`;

  $("resumen").innerHTML = html;

  let lista = "<h4>📋 Rexistros gardados:</h4>";
  datos.registros.slice().reverse().forEach(r => {
    lista += `<p>📅 ${r.fecha} - ${r.tipo} - ${r.km || "—"} km - ${r.litros || "—"} L - ${r.coste || "—"} € - ${r.detalle || ""}</p>`;
  });
  document.getElementById("registros").innerHTML = lista;

}

function exportarExcel() {
  if (typeof XLSX === 'undefined') return alert("Falta librería Excel");
  const ws = XLSX.utils.json_to_sheet(datos.registros);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Registros");
  XLSX.writeFile(wb, "ControlaTuGasto.xlsx");
}

$("tipo").addEventListener("change", renderFormulario);
$("guardar").addEventListener("click", guardarRegistro);
$("exportar").addEventListener("click", exportarExcel);
$("modelo").addEventListener("change", resetSeModeloCambia);
$("kmInicio").addEventListener("change", resetSeModeloCambia);
$("modelo").value = datos.modelo;
$("kmInicio").value = datos.kmInicio;
renderFormulario();
renderResumen();