import { useState } from "react";
import "./App.css";

function App() {
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [error, setError] = useState("");

  /* --------------------------------------------------
     PDF RESUME UPLOAD
     -------------------------------------------------- */

  const handleResumeUpload = async (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }

    setUploading(true);
    setError("");
    setResults(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await fetch(
        "http://127.0.0.1:5000/api/upload-resume",
        {
          method: "POST",
          body: formData,
        }
      );

      const responseText = await response.text();

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `PDF server returned an invalid response. HTTP ${response.status}`
        );
      }

      if (!response.ok) {
        throw new Error(data.error || "PDF upload failed.");
      }

      setResume(data.text || "");
      setUploadedFileName(data.filename || file.name);
    } catch (error) {
      console.error("PDF upload error:", error);
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  /* --------------------------------------------------
     AI ANALYSIS
     -------------------------------------------------- */

  const handleAnalyze = async () => {
    if (!resume.trim() || !jobDescription.trim()) {
      setError(
        "Please enter both your resume and the job description."
      );
      return;
    }

    setLoading(true);
    setError("");
    setResults(null);

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resume,
            jobDescription,
          }),
        }
      );

      const responseText = await response.text();

      console.log(
        "Analysis HTTP status:",
        response.status
      );

      console.log(
        "Analysis server response:",
        responseText
      );

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Analysis server returned an invalid response. HTTP ${response.status}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Analysis failed."
        );
      }

      setResults(data);
    } catch (error) {
      console.error("Analysis error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------------------------
     SCORE INTERPRETATION
     -------------------------------------------------- */

  const getScoreStatus = (score) => {
    if (score >= 85) {
      return "Excellent Match";
    }

    if (score >= 70) {
      return "Strong Match";
    }

    if (score >= 50) {
      return "Moderate Match";
    }

    return "Low Match";
  };

  /* --------------------------------------------------
     SAFE RESULT ARRAYS
     -------------------------------------------------- */

  const matchedSkills = results?.matchedSkills || [];
  const missingSkills = results?.missingSkills || [];
  const skillAnalysis = results?.skillAnalysis || [];

  const recommendations =
    results?.recommendations || [];

  const scoreBreakdown =
    results?.scoreBreakdown || {};

  /* --------------------------------------------------
     RENDER
     -------------------------------------------------- */

  return (
    <div className="app">

      {/* =================================================
          HEADER
          ================================================= */}

      <header className="header">
        <div className="container header-content">

          <div className="logo">
            ResumeAI
          </div>

          <div className="badge">
            AI-Powered
          </div>

        </div>
      </header>


      {/* =================================================
          MAIN
          ================================================= */}

      <main className="main">

        <div className="container">


          {/* =================================================
              HERO
              ================================================= */}

          <section className="hero">

            <span className="eyebrow">
              AI RESUME INTELLIGENCE
            </span>

            <h1>
              Find out how well your resume
              <span> matches a job.</span>
            </h1>

            <p>
              Analyze your resume against a job
              description and discover your strengths,
              skill gaps, semantic relevance, and
              AI-powered recommendations.
            </p>

          </section>


          {/* =================================================
              INPUT SECTION
              ================================================= */}

          <section className="input-grid">


            {/* -------------------------------------------------
                RESUME CARD
                ------------------------------------------------- */}

            <div className="input-card">

              <div className="card-header">

                <div>

                  <h2>
                    Your Resume
                  </h2>

                  <p>
                    Upload a PDF or paste your resume.
                  </p>

                </div>

                <div className="number">
                  01
                </div>

              </div>


              {/* PDF UPLOAD */}

              <label className="upload-button">

                {uploading
                  ? "Reading PDF..."
                  : "Upload Resume PDF"}

                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleResumeUpload}
                  hidden
                />

              </label>


              {/* UPLOADED FILE */}

              {uploadedFileName && (
                <div className="uploaded-file">
                  ✓ {uploadedFileName} extracted successfully
                </div>
              )}


              {/* RESUME TEXT */}

              <textarea
                value={resume}
                onChange={(event) =>
                  setResume(event.target.value)
                }
                placeholder="Paste your resume here..."
              />


              <div className="character-count">
                {resume.length} characters
              </div>

            </div>


            {/* -------------------------------------------------
                JOB DESCRIPTION CARD
                ------------------------------------------------- */}

            <div className="input-card">

              <div className="card-header">

                <div>

                  <h2>
                    Job Description
                  </h2>

                  <p>
                    Paste the job description here.
                  </p>

                </div>

                <div className="number">
                  02
                </div>

              </div>


              <textarea
                value={jobDescription}
                onChange={(event) =>
                  setJobDescription(event.target.value)
                }
                placeholder="Paste the job description here..."
              />


              <div className="character-count">
                {jobDescription.length} characters
              </div>

            </div>

          </section>


          {/* =================================================
              ERROR MESSAGE
              ================================================= */}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}


          {/* =================================================
              ANALYZE BUTTON
              ================================================= */}

          <button
            className="analyze-button"
            onClick={handleAnalyze}
            disabled={loading || uploading}
          >

            {loading
              ? "Analyzing with AI..."
              : "Analyze Job Match"}

            <span>
              →
            </span>

          </button>


          {/* =================================================
              RESULTS
              ================================================= */}

          <section className="preview-section">


            {/* -------------------------------------------------
                RESULTS HEADER
                ------------------------------------------------- */}

            <div className="preview-header">

              <span className="eyebrow">

                {results
                  ? "AI ANALYSIS COMPLETE"
                  : "WHAT YOU'LL GET"}

              </span>


              <h2>

                {results
                  ? "Here is your AI-powered job-fit analysis."
                  : "Understand your job fit in seconds."}

              </h2>

            </div>


            {/* =================================================
                RESULTS AVAILABLE
                ================================================= */}

            {results ? (

              <div className="result-grid">


                {/* =================================================
                    SCORE CARD
                    ================================================= */}

                <div className="result-card score-card">

                  <span className="result-label">
                    AI MATCH SCORE
                  </span>


                  <div className="score-visual">

                    <div
                      className="score-circle"
                      style={{
                        "--score": results.matchScore || 0,
                      }}
                    >

                      <div className="score-circle-inner">

                        <strong>
                          {results.matchScore}%
                        </strong>

                        <span>
                          job fit
                        </span>

                      </div>

                    </div>

                  </div>


                  <div className="score-status">
                    {getScoreStatus(
                      results.matchScore || 0
                    )}
                  </div>


                  <p>
                    Your resume was evaluated using
                    required-skill coverage, resume
                    context strength, and semantic
                    similarity.
                  </p>

                </div>


                {/* =================================================
                    MATCHED SKILLS
                    ================================================= */}

                <div className="result-card">

                  <span className="result-label">
                    MATCHED SKILLS
                  </span>


                  <div className="skill-placeholder">

                    {matchedSkills.length > 0 ? (

                      matchedSkills.map(
                        (skill) => (
                          <span key={skill}>
                            {skill}
                          </span>
                        )
                      )

                    ) : (

                      <span>
                        No matching skills found
                      </span>

                    )}

                  </div>


                  <p>
                    Skills detected in both your
                    resume and the job description.
                  </p>

                </div>


                {/* =================================================
                    SKILL GAPS
                    ================================================= */}

                <div className="result-card">

                  <span className="result-label">
                    SKILL GAPS
                  </span>


                  <div className="skill-placeholder missing">

                    {missingSkills.length > 0 ? (

                      missingSkills.map(
                        (skill) => (
                          <span key={skill}>
                            {skill}
                          </span>
                        )
                      )

                    ) : (

                      <span>
                        No major skill gaps detected
                      </span>

                    )}

                  </div>


                  <p>
                    Required skills that were not
                    detected in your resume.
                  </p>

                </div>


                {/* =================================================
                    SCORE BREAKDOWN
                    ================================================= */}

                <div className="result-card score-breakdown-card">

                  <span className="result-label">
                    AI SCORE BREAKDOWN
                  </span>


                  <p>
                    Your overall score is calculated
                    from three AI matching signals.
                  </p>


                  <div className="breakdown-grid">


                    <div className="breakdown-item">

                      <span>
                        Skill Coverage
                      </span>

                      <strong>
                        {scoreBreakdown.skillMatch ??
                          0}%
                      </strong>

                    </div>


                    <div className="breakdown-item">

                      <span>
                        Context Strength
                      </span>

                      <strong>
                        {scoreBreakdown.contextStrength ??
                          0}%
                      </strong>

                    </div>


                    <div className="breakdown-item">

                      <span>
                        Semantic Similarity
                      </span>

                      <strong>
                        {scoreBreakdown.semanticSimilarity ??
                          0}%
                      </strong>

                    </div>

                  </div>

                </div>


                {/* =================================================
                    DETAILED SKILL ANALYSIS
                    ================================================= */}

                <div className="result-card detailed-analysis-card">

                  <span className="result-label">
                    DETAILED AI SKILL ANALYSIS
                  </span>


                  <p className="analysis-intro">
                    Each required skill is evaluated
                    using resume evidence, job context,
                    and semantic similarity.
                  </p>


                  {skillAnalysis.length > 0 ? (

                    <div className="skill-analysis-list">

                      {skillAnalysis.map(
                        (analysis) => (

                          <div
                            className="skill-analysis-item"
                            key={analysis.skill}
                          >

                            <div className="skill-analysis-header">

                              <strong>
                                {analysis.skill}
                              </strong>


                              {analysis.matched ? (

                                <span className="status-matched">
                                  MATCHED
                                </span>

                              ) : (

                                <span className="status-missing">
                                  MISSING
                                </span>

                              )}

                            </div>


                            <div className="analysis-details">


                              <div>

                                <small>
                                  Resume Context
                                </small>

                                <strong>
                                  {analysis.resumeContextScore ??
                                    0}/5
                                </strong>

                              </div>


                              <div>

                                <small>
                                  Job Context
                                </small>

                                <strong>
                                  {analysis.jobContextScore ??
                                    0}/5
                                </strong>

                              </div>


                              <div>

                                <small>
                                  Semantic Similarity
                                </small>

                                <strong>
                                  {(
                                    (analysis.semanticSimilarity ||
                                      0) *
                                    100
                                  ).toFixed(1)}
                                  %
                                </strong>

                              </div>


                              <div>

                                <small>
                                  Context Strength
                                </small>

                                <strong>
                                  {analysis.contextStrength ||
                                    "missing"}
                                </strong>

                              </div>

                            </div>

                          </div>

                        )
                      )}

                    </div>

                  ) : (

                    <p>
                      Detailed skill analysis is not
                      available for this result.
                    </p>

                  )}

                </div>


                {/* =================================================
                    AI RECOMMENDATIONS
                    ================================================= */}

                <div className="result-card recommendations-card">

                  <span className="result-label">
                    AI RECOMMENDATIONS
                  </span>


                  <p>
                    Practical suggestions generated
                    from your skill gaps, context
                    strength, and semantic matching.
                  </p>


                  <div className="recommendations-list">

                    {recommendations.length > 0 ? (

                      recommendations.map(
                        (recommendation, index) => (

                          <div
                            className="recommendation-item"
                            key={index}
                          >

                            <div className="recommendation-number">
                              {index + 1}
                            </div>


                            <p>
                              {recommendation}
                            </p>

                          </div>

                        )
                      )

                    ) : (

                      <div className="recommendation-item">

                        <div className="recommendation-number">
                          ✓
                        </div>

                        <p>
                          Your resume aligns well
                          with the provided job
                          description. Continue
                          highlighting measurable
                          achievements and relevant
                          projects.
                        </p>

                      </div>

                    )}

                  </div>

                </div>

              </div>

            ) : (

              /* =================================================
                 EMPTY PREVIEW
                 ================================================= */

              <div className="result-grid">


                <div className="result-card score-card">

                  <span className="result-label">
                    AI MATCH SCORE
                  </span>

                  <div className="score-visual">

                    <div
                      className="score-circle"
                      style={{
                        "--score": 0,
                      }}
                    >

                      <div className="score-circle-inner">

                        <strong>
                          --%
                        </strong>

                        <span>
                          job fit
                        </span>

                      </div>

                    </div>

                  </div>


                  <div className="score-status">
                    Waiting for analysis
                  </div>


                  <p>
                    Upload your resume and enter a
                    job description to calculate your
                    AI-powered match score.
                  </p>

                </div>


                <div className="result-card">

                  <span className="result-label">
                    MATCHED SKILLS
                  </span>


                  <div className="skill-placeholder">

                    <span>
                      React
                    </span>

                    <span>
                      Python
                    </span>

                    <span>
                      SQL
                    </span>

                  </div>


                  <p>
                    Skills that align with the job.
                  </p>

                </div>


                <div className="result-card">

                  <span className="result-label">
                    SKILL GAPS
                  </span>


                  <div className="skill-placeholder missing">

                    <span>
                      AWS
                    </span>

                    <span>
                      Docker
                    </span>

                  </div>


                  <p>
                    Skills that may require further
                    development.
                  </p>

                </div>

              </div>

            )}

          </section>

        </div>

      </main>


      {/* =================================================
          FOOTER
          ================================================= */}

      <footer>

        <div className="container">

          <p>
            ResumeAI — AI-powered resume intelligence.
          </p>

        </div>

      </footer>

    </div>
  );
}

export default App;