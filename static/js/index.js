var map = L.map('map').setView([lat, long], 16);
// L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var greenIcon = new L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})
var marker = L.marker([lat, long], { icon: greenIcon }).addTo(map);


function fetchLiveData1() {
  fetch(`/api/get_lecturas/?sistema=${nombre}`)
    .then(response => response.json())
    .then(data => {
      datos = data.datos
      if (datos['A']) {
        document.getElementById('voltage a').textContent = datos['A'].voltaje;
        document.getElementById('current a').textContent = datos['A'].corriente;
        document.getElementById('angle a').textContent = datos['A'].angulo;
        document.getElementById('power a').textContent = datos['A'].kwh;
        document.getElementById('last_lec a').textContent = new Date(datos['A'].tiempo).toLocaleString()
      }
      if (datos['B']) {
        document.getElementById('voltage b').textContent = datos['B'].voltaje;
        document.getElementById('current b').textContent = datos['B'].corriente;
        document.getElementById('angle b').textContent = datos['B'].angulo;
        document.getElementById('power b').textContent = datos['B'].kwh;
        document.getElementById('last_lec b').textContent = new Date(datos['B'].tiempo).toLocaleString();
      }
      if (datos['C']) {
        document.getElementById('voltage c').textContent = datos['C'].voltaje;
        document.getElementById('current c').textContent = datos['C'].corriente;
        document.getElementById('angle c').textContent = datos['C'].angulo;
        document.getElementById('power c').textContent = datos['C'].kwh;
        document.getElementById('last_lec c').textContent = new Date(datos['C'].tiempo).toLocaleString();

      }
    })
    .catch(error => console.error('Fetch error:', error));

}

setInterval(fetchLiveData1, 10000);
fetchLiveData1();

let chartA, chartB, chartC;

function calcularKW(v, i, angulo) {
  return (v * i * Math.cos(angulo * Math.PI / 180)) / 1000;
}

function procesarDatos(datosFase) {
  const seriesVoltajes = [];
  const seriesCorrientes = [];
  const seriesAngulos = [];
  const seriesKW = [];

  for (const item of datosFase.reverse()) {
    const t = new Date(item.tiempo).getTime(); // TIMESTAMP para Highstock
    // const t = item.tiempo
    seriesVoltajes.push([t, item.voltaje]);
    seriesCorrientes.push([t, item.corriente]);
    seriesAngulos.push([t, item.angulo]);
    seriesKW.push([t, item.kwh]);
    // seriesKW.push([t, calcularKW(item.voltaje, item.corriente, item.angulo)]);
  }

  return { seriesVoltajes, seriesCorrientes, seriesAngulos, seriesKW };
}

function actualizarGrafica(chart, datos, fase) {

  console.log(datos.seriesVoltajes)
  chart.update({
    title: { text: `Fase ${fase}` },
    series: [
      { name: 'Voltaje (V)', data: datos.seriesVoltajes },
      { name: 'Corriente (A)', data: datos.seriesCorrientes },
      { name: 'FP', data: datos.seriesAngulos },
      { name: 'Potencia (W)', data: datos.seriesKW }
    ]
  });

  // Enfocar al último día
  if (datos.seriesVoltajes.length > 0) {
    const ultimoTimestamp = datos.seriesVoltajes[datos.seriesVoltajes.length - 1][0];
    const primerTimestamp = ultimoTimestamp - 1 * 3600 * 1000; // 1h antes
    chart.xAxis[0].setExtremes(primerTimestamp, ultimoTimestamp);
  }
}

function crearGrafica(contenedor, titulo) {

  Highcharts.setOptions({
    time: {
      useUTC: false
    }
  });

  return Highcharts.stockChart(contenedor, {
    lang: { thousandsSep: ',' },
    chart: {
      type: 'spline',
      zooming: { type: 'x' }

    },
    title: { text: titulo },
    credits: {
      enabled: false
    },
    rangeSelector: {
      buttons: [
        { type: 'hour', count: 1, text: '1h' },
        { type: 'day', count: 1, text: '1d' },
        { type: 'all', text: 'Todo' }
      ],
      // selected: 0
    },
    xAxis: {
      type: "datetime"
    },
    yAxis: [
      {
        labels: { format: '{value} V' },
        title: { text: 'Voltaje' },
        opposite: false
      },
      {
        labels: { format: '{value} A' },
        title: { text: 'Corriente' },
        opposite: false
      },
      {
        max: 1, min: -1,
        labels: { format: '{value}' },
        title: { text: 'Factor de Potencia' },
        opposite: true
      },
      {
        labels: { format: '{value} W' },
        title: { text: 'Potencia' },
        opposite: true
      }
    ],
    series: [
      { name: 'Voltaje (V)', data: [], yAxis: 0 },
      { name: 'Corriente (A)', data: [], yAxis: 1 },
      { name: 'FP', data: [], yAxis: 2 },
      { name: 'Potencia (W)', data: [], yAxis: 3 }
    ]
  });
}

function fetchLiveData() {
  fetch(`/api/get_lecturas_historia/?sistema=${nombre}`)
    .then(response => response.json())
    .then(data => {
      const datos = data.datos;

      if (datos['A']) {
        const datosA = procesarDatos(datos['A']);
        actualizarGrafica(chartA, datosA, 'A');
      }
      if (datos['B']) {
        const datosB = procesarDatos(datos['B']);
        actualizarGrafica(chartB, datosB, 'B');
      }
      if (datos['C']) {
        const datosC = procesarDatos(datos['C']);
        actualizarGrafica(chartC, datosC, 'C');
      }
    })
    .catch(error => console.error('Fetch error:', error));
}

// Inicializar las gráficas vacías
chartA = crearGrafica('grafica-a', 'Fase A');
chartB = crearGrafica('grafica-b', 'Fase B');
chartC = crearGrafica('grafica-c', 'Fase C');

// Llamadas periódicas
fetchLiveData();
setInterval(fetchLiveData, 10000);
