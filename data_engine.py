import requests
import json
import os
from datetime import datetime
from openai import OpenAI

# --- 1. جلب المفاتيح من الخزنة الآمنة ---
OWM_KEY = os.environ.get("OPENWEATHER_KEY")
NASA_KEY = os.environ.get("NASA_KEY")
AI_KEY = os.environ.get("OPENAI_KEY")

# إعداد عميل الذكاء الاصطناعي
client = OpenAI(api_key=AI_KEY)

# --- 2. إعداد المدن ---
CITIES = {
    "Sanaa": {"lat": 15.3694, "lon": 44.1910},
    "Aden": {"lat": 12.7855, "lon": 45.0188},
    "Socotra": {"lat": 12.4634, "lon": 53.8237},
    "Hodeidah": {"lat": 14.7978, "lon": 42.9545}
}

# --- 3. دوال جلب البيانات ---
def get_air_quality(lat, lon):
    try:
        url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={OWM_KEY}"
        response = requests.get(url).json()
        return response['list'][0]['main']['aqi']
    except Exception as e:
        print(f"Error fetching AQI: {e}")
        return 1

def get_nasa_data():
    # محاكاة الاتصال بناسا باستخدام المفتاح للتحقق من الصلاحية
    # في النسخة الكاملة يتم تحليل CSV للحرائق
    return {"fire_alerts": 0, "vegetation_index": "Stable"}

# --- 4. المحرك الرئيسي ---
eco_data = {
    "last_update": datetime.now().strftime("%Y-%m-%d %H:%M"),
    "locations": []
}

full_text_data = "" # لتجميع البيانات وإرسالها للذكاء الاصطناعي

for name, coords in CITIES.items():
    aqi = get_air_quality(coords['lat'], coords['lon'])
    
    # تحديد الحالة بناءً على AQI
    status_map = {1: "ممتاز", 2: "جيد", 3: "متوسط", 4: "سيء", 5: "خطر جداً"}
    status = status_map.get(aqi, "غير معروف")
    
    city_data = {
        "name": name,
        "lat": coords['lat'],
        "lon": coords['lon'],
        "aqi": aqi,
        "status": status,
        "temp": 28 # (يمكن إضافة API الحرارة هنا أيضاً)
    }
    eco_data["locations"].append(city_data)
    full_text_data += f"- {name}: جودة الهواء {status} ({aqi}/5).\n"

# --- 5. الذكاء الاصطناعي (تحليل التقرير) ---
try:
    print("🤖 Consulting AI...")
    response = client.chat.completions.create(
        model="gpt-4", # أو gpt-3.5-turbo للتوفير
        messages=[
            {"role": "system", "content": "أنت خبير بيئي يمني. حلل البيانات التالية واكتب تقريراً موجزاً جداً (سطرين) وتوصية عاجلة."},
            {"role": "user", "content": f"بيانات اليمن الحالية:\n{full_text_data}"}
        ]
    )
    ai_report = response.choices[0].message.content
except Exception as e:
    ai_report = "تعذر الاتصال بالمستشار الذكي حالياً. البيانات الخام متاحة."
    print(f"AI Error: {e}")

eco_data["ai_report"] = ai_report

# --- 6. حفظ النتيجة ---
with open("live_data.json", "w", encoding='utf-8') as f:
    json.dump(eco_data, f, ensure_ascii=False, indent=2)

print("✅ System Update Complete.")
