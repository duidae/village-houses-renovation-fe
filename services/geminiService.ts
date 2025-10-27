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

const impactMetricSchema = {
    type: Type.OBJECT,
    properties: {
        metric: { type: Type.STRING, description: "效益指標的名稱 (Name of the impact metric)." },
        value: { type: Type.STRING, description: "該指標的預估數值，可以是數字、範圍或質性描述 (Estimated value of the metric, can be a number, range, or qualitative description)." },
        description: { type: Type.STRING, description: "對此指標的簡要說明及其重要性 (Brief description of this metric and its importance)." },
    },
    required: ["metric", "value", "description"],
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
      description: "3個初步、概念性的活化方向建議 (3 initial, conceptual recommendations).",
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
    strategicRecommendations: {
      type: Type.ARRAY,
      description: "2-3個深入的、政策導向的策略性活化建議 (2-3 in-depth, policy-oriented strategic recommendations).",
      items: {
        type: Type.OBJECT,
        properties: {
            type: { type: Type.STRING, description: "建議的類型，必須是 '產業升級型', '社會需求型', 或 '地方再生型' 其中之一。" },
            project: { type: Type.STRING, description: "具體的活化專案名稱 (Specific project name)." },
            reason: { type: Type.STRING, description: "選擇此專案的詳細理由，結合校地條件、地方特性與政策趨勢 (Detailed reason for this project, combining campus conditions, local features, and policy trends)." },
            policyAlignment: { type: Type.ARRAY, items: { type: Type.STRING }, description: "此專案能對接的具體政府政策或計畫名稱 (Specific government policies or plans this project aligns with)." },
        },
        required: ["type", "project", "reason", "policyAlignment"],
      }
    },
    impactAssessment: {
        type: Type.OBJECT,
        description: "對策略性活化方案的預期效益與影響力評估 (Assessment of the expected benefits and impact of the strategic revitalization plans).",
        properties: {
            economic: { type: Type.ARRAY, items: impactMetricSchema, description: "經濟效益指標 (Economic impact metrics)." },
            social: { type: Type.ARRAY, items: impactMetricSchema, description: "社會效益指標 (Social impact metrics)." },
            sustainability: { type: Type.ARRAY, items: impactMetricSchema, description: "永續與環境效益指標 (Sustainability and environmental impact metrics)." },
            summary: { type: Type.STRING, description: "對整體效益的綜合總結 (An overall summary of the total impact)." },
        },
        required: ["economic", "social", "sustainability", "summary"],
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
  required: ["basicInfo", "environmentalAnalysis", "potentialIndex", "recommendations", "strategicRecommendations", "impactAssessment", "pastCases", "recentNews", "cityPopulation", "schoolEnrollment", "pestAnalysis", "fiveForcesAnalysis", "internalHealthMetrics", "swotAnalysis", "schoolHealthIndex"],
};


export const fetchAnalysisData = async (schoolName: string): Promise<AnalysisData> => {
  const prompt = `請你扮演一位頂尖的國土規劃與地方創生顧問，為政府決策幕僚，針對台灣的「${schoolName}」進行一份深入的校園永續經營潛力與健康度綜合分析報告。

**重要指令：** 在你所有的文字分析中（例如 PEST、SWOT、各項理由與總結），請找出對決策者最重要的 2-3 個關鍵字詞或短數據，並用 Markdown 的粗體語法 \`**關鍵字**\` 將其標示出來。請專注於具體的優勢、地點、政策名稱、關鍵數據或核心問題，**絕對避免**標示'政策'、'資源'、'優勢'、'劣勢'等通用名詞。

**分析框架:**

**第一層：外部環境分析**
1.  **PEST 分析**:
    *   **政策(P)**: 分析少子化政策、教育部資源分配、評鑑制度對學校的影響。
    *   **經濟(E)**: 分析家庭可支配收入、學費壓力、就業市場對學校的影響。
    *   **社會(S)**: 分析家長價值觀、人口結構、城鄉差距、留學傾向對學校的影響。
    *   **技術(T)**: 分析線上教育、AI 教學、遠距競爭對學校的影響。
2.  **競爭強度：波特五力分析**:
    *   **同業競爭**, **新進者威脅**, **買方議價能力**, **供應商議價能力**, **替代品威脅**。(每項力量請給予 1-10 分的評分，分數越高代表該力量越強/威脅越大)

**第二層：內部營運健康度**
請提供以下四大面向的關鍵指標分析，每個面向提供 2-3 個指標：
1.  **招生指標**: 新生註冊率、在校生總數趨勢、師生比等。
2.  **財務指標**: 教育部財務評分、自有收入vs補助依賴、負債率等。
3.  **品牌與品質指標**: 畢業生就業率、校友捐款、排名與口碑等。
4.  **營運能力指標**: 行政效率、產學合作量、師資流動率等。

**第三層：SWOT 整合分析**
基於以上內外部環境分析，總結出學校的 **優勢 (Strengths)**, **劣勢 (Weaknesses)**, **機會 (Opportunities)**, **威脅 (Threats)**。

**第四層：量化健康指數**
1.  **綜合評估健康指數 (School Health Index)**:
    *   綜合所有資訊，評估出一個 0-100 的「學校健康度指數」。
    *   提供一個健康度等級（'Excellent', 'Good', 'Fair', 'Critical'）。
    *   提供一段總結說明。

**第五層：策略性活化方向分析 (此為重點)**
請基於以下「雙主軸」邏輯，進行深入的策略建議。校地活化必須同時考慮「議題導向 × 區域需求 × 政策目標」。
*   **地方產業導向**: 振興在地經濟、文化、觀光。
*   **議題導向（政策導向）**: 回應社會或國家發展議題。

請根據以下分類，提出 2-3 個具體的、可操作的 **策略性活化建議 (strategicRecommendations)**：

1.  **產業升級型** (以「政策導向」+「高科技/新興產業」為核心。配對條件：交通便利 + 面積完整 + 可快速佈線)
    *   政策主題範例: AI園區 / 智慧製造, 綠能轉型 / ESG基地, 數位教育 / 新創孵化器。
    *   可轉換方向範例: 研發實驗區、AI創新中心, 設置太陽能板、永續示範校園, 創業育成空間。

2.  **社會需求型** (回應人力、居住、教育、長照等社會議題)
    *   政策主題範例: 外勞宿舍 / 技能培訓中心, 青年社宅 / 共居空間, 長照中心 / 銀髮樂齡學苑, 幼兒 / 特教 / 共融園區。
    *   可轉換方向範例: 提供住宿與職訓空間, 改為青年住宅, 改為長照設施, 改為社區教育基地。

3.  **地方再生型** (與地方產業鏈、文化資源、人口結構結合)
    *   政策主題範例: 農村再生 / 農業培力, 文創、觀光、地方品牌再生, 社區共學 / 公共空間再利用。
    *   可轉換方向範例: 食農教育基地、農創中心, 文創展館、青年旅館, 社區活動中心。

每個建議都必須包含：**類型 (type)**、**專案名稱 (project)**、**理由 (reason)** (需結合校地、地方與政策)、以及**可對接的政策 (policyAlignment)**。

**第六層：預期效益與影響力評估 (此為關鍵決策依據)**
基於你提出的「策略性活化方向分析」，請量化並質化評估這些方案**整合起來**的預期效益與影響力。這份評估是給政府決策者看的，需清晰呈現可達成的「政績」。請提供三大面向的評估，每個面向提供 2-3 個最關鍵的指標：
1.  **經濟效益 (economic)**: 預估可創造的就業機會、帶動的年產值或觀光收入、吸引的投資金額等。
2.  **社會效益 (social)**: 預估可服務的人次（如長照床位、社宅單元、培訓學員數）、提升的社區滿意度、保存的文化資產價值等。
3.  **永續與環境效益 (sustainability)**: 預估的減碳量、綠化面積增加、對 ESG 目標的貢獻等。
最後，提供一段**總結 (summary)**，說明此活化方案的整體戰略價值與對地方發展的長遠影響。

**附加數據任務 (維持不變):**
*   **基本資訊**: 學校名稱、地址、創校年份等。
*   **環境分析**: 地形、交通等。也請包含該校所在地區的 **3-5個特色景點** 與 **3-5個特色美食**。
*   **校地潛力指數 (CPI)**: 評估校地本身活化潛力。
*   **建議活化方向 (recommendations)**: 提供 3 個**初步的、概念性的**建議。
*   **過往案例**: 2-3個相似案例。
*   **近期動態**: 學校與城市的正負面新聞。
*   **人口趨勢**: 該地區過去10-15年人口趨勢。
*   **學校學生人數趨勢**: 該校過去10-15年學生人數趨勢。

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
    if (!data.basicInfo || !data.pestAnalysis || !data.fiveForcesAnalysis || !data.internalHealthMetrics || !data.swotAnalysis || !data.schoolHealthIndex || !data.strategicRecommendations || !data.impactAssessment) {
        throw new Error("Invalid data structure received from API.");
    }

    return data as AnalysisData;

  } catch (error) {
    console.error("Error fetching analysis data from Gemini API:", error);
    throw new Error("無法從 Gemini API 獲取分析資料。請檢查您的 API 金鑰或網路連線。");
  }
};
