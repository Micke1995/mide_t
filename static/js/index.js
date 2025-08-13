var map = L.map('map').setView([lat, long], 16);
// L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var greenIcon= new L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})
var marker = L.marker([lat, long], {icon: greenIcon}).addTo(map);


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
  const tiempos = [];
  const voltajes = [];
  const corrientes = [];
  const angulos = [];
  const kw = [];

  for (const item of datosFase.reverse()) {
    const t = new Date(item.tiempo).toLocaleString();
    tiempos.push(t);
    voltajes.push(item.voltaje);
    corrientes.push(item.corriente);
    angulos.push(item.angulo);
    kw.push(item.kwh);
    // kw.push(calcularKW(item.voltaje, item.corriente, item.angulo));
  }

  return { tiempos, voltajes, corrientes, angulos, kw };
}

function actualizarGrafica(chart, datos, fase) {
  chart.update({
    chart: {
      zooming: {
        type: 'x'
      }
    },
    title: { text: `Fase ${fase}` },
    xAxis: { categories: datos.tiempos, type: 'datetime' },
    // yAxis: [
    //   {
    //     labels: {
    //       format: '{value} V',
    //       // style: { color: '#1f77b4' }
    //     },
    //     opposite: true,
    //   },
    //   {
    //     labels: {
    //       format: '{value} A',
    //       // style: { color: '#ff7f0e' }
    //     },
    //     opposite: true,
    //   },
    //   {
    //     labels: {
    //       format: '{value}',
    //       // style: { color: '#2ca02c' }
    //     },
    //     title: { text: 'Factor de Potencia' },
    //     opposite: true,
    //   },
    //   {
    //     labels: {
    //       format: '{value} kW',
    //       // style: { color: ' #d62728' }
    //     },
    //     opposite: true,
    //   }

    // ],
    series: [
      {
        name: 'Voltaje (V)', data: datos.voltajes,
        yAxis: 0,
        marker: { enabled: false }
      },
      {
        name: 'Corriente (A)', data: datos.corrientes,

        marker: { enabled: false },
        yAxis: 1
      },
      {
        name: 'FP', data: datos.angulos,

        marker: { enabled: false },
        yAxis: 2
      },
      {
        name: 'Potencia (kW)', data: datos.kw,
        marker: { enabled: false },
        yAxis: 3
      }
    ]
  });
}

function crearGrafica(contenedor, titulo) {
  // return Highcharts.stockChart(contenedor, {
  return Highcharts.chart(contenedor, {
    lang: {
      thousandsSep: ','
    },
    chart: { type: 'spline' },
    title: { text: titulo },
    xAxis: { categories: [] },
    yAxis: [
      {
        labels: {
          format: '{value} V',
          // style: { color: '#1f77b4' }
        },
        title: { text: 'Voltaje' },
        opposite: false,
      },
      {
        labels: {
          format: '{value} A',
          // style: { color: '#ff7f0e' }
        },
        title: { text: 'Corriente' },
        opposite: true,
      },
      {
        max: 1,
        min: -1,
        labels: {
          format: '{value}',
          // style: { color: '#2ca02c' }
        },
        title: { text: 'Factor de Potencia' },
        opposite: true,
      },
      {
        labels: {
          format: '{value} kW',
          // style: { color: ' #d62728' }
        },
        title: { text: 'Potencia' },
        opposite: true,
      }

    ]
    ,
    series: [
      { name: 'Voltaje (V)', data: [] },
      { name: 'Corriente (A)', data: [] },
      { name: 'Ángulo (°)', data: [] },
      { name: 'Potencia (kW)', data: [] }
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
