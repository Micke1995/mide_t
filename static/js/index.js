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

  console.log(`Actualizando gráfica fase ${fase} con datos:`, datos);

  const fechaString = new Date(datos.tiempo).toLocaleString();

  // comentar para producción
  datos.voltaje = 130 * Math.random().toFixed(2)
  datos.corriente = 10 * Math.random().toFixed(2)
  datos.angulo = 30 * Math.random().toFixed(2)
  datos.kwh = 100 * Math.random().toFixed(2)
  const noti = document.getElementById(`noti${fase}`);
  noti.classList.add('d-none');

  const voltage = document.getElementById(`voltage ${fase.toLowerCase()}`)
  const current = document.getElementById(`current ${fase.toLowerCase()}`)
  const angle = document.getElementById(`angle ${fase.toLowerCase()}`)
  const power = document.getElementById(`power ${fase.toLowerCase()}`)
  const last_lec = document.getElementById(`last_lec ${fase.toLowerCase()}`)

  voltage.classList = '';
  voltage.removeAttribute('data-bs-original-title');
  voltage.removeAttribute('data-bs-toggle');
  current.classList = '';
  angle.classList = '';
  power.classList = '';


  voltage.textContent = datos.voltaje.toFixed(2);
  current.textContent = datos.corriente.toFixed(2);
  angle.textContent = datos.angulo.toFixed(2);
  power.textContent = datos.kwh.toFixed(2);
  last_lec.textContent = fechaString;

  const umbralVolts = 130 * 0.1;
  // bajo factor de carga, factor de carga ~1, FP negativo, voltajes +-10 o abatidos (por debajo al 50%), desbalance de corrientes (50% entre fases),

  if (datos.voltaje < (130 - umbralVolts) || datos.voltaje > (130 + umbralVolts)) {
    voltage.classList = 'text-danger fw-bold';
    voltage.setAttribute('title', 'Voltaje fuera de rango');
    voltage.setAttribute('data-bs-toggle', 'tooltip');

    new bootstrap.Tooltip(voltage);


    noti.classList.remove('d-none');
    // agregar bandera en la gráfica
    chart.series[4].addPoint([new Date().getTime(), datos.voltaje], false, false);
  }



  // datos.tiempo = new Date(datos.tiempo).getTime();
  datos.tiempo = new Date().getTime();

  chart.series[0].addPoint([datos.tiempo, datos.voltaje], false, false);
  chart.series[1].addPoint([datos.tiempo, datos.corriente], false, false);
  chart.series[2].addPoint([datos.tiempo, datos.angulo], false, false);
  chart.series[3].addPoint([datos.tiempo, datos.kwh], false, false);
  chart.redraw();

}

function crearGrafica(contenedor, titulo, data = []) {

  Highcharts.setOptions({
    time: {
      useUTC: false
    }
  });
  eventsVolts = [];
  eventsAmps = [];
  eventsFP = [];
  eventsKW = [];

  const umbralVolts = 130 * 0.1;
  data.seriesVoltajes.forEach(point => {
    if (point[1] < (130 - umbralVolts) || point[1] > (130 + umbralVolts)) {
      eventsVolts.push([point[0], point[1]]);
    }
  });

  const umbralAmps = 0.1;
  data.seriesCorrientes.forEach(point => {
    if (point[1] < umbralAmps) {
      eventsAmps.push([point[0], point[1]]);
    }
  });

  chart = new Highcharts.stockChart(contenedor, {
    lang: { thousandsSep: ',' },
    chart: {
      type: 'spline',
      zooming: { type: 'x' },
      events: {
        load: fetchLiveData
      }

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
      { name: 'Voltaje (V)', data: data.seriesVoltajes, yAxis: 0, id: 'voltaje' },
      { name: 'Corriente (A)', data: data.seriesCorrientes, yAxis: 1, id: 'corriente' },
      { name: 'FP', data: data.seriesAngulos, yAxis: 2, id: 'fp' },
      { name: 'Potencia (W)', data: data.seriesKW, yAxis: 3, id: 'potencia' },
      {
        type: "flags",
        // tooltip: "Eventos de Voltaje",
        title: "V",
        text: "Valores de voltaje fuera de rango",
        data: eventsVolts, shape: "circlepin",
        // showInNavigator: true,
        navigatorOptions: {
          type: 'flags',
          onSeries: undefined,
          data: eventsVolts,
          shape: "circlepin"
        },
        tooltip: {
          pointFormat: 'Voltaje fuera de rango: {point.y} V<br/>{point.time:%Y-%m-%d %H:%M:%S}'
        },
        yAxis: 0, onSeries: "voltaje", width: 16
      },
      {
        type: "flags",
        // tooltip: "Eventos de Voltaje",
        title: "A",
        text: "Valores de corriente por debajo del umbral",
        data: eventsAmps, shape: "circlepin",
        // showInNavigator: true,
        navigatorOptions: {
          type: 'flags',
          onSeries: undefined,
          data: eventsAmps,
          shape: "circlepin"
        },
        tooltip: {
          pointFormat: 'Corriente por debajo del umbral: {point.y} A<br/>{point.time:%Y-%m-%d %H:%M:%S}'
        },
        yAxis: 0, onSeries: "corriente", width: 16
      }
    ]
  });

  if (data.seriesVoltajes.length > 0) {
    const ultimoTimestamp = data.seriesVoltajes[data.seriesVoltajes.length - 1][0];
    const primerTimestamp = ultimoTimestamp - 1 * 3600 * 1000; // 1h antes
    chart.xAxis[0].setExtremes(primerTimestamp, ultimoTimestamp);
  }
  return chart;
}

function fetchLiveData() {
  fetch(`/api/get_lecturas/?sistema=${nombre}`)
    .then(response => response.json())
    .then(data => {
      const datos = data.datos;
      let corrientePromedio = 0;
      let corrA = 0, corrB = 0, corrC = 0;


      if (datos['A']) {
        const datosA = datos['A'];
        actualizarGrafica(chartA, datosA, 'A');
        corrA = datosA.corriente;
      }
      if (datos['B']) {
        const datosB = datos['B'];
        actualizarGrafica(chartB, datosB, 'B');
        corrB = datosB.corriente;
      }
      if (datos['C']) {
        const datosC = datos['C'];
        actualizarGrafica(chartC, datosC, 'C');
        corrC = datosC.corriente;
      }
      corrientePromedio = (corrA + corrB + corrC) / 3;

      colorearCorrientes(datos, corrA, 'A', corrientePromedio);
      colorearCorrientes(datos, corrB, 'B', corrientePromedio);
      colorearCorrientes(datos, corrC, 'C', corrientePromedio);


      setTimeout(fetchLiveData, 30000);
    })
    .catch(error => console.error('Fetch error:', error));

  function colorearCorrientes(datos, corrN, corrienteNombre = "A", corrientePromedio) {
    if (datos[corrienteNombre]) {
      let corrienteElement = document.getElementById(`current ${corrienteNombre.toLowerCase()}`);
      corrienteElement.classList = '';
      corrienteElement.removeAttribute('data-bs-original-title');
      corrienteElement.removeAttribute('data-bs-toggle');
      if (corrN / corrientePromedio < 0.5) {
        corrienteElement.classList = 'text-danger fw-bold';
        corrienteElement.setAttribute('title', 'Corriente desbalanceada');
        corrienteElement.setAttribute('data-bs-toggle', 'tooltip');
        new bootstrap.Tooltip(corrienteElement);

        let noti = document.getElementById(`noti${corrienteNombre}`);
        noti.classList.remove('d-none');

      }
    }
  }
}

let ConsultaBtn = document.getElementById('ConsultaBtn');




window.addEventListener('load', async () => {

  let resServ = await fetch('api/get_servicios/')
  let servicios = await resServ.json()

  selectorServicios = document.getElementById("selectorServicios")

  servicios.data.forEach(servicio => {
    let option = document.createElement("option")
    option.value = servicio[0]
    option.text = servicio[0]
    selectorServicios.add(option)
  });


  ConsultaBtn.addEventListener('click', async () => {

    nombre = selectorServicios.value;

    // consulta a históricos
    const res = await fetch(`api/get_lecturas_historia/?sistema=${nombre}`);
    const data = await res.json();
    const datos = data.datos;
    let datosA = [], datosB = [], datosC = []
    if (datos['A']) {
      datosA = procesarDatos(datos['A']);
      console.log(datosA);
    }
    if (datos['B']) {
      datosB = procesarDatos(datos['B']);
      console.log(datosB);

    }
    if (datos['C']) {
      datosC = procesarDatos(datos['C']);
      console.log(datosC);
    }

    chartA = crearGrafica('grafica-a', 'Fase A', datosA);
    chartB = crearGrafica('grafica-b', 'Fase B', datosB);
    chartC = crearGrafica('grafica-c', 'Fase C', datosC);


  });
});
