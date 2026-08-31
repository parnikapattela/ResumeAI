const express = require("express");
const natural = require("natural");

const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");

const app = express();

const PORT = 5000;

/*
  --------------------------------------------------
  MIDDLEWARE
  --------------------------------------------------
*/

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST"],
  })
);

app.use(express.json());

/*
  --------------------------------------------------
  PDF UPLOAD CONFIGURATION
  --------------------------------------------------
*/

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

/*
  --------------------------------------------------
  SKILLS DATABASE
  --------------------------------------------------
*/

const skillAliases = {
  javascript: [
    "javascript",
    "js",
  ],

  typescript: [
    "typescript",
    "ts",
  ],

  python: [
    "python",
  ],

  java: [
    "java",
  ],

  "c++": [
    "c++",
    "cpp",
  ],

  "c#": [
    "c#",
    "csharp",
  ],

  react: [
    "react",
    "react.js",
    "reactjs",
  ],

  angular: [
    "angular",
    "angular.js",
    "angularjs",
  ],

  vue: [
    "vue",
    "vue.js",
    "vuejs",
  ],

  "node.js": [
    "node",
    "node.js",
    "nodejs",
  ],

  "express.js": [
    "express",
    "express.js",
    "expressjs",
  ],

  html: [
    "html",
    "html5",
  ],

  css: [
    "css",
    "css3",
  ],

  sql: [
    "sql",
  ],

  mongodb: [
    "mongodb",
    "mongo db",
    "mongo",
  ],

  mysql: [
    "mysql",
  ],

  postgresql: [
    "postgresql",
    "postgres",
    "postgres sql",
  ],

  git: [
    "git",
  ],

  github: [
    "github",
    "github.com",
  ],

  docker: [
    "docker",
    "docker container",
    "docker containers",
  ],

  aws: [
    "aws",
    "amazon web services",
  ],

  azure: [
    "azure",
    "microsoft azure",
  ],

  gcp: [
    "gcp",
    "google cloud",
    "google cloud platform",
  ],

  "machine learning": [
    "machine learning",
    "ml",
  ],

  "deep learning": [
    "deep learning",
    "dl",
  ],

  "artificial intelligence": [
    "artificial intelligence",
    "ai",
  ],

  "data science": [
    "data science",
  ],

  tensorflow: [
    "tensorflow",
  ],

  pytorch: [
    "pytorch",
    "torch",
  ],

  pandas: [
    "pandas",
  ],

  numpy: [
    "numpy",
  ],

  "scikit-learn": [
    "scikit-learn",
    "scikit learn",
    "sklearn",
  ],

  "rest api": [
    "rest api",
    "restful api",
    "rest apis",
    "restful apis",
  ],

  api: [
    "api",
    "apis",
  ],

  linux: [
    "linux",
  ],

  kubernetes: [
    "kubernetes",
    "k8s",
  ],

  figma: [
    "figma",
  ],
};

/*
  --------------------------------------------------
  TEXT CLEANING
  --------------------------------------------------
*/

function cleanText(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^\w\s.+#-]/g, " ");
}

/*
  --------------------------------------------------
  SKILL EXTRACTION
  --------------------------------------------------
*/

function extractSkills(text) {
  const normalizedText = String(text || "")
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const detectedSkills = [];

  for (const [canonicalSkill, aliases] of Object.entries(skillAliases)) {
    const found = aliases.some((alias) => {
      const normalizedAlias = String(alias || "")
        .toLowerCase()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()[\]]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (!normalizedAlias) {
        return false;
      }

      const pattern = new RegExp(
        `(^|\\s)${normalizedAlias.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )}(?=\\s|$)`,
        "i"
      );

      return pattern.test(normalizedText);
    });

    if (found) {
      detectedSkills.push(canonicalSkill);
    }
  }

  return detectedSkills;
}
/*
  --------------------------------------------------
  CONTEXT-AWARE MATCHING
  --------------------------------------------------
*/

const contextKeywords = [
  "experience",
  "experienced",
  "develop",
  "developed",
  "developer",
  "developing",
  "build",
  "built",
  "building",
  "implement",
  "implemented",
  "implementation",
  "using",
  "used",
  "worked",
  "working",
  "work",
  "project",
  "projects",
  "application",
  "applications",
  "software",
  "system",
  "systems",
  "backend",
  "frontend",
  "full stack",
  "full-stack",
  "api",
  "apis",
  "service",
  "services",
  "database",
  "databases",
  "framework",
  "frameworks",
  "development",
  "programming",
  "design",
  "designed",
  "maintain",
  "maintained",
  "testing",
  "test",
];

/*
  Find the surrounding context of a skill.
*/

function getSkillContext(text, skill) {
  const normalizedText = String(text || "")
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const aliases = skillAliases[skill] || [skill];

  for (const alias of aliases) {
    const normalizedAlias = String(alias || "")
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()[\]]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!normalizedAlias) {
      continue;
    }

    const index = normalizedText.indexOf(normalizedAlias);

    if (index === -1) {
      continue;
    }

    const start = Math.max(0, index - 100);
    const end = Math.min(
      normalizedText.length,
      index + normalizedAlias.length + 100
    );

    return normalizedText.slice(start, end);
  }

  return "";
}

/*
  Count meaningful context words around a skill.
*/

function calculateContextScore(text, skill) {
  const context = getSkillContext(text, skill);

  if (!context) {
    return 0;
  }

  let score = 0;

  for (const keyword of contextKeywords) {
    if (context.includes(keyword)) {
      score += 1;
    }
  }

  /*
    Limit the context score so it remains predictable.
  */

  return Math.min(score, 5);
}
/*
  --------------------------------------------------
  SEMANTIC / NLP SIMILARITY
  --------------------------------------------------
*/

function calculateSemanticSimilarity(textA, textB) {
  const firstText = String(textA || "").toLowerCase();
  const secondText = String(textB || "").toLowerCase();

  if (!firstText || !secondText) {
    return 0;
  }

  const tfidf = new TfIdf();

  tfidf.addDocument(firstText);
  tfidf.addDocument(secondText);

  const firstVector = {};
  const secondVector = {};

  tfidf.listTerms(0).forEach((item) => {
    firstVector[item.term] = item.tfidf;
  });

  tfidf.listTerms(1).forEach((item) => {
    secondVector[item.term] = item.tfidf;
  });

  const terms = new Set([
    ...Object.keys(firstVector),
    ...Object.keys(secondVector),
  ]);

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (const term of terms) {
    const valueA = firstVector[term] || 0;
    const valueB = secondVector[term] || 0;

    dotProduct += valueA * valueB;

    magnitudeA += valueA * valueA;
    magnitudeB += valueB * valueB;
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  const similarity =
    dotProduct /
    (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));

  return Number(similarity.toFixed(3));
}

/*
  --------------------------------------------------
  HOME / HEALTH CHECK
  --------------------------------------------------
*/

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ResumeAI backend is running!",
  });
});

/*
  --------------------------------------------------
  PDF RESUME UPLOAD
  --------------------------------------------------
*/

app.post(
  "/api/upload-resume",
  upload.single("resume"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "Please upload a PDF resume.",
        });
      }

      if (req.file.mimetype !== "application/pdf") {
        return res.status(400).json({
          success: false,
          error: "Only PDF files are supported.",
        });
      }

      const data = await pdfParse(req.file.buffer);

      return res.json({
        success: true,
        filename: req.file.originalname,
        pages: data.numpages,
        text: data.text,
      });
    } catch (error) {
      console.error("PDF extraction error:", error);

      return res.status(500).json({
        success: false,
        error: "Could not read the PDF resume.",
      });
    }
  }
);

/*
  --------------------------------------------------
  RESUME + JOB ANALYSIS
  --------------------------------------------------
*/

app.post("/api/analyze", (req, res) => {
  try {
    const { resume, jobDescription } = req.body;

    if (
      typeof resume !== "string" ||
      typeof jobDescription !== "string"
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Resume and job description must be provided as text.",
      });
    }

    if (!resume.trim() || !jobDescription.trim()) {
      return res.status(400).json({
        success: false,
        error:
          "Resume and job description cannot be empty.",
      });
    }

    const resumeSkills = extractSkills(resume);

    const jobSkills = extractSkills(jobDescription);

    const matchedSkills = [];

const missingSkills = [];

const skillAnalysis = [];

for (const skill of jobSkills) {
  const resumeHasSkill = resumeSkills.includes(skill);

  const resumeContextScore = calculateContextScore(
    resume,
    skill
  );

  const jobContextScore = calculateContextScore(
    jobDescription,
    skill
  );
  const resumeSkillContext = getSkillContext(
  resume,
  skill
);

const jobSkillContext = getSkillContext(
  jobDescription,
  skill
);

const semanticSimilarity = calculateSemanticSimilarity(
  resumeSkillContext,
  jobSkillContext
);

  if (resumeHasSkill) {
    matchedSkills.push(skill);

    skillAnalysis.push({
  skill,
  matched: true,
  resumeContextScore,
  jobContextScore,
  semanticSimilarity,
  contextStrength:
    resumeContextScore >= 3
      ? "strong"
      : resumeContextScore >= 1
      ? "moderate"
      : "basic",
});
  } else {
    missingSkills.push(skill);

    skillAnalysis.push({
  skill,
  matched: false,
  resumeContextScore: 0,
  jobContextScore,
  semanticSimilarity,
  contextStrength: "missing",
});
  }
}

/*
  --------------------------------------------------
  IMPROVED AI MATCH SCORE
  --------------------------------------------------

  60% -> Required skill coverage
  20% -> Resume context strength
  20% -> Semantic/NLP similarity
  --------------------------------------------------
*/

let matchScore = 0;

let skillMatchScore = 0;
let contextScore = 0;
let semanticScore = 0;

if (jobSkills.length > 0) {
  /*
    1. Skill coverage
  */

  skillMatchScore =
    (matchedSkills.length / jobSkills.length) * 100;

  /*
    2. Context strength

    Strong   = 100
    Moderate = 60
    Basic    = 30
    Missing  = 0
  */

  const contextValues = skillAnalysis.map((analysis) => {
    if (!analysis.matched) {
      return 0;
    }

    if (analysis.contextStrength === "strong") {
      return 100;
    }

    if (analysis.contextStrength === "moderate") {
      return 60;
    }

    return 30;
  });

  if (contextValues.length > 0) {
    contextScore =
      contextValues.reduce(
        (total, value) => total + value,
        0
      ) / contextValues.length;
  }

  /*
    3. Semantic similarity

    Convert 0–1 similarity into 0–100.
  */

  const semanticValues = skillAnalysis
    .filter((analysis) => analysis.matched)
    .map(
      (analysis) =>
        (analysis.semanticSimilarity || 0) * 100
    );

  if (semanticValues.length > 0) {
    semanticScore =
      semanticValues.reduce(
        (total, value) => total + value,
        0
      ) / semanticValues.length;
  }

  /*
    Final weighted score
  */

  matchScore = Math.round(
    skillMatchScore * 0.6 +
      contextScore * 0.2 +
      semanticScore * 0.2
  );

  matchScore = Math.min(
    100,
    Math.max(0, matchScore)
  );
}


/*
  --------------------------------------------------
  AI RECOMMENDATIONS
  --------------------------------------------------
*/

function generateRecommendations(
  missingSkills,
  skillAnalysis
) {
  const recommendations = [];

  /*
    1. Recommendations based on missing skills.
  */

  for (const skill of missingSkills) {
    recommendations.push(
      `Consider adding relevant ${skill} experience, projects, or coursework if applicable.`
    );
  }

  /*
    2. Recommendations based on weak context.
  */

  const weakContextSkills = skillAnalysis
    .filter(
      (analysis) =>
        analysis.matched &&
        analysis.contextStrength !== "strong"
    )
    .map((analysis) => analysis.skill);

  if (weakContextSkills.length > 0) {
    recommendations.push(
      `Strengthen the resume descriptions for ${weakContextSkills.join(
        ", "
      )} by describing how you used these skills in projects or work.`
    );
  }

  /*
    3. Recommendations based on low semantic similarity.
  */

  const lowSemanticSkills = skillAnalysis
    .filter(
      (analysis) =>
        analysis.matched &&
        analysis.semanticSimilarity < 0.2
    )
    .map((analysis) => analysis.skill);

  if (lowSemanticSkills.length > 0) {
    recommendations.push(
      `Use job-relevant terminology when describing ${lowSemanticSkills.join(
        ", "
      )}, while keeping the descriptions truthful.`
    );
  }

  /*
    4. General recommendation if no problems were found.
  */

  if (recommendations.length === 0) {
    recommendations.push(
      "Your resume aligns well with the provided job description. Continue highlighting measurable achievements and relevant projects."
    );
  }

  return recommendations.slice(0, 6);
}


/*
  --------------------------------------------------
  GENERATE RECOMMENDATIONS
  --------------------------------------------------
*/

const recommendations = generateRecommendations(
  missingSkills,
  skillAnalysis
);


/*
  --------------------------------------------------
  FINAL API RESPONSE
  --------------------------------------------------
*/

return res.json({
  success: true,

  /*
    Overall AI match score
  */

  matchScore,

  /*
    Score breakdown
  */

  scoreBreakdown: {
    skillMatch: Math.round(skillMatchScore),
    contextStrength: Math.round(contextScore),
    semanticSimilarity: Math.round(semanticScore),
  },

  /*
    Skill results
  */

  matchedSkills,

  missingSkills,

  resumeSkills,

  requiredSkills: jobSkills,

  /*
    Detailed NLP analysis
  */

  skillAnalysis,

  /*
    AI-generated recommendations
  */

  recommendations,

  /*
    Identifies the analysis method
  */

  analysisType: "context-aware",
});


/*
  --------------------------------------------------
  ERROR HANDLER FOR /api/analyze
  --------------------------------------------------
*/

} catch (error) {
  console.error("Analysis error:", error);

  return res.status(500).json({
    success: false,
    error: "Something went wrong during analysis.",
  });
}
});


/*
  --------------------------------------------------
  UNKNOWN API ROUTE HANDLER
  --------------------------------------------------
*/

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    error: "API endpoint not found.",
  });
});


/*
  --------------------------------------------------
  GENERAL ERROR HANDLER
  --------------------------------------------------
*/

app.use((error, req, res, next) => {
  console.error("Server error:", error);

  res.status(500).json({
    success: false,
    error: "Internal server error.",
  });
});


/*
  --------------------------------------------------
  START SERVER
  --------------------------------------------------
*/

const server = app.listen(PORT, "127.0.0.1", () => {
  console.log(
    `ResumeAI backend running at http://127.0.0.1:${PORT}`
  );
});


server.on("error", (error) => {
  console.error("Backend server error:", error);
});