// قائمة المحافظات الـ 22 بدقة
const yemenGovs = [
    { name: "صنعاء", lat: 15.3694, lon: 44.1910 },
    { name: "عدن", lat: 12.7855, lon: 45.0186 },
    { name: "تعز", lat: 13.5795, lon: 44.0209 },
    { name: "المكلا", lat: 14.5408, lon: 49.1297 },
    { name: "الحديدة", lat: 14.7979, lon: 42.9530 },
    { name: "إب", lat: 13.9667, lon: 44.1833 },
    { name: "ذمار", lat: 14.5427, lon: 44.4051 },
    { name: "صعدة", lat: 16.9406, lon: 43.7639 },
    { name: "سيئون", lat: 15.9431, lon: 48.7844 },
    { name: "عتق", lat: 14.5377, lon: 46.8319 },
    { name: "مأرب", lat: 15.4591, lon: 45.3253 },
    { name: "الجوف", lat: 16.1641, lon: 44.7769 },
    { name: "الغيضة", lat: 16.2136, lon: 52.1764 },
    { name: "سقطرى", lat: 12.4634, lon: 53.9239 },
    { name: "البيضاء", lat: 13.9853, lon: 45.5727 },
    { name: "حجة", lat: 15.6939, lon: 43.6019 },
    { name: "عمران", lat: 15.6594, lon: 43.9439 },
    { name: "زنجبار", lat: 13.1287, lon: 45.3804 },
    { name: "الحوطة", lat: 13.0582, lon: 44.8838 },
    { name: "الضالع", lat: 13.6957, lon: 44.7314 },
    { name: "الجبين", lat: 14.6191, lon: 43.7111 },
    { name: "المحويت", lat: 15.4701, lon: 43.5448 }
];

// 1. تشغيل الخريطة (قمر صناعي + حدود اليمن)
const map = L.map('map', {
    maxBounds: [[12.0, 41.0], [19.5, 54.5]],
    maxBoundsViscosity: 1.0
}).setView([15.5, 48.0], 6);

L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Esri Satellite'
}).addTo(map);

// 2. دالة جلب البيانات من API الخاص بك (الموجود في config.js)
async function getGovData(gov) {
    const key = API_KEYS.weather; 
    try {
        const [wRes, aRes] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${gov.lat}&lon=${gov.lon}&units=metric&appid=${key}&lang=ar`),
            fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${gov.lat}&lon=${gov.lon}&appid=${key}`)
        ]);

        const w = await wRes.json();
        const a = await aRes.json();

        updateUI(gov.name, w, a);
    } catch (e) { console.error("API Error", e); }
}

// 3. تحديث الواجهة والتنبيهات
function updateUI(name, w, a) {
    document.getElementById('city-name').innerText = name;
    document.getElementById('temp').innerText = `${Math.round(w.main.temp)}°م`;
    document.getElementById('wind').innerText = `${w.wind.speed} كم/س`;
    document.getElementById('hum').innerText = `${w.main.humidity}%`;
    document.getElementById('weather-status').innerText = w.weather[0].description;
    
    const aqi = a.list[0].main.aqi;
    const labels = ["ممتاز", "جيد", "متوسط", "ملوث", "خطر"];
    document.getElementById('aqi').innerText = labels[aqi-1];

    // نظام التنبيهات الذكي
    const alertBox = document.getElementById('alerts-container');
    alertBox.innerHTML = '';
    if (w.main.temp > 40) alertBox.innerHTML += `<div class="alert-msg">⚠️ تحذير: موجة حر شديدة في ${name}</div>`;
    if (aqi >= 4) alertBox.innerHTML += `<div class="alert-msg">😷 تحذير: تلوث هواء مرتفع في ${name}</div>`;

    updateChart(w.main.temp, w.main.humidity);
}

// 4. الرسوم البيانية
const ctx = document.getElementById('ecoChart').getContext('2d');
let myChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['حرارة', 'رطوبة'],
        datasets: [{ label: 'المؤشر', data: [0, 0], backgroundColor: ['#ef4444', '#3b82f6'] }]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

function updateChart(t, h) {
    myChart.data.datasets[0].data = [t, h];
    myChart.update();
}

// 5. وضع النقاط على الخريطة لجميع المحافظات
yemenGovs.forEach(gov => {
    L.marker([gov.lat, gov.lon]).addTo(map)
        .on('click', () => getGovData(gov))
        .bindTooltip(gov.name);
});

// 6. مؤقت التحديث (10 دقائق)
let timer = 600;
setInterval(() => {
    timer--; if(timer <= 0) timer = 600;
    document.getElementById('timer-label').innerText = `تحديث تلقائي خلال: ${Math.floor(timer/60)}:${timer%60 < 10 ? '0' : ''}${timer%60}`;
}, 1000);
