
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisData } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const metricItemSchema = {
  type: Type.OBJECT,
  properties: {
    metric: { type: Type.STRING, description: "指標名稱 (Name of the metric)." },
    value: { type: Type.STRING, description: "指標的量化或質化數值 (Quantitative or qualitative value of the metric)." },
    analysis: { type: Type.STRING, description: "對此指標的簡要分析 (Brief analysis of this metric)." },
  },
  required: ["metric", "value", "analysis"],
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    basicInfo: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "學校的完整正式名稱 (Full official name of the school)." },
        address: { type: Type.STRING, description: "學校的完整地址 (Full address of the school)." },
        foundedYear: { type: Type.INTEGER, description: "創校年份 (Year of establishment)." },
        areaSqM: { type: Type.NUMBER, description: "校地總面積，單位為平方公尺 (Total campus area in square meters)." },
        buildingCoverage: { type: Type.NUMBER, description: "校地上的建築面積佔比，為 0 到 100 的數字 (Percentage of campus area covered by buildings, a number from 0 to 100)." },
        latitude: { type: Type.NUMBER, description: "學校的緯度座標 (Latitude coordinate of the school)." },
        longitude: { type: Type.NUMBER, description: "學校的經度座標 (Longitude coordinate of the school)." },
      },
      required: ["name", "address", "foundedYear", "areaSqM", "buildingCoverage", "latitude", "longitude"],
    },
    environmentalAnalysis: {
      type: Type.OBJECT,
      properties: {
        terrain: { type: Type.STRING, description: "地形特性 (Terrain characteristics)." },
        avgElevationM: { type: Type.NUMBER, description: "校地平均海拔高度 (Average elevation)." },
        coastDistanceKm: { type: Type.NUMBER, description: "距離海岸線距離 (Distance to coastline)." },
        riverDistanceKm: { type: Type.NUMBER, description: "距離河川距離 (Distance to river)." },
        nearestStation: { type: Type.STRING, description: "最近車站 (Nearest station)." },
        transportationScore: { type: Type.NUMBER, description: "交通分數 (Transportation score 1-10)." },
        localAttractions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "所在地區的3-5個特色景點 (3-5 local attractions)." },
        localSpecialtyFoods: { type: Type.ARRAY, items: { type: Type.STRING }, description: "所在地區的3-5個特色美食 (3-5 local specialty foods)." },
      },
      required: ["terrain", "avgElevationM", "coastDistanceKm", "riverDistanceKm", "nearestStation", "transportationScore", "localAttractions", "localSpecialtyFoods"],
    },
    potentialIndex: {
      type: Type.OBJECT,
      properties: {
        cpiScore: { type: Type.NUMBER, description: "校地潛力綜合指數 (Campus Potential Index), 0-100." },
        summary: { type: Type.STRING, description: "分數總結 (Score summary)." },
      },
      required: ["cpiScore", "summary"],
    },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          reason: { type: Type.STRING },
        },
        required: ["title", "description", "reason"],
      },
    },
    pastCases: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          schoolName: { type: Type.STRING },
          location: { type: Type.STRING },
          originalCondition: { type: Type.STRING },
          revitalizationTheme: { type: Type.STRING },
          outcome: { type: Type.STRING },
        },
        required: ["schoolName", "location", "originalCondition", "revitalizationTheme", "outcome"],
      },
    },
    recentNews: {
      type: Type.OBJECT,
      properties: {
        schoolNews: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, summary: { type: Type.STRING }, date: { type: Type.STRING } }, required: ["title", "summary", "date"] } },
        cityNews: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, summary: { type: Type.STRING }, date: { type: Type.STRING } }, required: ["title", "summary", "date"] } },
      },
      required: ["schoolNews", "cityNews"],
    },
    cityPopulation: {
      type: Type.ARRAY,
      items: { type: Type.OBJECT, properties: { year: { type: Type.INTEGER }, population: { type: Type.INTEGER } }, required: ["year", "population"] },
    },
    schoolEnrollment: {
      type: Type.ARRAY,
      items: { type: Type.OBJECT, properties: { year: { type: Type.INTEGER }, studentCount: { type: Type.INTEGER } }, required: ["year", "studentCount"] },
    },
    // New strategic analysis schema
    pestAnalysis: {
        type: Type.OBJECT,
        description: "外部宏觀環境 PEST 分析 (PEST analysis of the macro environment).",
        properties: {
            political: { type: Type.STRING, description: "政策(P)因素分析 (Political factors analysis)." },
            economic: { type: Type.STRING, description: "經濟(E)因素分析 (Economic factors analysis)." },
            social: { type: Type.STRING, description: "社會(S)因素分析 (Social factors analysis)." },
            technological: { type: Type.STRING, description: "技術(T)因素分析 (Technological factors analysis)." },
        },
        required: ["political", "economic", "social", "technological"]
    },
    fiveForcesAnalysis: {
        type: Type.OBJECT,
        description: "產業競爭環境波特五力分析 (Porter's Five Forces analysis of the competitive environment).",
        properties: {
            industryRivalry: { type: Type.OBJECT, properties: { score: { type: Type.INTEGER }, analysis: { type: Type.STRING } }, required: ["score", "analysis"] },
            threatOfNewEntrants: { type: Type.OBJECT, properties: { score: { type: Type.INTEGER }, analysis: { type: Type.STRING } }, required: ["score", "analysis"] },
            bargainingPowerOfBuyers: { type: Type.OBJECT, properties: { score: { type: Type.INTEGER }, analysis: { type: Type.STRING } }, required: ["score", "analysis"] },
            bargainingPowerOfSuppliers: { type: Type.OBJECT, properties: { score: { type: Type.INTEGER }, analysis: { type: Type.STRING } }, required: ["score", "analysis"] },
            threatOfSubstituteProducts: { type: Type.OBJECT, properties: { score: { type: Type.INTEGER }, analysis: { type: Type.STRING } }, required: ["score", "analysis"] },
        },
        required: ["industryRivalry", "threatOfNewEntrants", "bargainingPowerOfBuyers", "bargainingPowerOfSuppliers", "threatOfSubstituteProducts"]
    },
    internalHealthMetrics: {
        type: Type.OBJECT,
        description: "學校內部營運健康度指標 (Internal operational health metrics).",
        properties: {
            enrollment: { type: Type.ARRAY, items: metricItemSchema },
            financial: { type: Type.ARRAY, items: metricItemSchema },
            brand: { type: Type.ARRAY, items: metricItemSchema },
            operational: { type: Type.ARRAY, items: metricItemSchema },
        },
        required: ["enrollment", "financial", "brand", "operational"],
    },
    swotAnalysis: {
        type: Type.OBJECT,
        description: "綜合優劣勢、機會與威脅的 SWOT 分析 (SWOT analysis).",
        properties: {
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
            threats: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["strengths", "weaknesses", "opportunities", "threats"],
    },
    schoolHealthIndex: {
        type: Type.OBJECT,
        description: "綜合所有分析得出的學校健康度指數 (A composite School Health Index based on all analyses).",
        properties: {
            score: { type: Type.INTEGER, description: "健康度分數 (0-100，100為最健康) (Health score, 0-100, 100 is healthiest)." },
            level: { type: Type.STRING, description: "健康度等級 ('Excellent', 'Good', 'Fair', 'Critical')." },
            summary: { type: Type.STRING, description: "對此健康度等級的簡要總結 (A brief summary of this health level)." }
        },
        required: ["score", "level", "summary"]
    },
  },
  required: ["basicInfo", "environmentalAnalysis", "potentialIndex", "recommendations", "pastCases", "recentNews", "cityPopulation", "schoolEnrollment", "pestAnalysis", "fiveForcesAnalysis", "internalHealthMetrics", "swotAnalysis", "schoolHealthIndex"],
};


export const fetchAnalysisData = async (schoolName: string): Promise<AnalysisData> => {
  const prompt = `請針對台灣的「${schoolName}」進行一份深入的校園永續經營潛力與健康度綜合分析報告。請遵循以下多層次分析框架，並確保所有數據和分析都基於公開資料與合理推斷，聽起來非常真實。

**分析框架:**

**第一層：外部環境分析**
1.  **PEST 分析**:
    *   **政策(P)**: 分析少子化政策、教育部資源分配、評鑑制度對學校的影響。
    *   **經濟(E)**: 分析家庭可支配收入、學費壓力、就業市場對學校的影響。
    *   **社會(S)**: 分析家長價值觀、人口結構、城鄉差距、留學傾向對學校的影響。
    *   **技術(T)**: 分析線上教育、AI 教學、遠距競爭對學校的影響。

2.  **競爭強度：波特五力分析**:
    *   **同業競爭**: 分析同區域或同類型學校的競爭強度。
    *   **新進者威脅**: 分析私校轉型、外國學校設分校等潛在威脅。
    *   **買方議價能力**: 分析學生與家長的選擇權與議價能力。
    *   **供應商議價能力**: 分析教師、人力、教材等成本壓力。
    *   **替代品威脅**: 分析線上課程、職業訓練、海外留學等替代品的威脅。
    *   (每項力量請給予 1-10 分的評分，分數越高代表該力量越強/威脅越大)

**第二層：內部營運健康度**
請提供以下四大面向的關鍵指標分析，每個面向提供 2-3 個指標：
1.  **招生指標**: 新生註冊率、在校生總數趨勢、師生比等。
2.  **財務指標**: 教育部財務評分、自有收入vs補助依賴、負債率等。
3.  **品牌與品質指標**: 畢業生就業率、校友捐款、排名與口碑等。
4.  **營運能力指標**: 行政效率、產學合作量、師資流動率等。

**第三層：SWOT 整合分析**
基於以上內外部環境分析，總結出學校的：
*   **優勢 (Strengths)**
*   **劣勢 (Weaknesses)**
*   **機會 (Opportunities)**
*   **威脅 (Threats)**

**第四層：量化健康指數**
1.  **綜合評估健康指數 (School Health Index)**:
    *   綜合以上所有資訊，評估出一個「學校健康度指數」。
    *   提供一個 0-100 的分數（100為最健康）。
    *   提供一個健康度等級（'Excellent', 'Good', 'Fair', 'Critical'）。
    *   提供一段總結說明，解釋分數的意義。

**附加數據任務 (維持不變):**
*   **基本資訊**: 學校名稱、地址、創校年份等。
*   **環境分析**: 地形、交通等。也請包含該校所在地區的 **3-5個特色景點** 與 **3-5個特色美食**。
*   **校地潛力指數 (CPI)**: 評估校地本身活化潛力。
*   **建議活化方向**: 3個具體建議。
*   **過往案例**: 2-3個相似案例。
*   **近期動態**: 學校與城市的正負面新聞。
*   **人口趨勢**: 根據內政部資料，提供該地區過去10-15年人口趨勢。
*   **學校學生人數趨勢**: 根據教育部資料，提供該校過去10-15年學生人數趨勢。

請嚴格按照指定的 JSON 結構生成完整的報告。`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    const data = JSON.parse(jsonText);

    // Simple validation
    if (!data.basicInfo || !data.pestAnalysis || !data.fiveForcesAnalysis || !data.internalHealthMetrics || !data.swotAnalysis || !data.schoolHealthIndex) {
        throw new Error("Invalid data structure received from API.");
    }

    return data as AnalysisData;

  } catch (error) {
    console.error("Error fetching analysis data from Gemini API:", error);
    throw new Error("無法從 Gemini API 獲取分析資料。請檢查您的 API 金鑰或網路連線。");
  }
};
