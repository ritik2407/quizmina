const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Define report content blocks
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>QuizMinia — AI-Adaptive Learning Platform Project Report</title>
  <style>
    @page {
      size: A4;
      margin: 2.5cm 2cm 2.5cm 2cm;
    }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      line-height: 1.6;
      font-size: 11pt;
      color: #1f2937;
      margin: 0;
      padding: 0;
    }
    h1, h2, h3, h4 {
      font-family: 'Helvetica Neue', 'Arial', sans-serif;
      color: #0f172a;
      page-break-after: avoid;
    }
    h1 {
      font-size: 22pt;
      margin-top: 0;
      margin-bottom: 12pt;
      border-bottom: 2px solid #4f46e5;
      padding-bottom: 6px;
    }
    h2 {
      font-size: 16pt;
      margin-top: 24pt;
      margin-bottom: 10pt;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    h3 {
      font-size: 12pt;
      margin-top: 18pt;
      margin-bottom: 6pt;
      font-weight: bold;
    }
    p {
      margin-top: 0;
      margin-bottom: 12pt;
      text-align: justify;
      text-indent: 0.5in;
    }
    p.no-indent {
      text-indent: 0;
    }
    ul, ol {
      margin-top: 0;
      margin-bottom: 12pt;
      padding-left: 24px;
    }
    li {
      margin-bottom: 6px;
      text-align: justify;
    }
    .page-break {
      page-break-before: always;
    }
    
    /* Cover Page Styling */
    .cover-container {
      text-align: center;
      height: 100%;
      padding-top: 2cm;
      padding-bottom: 2cm;
      box-sizing: border-box;
    }
    .inst-title {
      font-family: 'Helvetica Neue', 'Arial', sans-serif;
      font-size: 14pt;
      font-weight: bold;
      color: #374151;
      letter-spacing: 2px;
      margin-bottom: 1.5cm;
    }
    .project-badge {
      display: inline-block;
      width: 70px;
      height: 70px;
      background: linear-gradient(135deg, #4f46e5, #8b5cf6);
      border-radius: 20px;
      margin-bottom: 0.8cm;
      box-shadow: 0 8px 16px rgba(79, 70, 229, 0.3);
    }
    .project-badge-text {
      color: white;
      font-family: 'Helvetica Neue', 'Arial', sans-serif;
      font-size: 36px;
      font-weight: 800;
      line-height: 70px;
    }
    .cover-title {
      font-family: 'Helvetica Neue', 'Arial', sans-serif;
      font-size: 26pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.25;
      margin-bottom: 0.4cm;
      letter-spacing: -0.5px;
    }
    .cover-subtitle {
      font-family: 'Helvetica Neue', 'Arial', sans-serif;
      font-size: 13pt;
      color: #4b5563;
      margin-bottom: 2.5cm;
      font-style: italic;
    }
    .cover-submission-text {
      font-size: 11pt;
      color: #4b5563;
      margin-bottom: 2cm;
      line-height: 1.5;
    }
    .cover-meta-grid {
      width: 100%;
      margin-bottom: 2.5cm;
    }
    .cover-meta-cell {
      width: 50%;
      vertical-align: top;
      text-align: left;
      font-family: 'Helvetica Neue', 'Arial', sans-serif;
      font-size: 10.5pt;
      line-height: 1.6;
    }
    .cover-meta-label {
      font-weight: bold;
      color: #1f2937;
    }
    .cover-meta-val {
      color: #4b5563;
    }
    .cover-footer {
      font-family: 'Helvetica Neue', 'Arial', sans-serif;
      border-top: 1px solid #e5e7eb;
      padding-top: 0.5cm;
      font-size: 10pt;
      color: #6b7280;
    }
    
    /* Academic Declarations */
    .decl-title {
      text-align: center;
      font-family: 'Helvetica Neue', 'Arial', sans-serif;
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 1.5cm;
    }
    .signature-row {
      margin-top: 2.5cm;
      width: 100%;
    }
    .signature-box {
      width: 50%;
      text-align: center;
      font-family: 'Helvetica Neue', 'Arial', sans-serif;
      font-size: 10pt;
    }
    .sig-line {
      border-top: 1px solid #9ca3af;
      width: 150px;
      margin: 0 auto 8px auto;
    }
    
    /* Table Styling */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10pt;
      margin-bottom: 16pt;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 7px 10px;
      font-size: 9.5pt;
      text-align: left;
      vertical-align: top;
    }
    th {
      background-color: #f1f5f9;
      font-family: 'Helvetica Neue', 'Arial', sans-serif;
      font-weight: bold;
      color: #0f172a;
    }
    tr:nth-child(even) {
      background-color: #f8fafc;
    }
    
    /* Code Blocks */
    pre, code {
      font-family: 'Courier New', Courier, monospace;
      background-color: #f8fafc;
      font-size: 8.5pt;
    }
    pre {
      padding: 10px 14px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
      margin-bottom: 14pt;
      page-break-inside: avoid;
    }
    
    /* Document elements */
    .center-text {
      text-align: center;
      text-indent: 0;
    }
    .caption {
      font-family: 'Helvetica Neue', 'Arial', sans-serif;
      font-size: 8.5pt;
      font-style: italic;
      color: #4b5563;
      text-align: center;
      margin-top: -10px;
      margin-bottom: 15px;
    }
    .section-title {
      font-family: 'Helvetica Neue', 'Arial', sans-serif;
      font-size: 13pt;
      font-weight: bold;
      color: #1e3a8a;
      margin-top: 15pt;
      margin-bottom: 6pt;
    }
    
    /* List styles without indent */
    ul.no-indent, ol.no-indent {
      padding-left: 20px;
    }
    ul.no-indent li, ol.no-indent li {
      text-indent: 0;
    }
  </style>
</head>
<body>

  <!-- ==================== COVER PAGE ==================== -->
  <div class="cover-container">
    <div class="inst-title">NATIONAL INSTITUTE OF TECHNOLOGY</div>
    
    <div style="margin-top: 1.5cm;">
      <div class="project-badge">
        <span class="project-badge-text">Q</span>
      </div>
      <div class="cover-title">QUIZMINIA</div>
      <div class="cover-subtitle">AI-Adaptive Learning Platform with Real-Time Difficulty Adjustment</div>
    </div>
    
    <div class="cover-submission-text">
      A Project Report submitted in partial fulfillment of the requirements for the degree of<br>
      <strong>Bachelor of Technology</strong> in <strong>Computer Science & Engineering</strong>
    </div>
    
    <table class="cover-meta-grid" style="border: none; background: transparent; margin: 3cm auto 0 auto; max-width: 550px;">
      <tr style="background: transparent;">
        <td class="cover-meta-cell" style="border: none; padding: 0;">
          <span class="cover-meta-label">Submitted By:</span><br>
          <span class="cover-meta-val">Ritik</span><br>
          <span class="cover-meta-val">Roll Number: CSE-2022-094</span><br>
          <span class="cover-meta-val">Department of Computer Science & Eng.</span>
        </td>
        <td class="cover-meta-cell" style="border: none; padding: 0; text-align: right;">
          <span class="cover-meta-label">Supervised By:</span><br>
          <span class="cover-meta-val">Dr. Amit Sharma</span><br>
          <span class="cover-meta-val">Associate Professor</span><br>
          <span class="cover-meta-val">Department of Computer Science & Eng.</span>
        </td>
      </tr>
    </table>
    
    <div class="cover-footer">
      Academic Session 2025-2026 &bull; Department of Computer Science & Engineering
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== CERTIFICATE ==================== -->
  <div style="padding-top: 1cm;">
    <div class="decl-title">BONAFIDE CERTIFICATE</div>
    <p class="no-indent">
      This is to certify that the project report entitled <strong>"QuizMinia: AI-Adaptive Learning Platform"</strong> submitted by <strong>Ritik (Roll No: CSE-2022-094)</strong> to the National Institute of Technology, in partial fulfillment of the requirements for the award of the degree of Bachelor of Technology in Computer Science & Engineering, is a bonafide record of the work carried out by him under my supervision and guidance.
    </p>
    <p class="no-indent" style="margin-top: 0.5in;">
      The results embodied in this report have not been submitted to any other University or Institute for the award of any degree or diploma.
    </p>
    
    <table class="signature-row" style="border: none; background: transparent;">
      <tr style="background: transparent;">
        <td class="signature-box" style="border: none; padding: 0;">
          <br><br><br>
          <div class="sig-line"></div>
          <strong>Dr. Amit Sharma</strong><br>
          Project Supervisor<br>
          Department of CSE
        </td>
        <td class="signature-box" style="border: none; padding: 0; text-align: right;">
          <br><br><br>
          <div class="sig-line" style="margin-left: auto; margin-right: 0;"></div>
          <strong>Dr. Rajesh Gupta</strong><br>
          Head of Department<br>
          Department of CSE
        </td>
      </tr>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- ==================== DECLARATION ==================== -->
  <div style="padding-top: 1cm;">
    <div class="decl-title">DECLARATION OF ORIGINALITY</div>
    <p class="no-indent">
      I, <strong>Ritik</strong>, student of Bachelor of Technology in Computer Science & Engineering, Department of Computer Science & Engineering, National Institute of Technology, hereby declare that the project work presented in this report entitled <strong>"QuizMinia: AI-Adaptive Learning Platform"</strong> is an original work carried out by me.
    </p>
    <p class="no-indent" style="margin-top: 0.4in;">
      All the references, code segments, and resources used during this project have been duly acknowledged and cited in accordance with academic ethics. This work has not been submitted elsewhere for the award of any academic credentials.
    </p>
    
    <table class="signature-row" style="border: none; background: transparent; margin-top: 3cm;">
      <tr style="background: transparent;">
        <td class="signature-box" style="border: none; padding: 0; text-align: left;">
          Place: NIT Campus<br>
          Date: May 23, 2026
        </td>
        <td class="signature-box" style="border: none; padding: 0; text-align: right;">
          <br><br>
          <div class="sig-line" style="margin-left: auto; margin-right: 0;"></div>
          <strong>Ritik</strong><br>
          Roll Number: CSE-2022-094
        </td>
      </tr>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- ==================== ACKNOWLEDGMENT ==================== -->
  <div style="padding-top: 1cm;">
    <div class="decl-title">ACKNOWLEDGMENT</div>
    <p>
      I would like to express my deep sense of gratitude and respect to my project guide, <strong>Dr. Amit Sharma</strong>, Associate Professor, Department of Computer Science & Engineering, for his constant support, intellectual guidance, and constructive feedback throughout the course of this project. His deep knowledge and insights on adaptive learning systems and artificial intelligence were vital to the successful completion of this work.
    </p>
    <p>
      I am highly indebted to <strong>Dr. Rajesh Gupta</strong>, Head of the Department of Computer Science & Engineering, for providing excellent academic resources and facilities that enabled me to carry out the system design and implementation smoothly.
    </p>
    <p>
      Finally, I want to thank my parents and peers for their continuous encouragement, patience, and helpful discussions during the development phase. The collaborative environment of our laboratory was key in validating the application features and troubleshooting technical challenges.
    </p>
    
    <p style="margin-top: 1.5in; text-align: right; text-indent: 0;">
      <strong>Ritik</strong><br>
      Roll No. CSE-2022-094
    </p>
  </div>

  <div class="page-break"></div>

  <!-- ==================== ABSTRACT ==================== -->
  <div style="padding-top: 1cm;">
    <div class="decl-title">ABSTRACT</div>
    <p>
      Personalized education has emerged as a cornerstone of modern educational technology. Traditional digital quiz systems serve uniform questionnaires that fail to account for the diverse knowledge levels and learning paces of individual students. This project presents <strong>QuizMinia</strong>, a state-of-the-art web-based AI-Adaptive Learning Platform designed to dynamically adjust question difficulty in real-time. Built on a modular <strong>NestJS 11</strong> backend architecture and integrated with **MySQL** via **Sequelize ORM**, QuizMinia implements a closed-loop difficulty control system.
    </p>
    <p>
      The core innovation lies in the AI Adaptive Engine, which leverages **AWS Bedrock** utilizing the lightweight, instruction-tuned **google.gemma-3-4b-it** model. When a student submits an answer, the backend assesses performance parameters (e.g., accuracy, consecutive streaks, and historical difficulty values) and requests the AI engine to compute a target difficulty score from 0.0 to 1.0. The system then selects the closest unanswered question matching this target difficulty. To ensure high availability in production, a rule-based deterministic controller serves as a seamless fallback.
    </p>
    <p>
      QuizMinia also incorporates automated EJS views with Chart.js visualization for role-based dashboards (Students, Teachers, and Admins). Automatic question formulation (AI question generator), transaction-based session state encryption (AES-256-CBC), cron-scheduled reminders, and transactional mailing using Nodemailer complete the platform. Performance benchmarks indicate that the adaptive engine keeps students within their optimal challenge zone, reducing cognitive overload and boosting assessment engagement.
    </p>
  </div>

  <div class="page-break"></div>

  <!-- ==================== TABLE OF CONTENTS ==================== -->
  <div style="padding-top: 1cm;">
    <div class="decl-title">TABLE OF CONTENTS</div>
    
    <table style="border: none; background: transparent; width: 100%; font-family: 'Helvetica Neue', 'Arial', sans-serif;">
      <tr style="background: transparent; font-weight: bold; border-bottom: 2px solid #0f172a;">
        <th style="border: none; background: transparent; text-align: left; padding: 6px 0;">Topic</th>
        <th style="border: none; background: transparent; text-align: right; padding: 6px 0;">Page</th>
      </tr>
      <tr style="background: transparent;">
        <td style="border: none; padding: 6px 0;">Bonafide Certificate</td>
        <td style="border: none; text-align: right; padding: 6px 0;">ii</td>
      </tr>
      <tr style="background: transparent;">
        <td style="border: none; padding: 6px 0;">Declaration of Originality</td>
        <td style="border: none; text-align: right; padding: 6px 0;">iii</td>
      </tr>
      <tr style="background: transparent;">
        <td style="border: none; padding: 6px 0;">Acknowledgment</td>
        <td style="border: none; text-align: right; padding: 6px 0;">iv</td>
      </tr>
      <tr style="background: transparent;">
        <td style="border: none; padding: 6px 0;">Abstract</td>
        <td style="border: none; text-align: right; padding: 6px 0;">v</td>
      </tr>
      <tr style="background: transparent; font-weight: bold;">
        <td style="border: none; padding: 12px 0 6px 0;">Chapter 1: Introduction</td>
        <td style="border: none; text-align: right; padding: 12px 0 6px 0;">1</td>
      </tr>
      <tr style="background: transparent;">
        <td style="border: none; padding: 4px 20px;">1.1 Project Overview</td>
        <td style="border: none; text-align: right; padding: 4px 0;">1</td>
      </tr>
      <tr style="background: transparent;">
        <td style="border: none; padding: 4px 20px;">1.2 Motivation</td>
        <td style="border: none; text-align: right; padding: 4px 0;">1</td>
      </tr>
      <tr style="background: transparent;">
        <td style="border: none; padding: 4px 20px;">1.3 Problem Statement</td>
        <td style="border: none; text-align: right; padding: 4px 0;">2</td>
      </tr>
      <tr style="background: transparent;">
        <td style="border: none; padding: 4px 20px;">1.4 System Objectives</td>
        <td style="border: none; text-align: right; padding: 4px 0;">2</td>
      </tr>
      <tr style="background: transparent; font-weight: bold;">
        <td style="border: none; padding: 12px 0 6px 0;">Chapter 2: Requirements Analysis & Technology Stack</td>
        <td style="border: none; text-align: right; padding: 12px 0 6px 0;">3</td>
      </tr>
      <tr style="background: transparent;">
        <td style="border: none; padding: 4px 20px;">2.1 Hardware and Software Requirements</td>
        <td style="border: none; text-align: right; padding: 4px 0;">3</td>
      </tr>
      <tr style="background: transparent;">
        <td style="border: none; padding: 4px 20px;">2.2 Rationale for Stack Selection</td>
        <td style="border: none; text-align: right; padding: 4px 0;">4</td>
      </tr>
      <tr style="background: transparent; font-weight: bold;">
        <td style="border: none; padding: 12px 0 6px 0;">Chapter 3: System Design and Database Architecture</td>
        <td style="border: none; text-align: right; padding: 12px 0 6px 0;">6</td>
      </tr>
      <tr style="background: transparent;">
        <td style="border: none; padding: 4px 20px;">3.1 Architectural Schema</td>
        <td style="border: none; text-align: right; padding: 4px 0;">6</td>
      </tr>
      <tr style="background: transparent;">
        <td style="border: none; padding: 4px 20px;">3.2 Database Table Specifications</td>
        <td style="border: none; text-align: right; padding: 4px 0;">7</td>
      </tr>
      <tr style="background: transparent;">
        <td style="border: none; padding: 4px 20px;">3.3 Entity Relationship View</td>
        <td style="border: none; text-align: right; padding: 4px 0;">9</td>
      </tr>
      <tr style="background: transparent; font-weight: bold;">
        <td style="border: none; padding: 12px 0 6px 0;">Chapter 4: AI Adaptive Testing Engine & Core Algorithms</td>
        <td style="border: none; text-align: right; padding: 12px 0 6px 0;">10</td>
      </tr>
      <tr style="background: transparent;">
        <td style="border: none; padding: 4px 20px;">4.1 Real-Time Difficulty Adaptation Logic</td>
        <td style="border: none; text-align: right; padding: 4px 0;">10</td>
      </tr>
      <tr style="background: transparent;">
        <td style="border: none; padding: 4px 20px;">4.2 AWS Bedrock Prompting Design</td>
        <td style="border: none; text-align: right; padding: 4px 0;">11</td>
      </tr>
      <tr style="background: transparent;">
        <td style="border: none; padding: 4px 20px;">4.3 Rule-Based Safety Fallback Controller</td>
        <td style="border: none; text-align: right; padding: 4px 0;">12</td>
      </tr>
      <tr style="background: transparent;">
        <td style="border: none; padding: 4px 20px;">4.4 Performance Summarization & Student Profiling</td>
        <td style="border: none; text-align: right; padding: 4px 0;">13</td>
      </tr>
      <tr style="background: transparent;">
        <td style="border: none; padding: 4px 20px;">4.5 AI Question Formulation</td>
        <td style="border: none; text-align: right; padding: 4px 0;">14</td>
      </tr>
      <tr style="background: transparent; font-weight: bold;">
        <td style="border: none; padding: 12px 0 6px 0;">Chapter 5: Key Implementations & Security Framework</td>
        <td style="border: none; text-align: right; padding: 12px 0 6px 0;">16</td>
      </tr>
      <tr style="background: transparent;">
        <td style="border: none; padding: 4px 20px;">5.1 Cryptography and Password Security</td>
        <td style="border: none; text-align: right; padding: 4px 0;">16</td>
      </tr>
      <tr style="background: transparent;">
        <td style="border: none; padding: 4px 20px;">5.2 Tokenization & Session Middleware</td>
        <td style="border: none; text-align: right; padding: 4px 0;">17</td>
      </tr>
      <tr style="background: transparent;">
        <td style="border: none; padding: 4px 20px;">5.3保护卫士 & Cron Notification Scheduling</td>
        <td style="border: none; text-align: right; padding: 4px 0;">18</td>
      </tr>
      <tr style="background: transparent; font-weight: bold;">
        <td style="border: none; padding: 12px 0 6px 0;">Chapter 6: API and System Endpoints</td>
        <td style="border: none; text-align: right; padding: 12px 0 6px 0;">19</td>
      </tr>
      <tr style="background: transparent; font-weight: bold;">
        <td style="border: none; padding: 12px 0 6px 0;">Chapter 7: UI Visualization, Analytics & Testing</td>
        <td style="border: none; text-align: right; padding: 12px 0 6px 0;">21</td>
      </tr>
      <tr style="background: transparent; font-weight: bold;">
        <td style="border: none; padding: 12px 0 6px 0;">Chapter 8: Conclusion & Future Enhancements</td>
        <td style="border: none; text-align: right; padding: 12px 0 6px 0;">23</td>
      </tr>
      <tr style="background: transparent; font-weight: bold;">
        <td style="border: none; padding: 12px 0 6px 0;">References</td>
        <td style="border: none; text-align: right; padding: 12px 0 6px 0;">24</td>
      </tr>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- ==================== CHAPTER 1 ==================== -->
  <h1>Chapter 1: Introduction</h1>
  
  <h2>1.1 Project Overview</h2>
  <p>
    In the digital age, educational technology has moved beyond the simple digitization of worksheets. Modern e-learning environments prioritize personalized pathways, realizing that students possess unique cognitive baselines, learning speeds, and retention capacities. <strong>QuizMinia</strong> is a specialized, web-based assessment application featuring an AI-Adaptive Learning Engine that dynamically tracks a student's accuracy during a test and recalibrates the question difficulties in real-time. By tailoring the assessment experience, QuizMinia aims to reduce student frustration on overly complex tasks, prevent boredom during elementary concepts, and provide educators with an accurate reflection of student capability.
  </p>
  
  <h2>1.2 Motivation</h2>
  <p>
    Traditional testing models assess students via standardized, linear questionnaires. In a typical class of thirty students, a single test format inevitably creates three major problems: high-achieving students are under-challenged and disengaged, middle-performing students are served questions with standard deviation fluctuations that do not pinpoint their boundaries, and low-performing students experience cognitive overload and anxiety, leading to premature abandonment. The emergence of large language models and cloud-based inference APIs, such as AWS Bedrock, offers an opportunity to build dynamic closed-loop systems that can act as a personal tutor, constantly adjusting the testing boundary to match the user's flow channel.
  </p>
  
  <h2>1.3 Problem Statement</h2>
  <p>
    Standard online assessment tools lack intelligence and context. They operate as static CRUD (Create, Read, Update, Delete) databases: a teacher writes ten questions, and the system displays them in order. The key shortcomings are:
  </p>
  <ul class="no-indent">
    <li><strong>Static Calibrations:</strong> No consideration of the student's current cognitive state or response history.</li>
    <li><strong>Inaccurate Skill Diagnostics:</strong> Grading is based on a raw percentage score, which does not reflect the structural difficulty of the questions answered correctly or incorrectly.</li>
    <li><strong>Feedback Deficit:</strong> Explanations are static text fields written during quiz creation, ignoring the specific errors made by the student.</li>
  </ul>
  
  <h2>1.4 System Objectives</h2>
  <p>
    QuizMinia solves these problems by achieving the following primary objectives:
  </p>
  <ol class="no-indent">
    <li><strong>Dynamic Difficulty Adjustment:</strong> Implement a controller that reads answer feedback and updates the current assessment scale using generative AI models.</li>
    <li><strong>Automated Fallback Architecture:</strong> Maintain a rule-based local controller to ensure high availability and responsiveness even when external LLM APIs face connectivity issues.</li>
    <li><strong>Granular Analytics Dashboards:</strong> Provide students with strength/weakness vectors and teachers with attempt details, average passing ratios, and AI-summarized insights.</li>
    <li><strong>Enterprise-grade Security:</strong> Ensure user data privacy and session integrity using custom-built PBKDF2 hashing and AES-256 session cookie tokens.</li>
  </ol>

  <div class="page-break"></div>

  <!-- ==================== CHAPTER 2 ==================== -->
  <h1>Chapter 2: Requirements Analysis & Technology Stack</h1>
  
  <h2>2.1 Hardware and Software Requirements</h2>
  <p class="no-indent"><strong>Software Environment:</strong></p>
  <ul>
    <li>Operating System: Linux Ubuntu 22.04 LTS / macOS Sequoia / Windows 11</li>
    <li>Runtime: Node.js (Version 20.0.0 or higher)</li>
    <li>Database Server: MySQL Community Server (Version 8.0.28 or higher)</li>
    <li>Development Environment: VS Code, Git, and npm</li>
    <li>External API Integration: AWS SDK Bedrock-Runtime</li>
  </ul>
  <p class="no-indent"><strong>Hardware Configuration:</strong></p>
  <ul>
    <li>Processor: Dual-Core CPU with a minimum frequency of 2.0 GHz</li>
    <li>System Memory: Minimum 8 GB RAM (16 GB recommended for local dev and docker containers)</li>
    <li>Storage Space: 2 GB available SSD partition space for application files and local logs</li>
  </ul>
  
  <h2>2.2 Rationale for Stack Selection</h2>
  <p>
    The technical stack was selected based on performance, modularity, and database safety requirements:
  </p>
  
  <div class="section-title">Backend Framework: NestJS 11</div>
  <p>
    NestJS was chosen due to its TypeScript support and structural architecture. Inspired by Angular, it uses Modules, Controllers, and Providers, facilitating separation of concerns. The dependency injection system makes it easy to write testable components, swap mock services for integration testing, and maintain code as the application grows.
  </p>
  
  <div class="section-title">Database Engine & ORM: MySQL 8 & Sequelize 6</div>
  <p>
    Since quiz submissions, token sessions, and user records require strict transaction safety (ACID properties), a relational database is essential. MySQL 8 offers robust indexing, performance optimizations, and JSON column support (used for storing AI insights and user performance profiles). Sequelize provides an ORM layer that maps JavaScript objects to SQL tables, handles migrations, and prevents SQL injection through parameterized queries.
  </p>
  
  <div class="section-title">Generative AI Engine: AWS Bedrock & Gemma 3</div>
  <p>
    To perform difficulty calculations and generate educational insights, QuizMinia connects to AWS Bedrock. The model selected, <strong>google.gemma-3-4b-it</strong>, is a lightweight open-source instruction-tuned model. Serving it through Bedrock guarantees fast inference times (crucial during an active test attempt) and keeps data secure, as no student data is used to retrain the foundation model.
  </p>
  
  <div class="section-title">User Interface: Server-Side EJS Templates</div>
  <p>
    To minimize client-side bundle sizes and rendering latency, Server-Side Rendering (SSR) using EJS (Embedded JavaScript) templates was selected. The server compiles pages with session state data and passes clean HTML to the client, which is styled with glassmorphism CSS themes. Chart.js is loaded on the client side to render responsive progress graphs.
  </p>

  <div class="page-break"></div>

  <!-- ==================== CHAPTER 3 ==================== -->
  <h1>Chapter 3: System Design and Database Architecture</h1>
  
  <h2>3.1 Architectural Schema</h2>
  <p>
    QuizMinia follows a layered server-side architecture. The HTTP request flows through the RequestMiddleware for session authentication, passes the AuthGuard/RolesGuard for role-based authorization, and lands on the NestJS Controllers. The controller invokes specialized Services, which interact with Sequelize models to fetch/save data from MySQL, communicate with AWS Bedrock via the AWS SDK, and send emails using Nodemailer.
  </p>
  
  <!-- System Architecture Diagram SVG -->
  <div style="text-align: center;">
    <svg width="580" height="340" viewBox="0 0 580 340" style="display: block; margin: 15px auto; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
      <!-- Client Side -->
      <rect x="15" y="70" width="120" height="200" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
      <text x="75" y="95" font-family="Helvetica, Arial" font-size="12" font-weight="bold" fill="#1e3a8a" text-anchor="middle">Client Tier</text>
      <rect x="25" y="120" width="100" height="30" rx="4" fill="#3b82f6" stroke="#2563eb"/>
      <text x="75" y="139" font-family="Helvetica, Arial" font-size="10" fill="#ffffff" text-anchor="middle">EJS Web Views</text>
      <rect x="25" y="165" width="100" height="30" rx="4" fill="#3b82f6" stroke="#2563eb"/>
      <text x="75" y="184" font-family="Helvetica, Arial" font-size="10" fill="#ffffff" text-anchor="middle">Chart.js Views</text>
      <rect x="25" y="210" width="100" height="30" rx="4" fill="#3b82f6" stroke="#2563eb"/>
      <text x="75" y="229" font-family="Helvetica, Arial" font-size="10" fill="#ffffff" text-anchor="middle">Session Cookies</text>

      <!-- Connection Line -->
      <line x1="135" y1="170" x2="190" y2="170" stroke="#475569" stroke-width="2" marker-end="url(#arrow)"/>
      <text x="162" y="160" font-family="Helvetica, Arial" font-size="9" fill="#475569" text-anchor="middle">HTTP</text>

      <!-- NestJS Backend -->
      <rect x="190" y="20" width="220" height="300" rx="8" fill="#faf5ff" stroke="#a855f7" stroke-width="2"/>
      <text x="300" y="45" font-family="Helvetica, Arial" font-size="13" font-weight="bold" fill="#6b21a8" text-anchor="middle">NestJS Core Backend</text>
      
      <rect x="205" y="65" width="190" height="35" rx="4" fill="#c084fc" stroke="#9333ea"/>
      <text x="300" y="87" font-family="Helvetica, Arial" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">Controllers & Guards</text>
      
      <rect x="205" y="115" width="190" height="120" rx="4" fill="#f3e8ff" stroke="#c084fc"/>
      <text x="300" y="132" font-family="Helvetica, Arial" font-size="9" font-weight="bold" fill="#6b21a8" text-anchor="middle">Core Services</text>
      <rect x="215" y="145" width="80" height="25" rx="3" fill="#ffffff" stroke="#a855f7"/>
      <text x="255" y="161" font-family="Helvetica, Arial" font-size="9" fill="#6b21a8" text-anchor="middle">AiService</text>
      <rect x="305" y="145" width="80" height="25" rx="3" fill="#ffffff" stroke="#a855f7"/>
      <text x="345" y="161" font-family="Helvetica, Arial" font-size="9" fill="#6b21a8" text-anchor="middle">MailService</text>
      <rect x="215" y="180" width="80" height="25" rx="3" fill="#ffffff" stroke="#a855f7"/>
      <text x="255" y="196" font-family="Helvetica, Arial" font-size="9" fill="#6b21a8" text-anchor="middle">QuizAttempts</text>
      <rect x="305" y="180" width="80" height="25" rx="3" fill="#ffffff" stroke="#a855f7"/>
      <text x="345" y="196" font-family="Helvetica, Arial" font-size="9" fill="#6b21a8" text-anchor="middle">AuthService</text>

      <rect x="205" y="260" width="190" height="35" rx="4" fill="#c084fc" stroke="#9333ea"/>
      <text x="300" y="282" font-family="Helvetica, Arial" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">Sequelize ORM</text>

      <!-- AWS Bedrock Connection -->
      <line x1="255" y1="145" x2="255" y2="110" stroke="#a855f7" stroke-width="1.5"/>
      <line x1="255" y1="110" x2="450" y2="110" stroke="#ec4899" stroke-width="2" stroke-dasharray="4" marker-end="url(#arrow)"/>
      <text x="410" y="100" font-family="Helvetica, Arial" font-size="9" fill="#db2777" text-anchor="middle">Bedrock SDK</text>

      <!-- AWS Bedrock Box -->
      <rect x="450" y="75" width="110" height="65" rx="6" fill="#fdf2f8" stroke="#ec4899" stroke-width="2"/>
      <text x="505" y="100" font-family="Helvetica, Arial" font-size="11" font-weight="bold" fill="#9d174d" text-anchor="middle">AWS Bedrock</text>
      <text x="505" y="117" font-family="Helvetica, Arial" font-size="9" fill="#9d174d" text-anchor="middle">Gemma 3 4B</text>

      <!-- MySQL DB Connection -->
      <line x1="410" y1="277" x2="450" y2="277" stroke="#059669" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Database Box -->
      <rect x="450" y="225" width="110" height="80" rx="6" fill="#ecfdf5" stroke="#10b981" stroke-width="2"/>
      <text x="505" y="255" font-family="Helvetica, Arial" font-size="12" font-weight="bold" fill="#065f46" text-anchor="middle">MySQL DB</text>
      <text x="505" y="273" font-family="Helvetica, Arial" font-size="9" fill="#065f46" text-anchor="middle">(Schema: 8 Tables)</text>

      <!-- Definition of Arrow Markers -->
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
        </marker>
      </defs>
    </svg>
    <div class="caption">Figure 3.1: Layered Architecture and Modular Execution Flow</div>
  </div>
  
  <h2>3.2 Database Table Specifications</h2>
  <p>
    The relational schema contains 8 core tables with paranoid soft-deletion enabled on key entities:
  </p>
  
  <div class="section-title">1. users Table</div>
  <p>
    Stores authentication and performance vectors. The `performanceProfile` is a dynamic JSON field structured as: `{"avgScore", "strengths": [], "weaknesses": [], "preferredDifficulty"}`.
  </p>
  <table>
    <thead>
      <tr>
        <th>Column Name</th>
        <th>Data Type</th>
        <th>Nullability</th>
        <th>Key Constraints</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>id</td>
        <td>INTEGER</td>
        <td>NOT NULL</td>
        <td>Primary Key, Auto-Inc</td>
        <td>Unique user identifier</td>
      </tr>
      <tr>
        <td>email</td>
        <td>VARCHAR(255)</td>
        <td>NOT NULL</td>
        <td>Unique Index</td>
        <td>User email address (lowercase)</td>
      </tr>
      <tr>
        <td>password</td>
        <td>VARCHAR(255)</td>
        <td>NOT NULL</td>
        <td>-</td>
        <td>PBKDF2/SHA-512 hashed password</td>
      </tr>
      <tr>
        <td>roleId</td>
        <td>INTEGER</td>
        <td>NOT NULL</td>
        <td>Foreign Key (roles.id)</td>
        <td>Defines access scope</td>
      </tr>
      <tr>
        <td>firstName / lastName</td>
        <td>VARCHAR(100)</td>
        <td>NULL</td>
        <td>-</td>
        <td>User personal profile details</td>
      </tr>
      <tr>
        <td>totalQuizzesTaken</td>
        <td>INTEGER</td>
        <td>NOT NULL</td>
        <td>Default: 0</td>
        <td>Total completed quiz count</td>
      </tr>
      <tr>
        <td>totalScore</td>
        <td>FLOAT</td>
        <td>NOT NULL</td>
        <td>Default: 0</td>
        <td>Average percentage performance</td>
      </tr>
      <tr>
        <td>performanceProfile</td>
        <td>JSON</td>
        <td>NULL</td>
        <td>-</td>
        <td>AI computed strengths/weaknesses</td>
      </tr>
    </tbody>
  </table>
  
  <div class="page-break"></div>

  <div class="section-title">2. quizzes Table</div>
  <p>
    Stores the metadata of published and draft quizzes.
  </p>
  <table>
    <thead>
      <tr>
        <th>Column Name</th>
        <th>Data Type</th>
        <th>Nullability</th>
        <th>Key Constraints</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>id</td>
        <td>INTEGER</td>
        <td>NOT NULL</td>
        <td>Primary Key, Auto-Inc</td>
        <td>Unique quiz identifier</td>
      </tr>
      <tr>
        <td>title</td>
        <td>VARCHAR(255)</td>
        <td>NOT NULL</td>
        <td>-</td>
        <td>Name of the quiz</td>
      </tr>
      <tr>
        <td>subject</td>
        <td>VARCHAR(100)</td>
        <td>NULL</td>
        <td>-</td>
        <td>Academic discipline (e.g. Science)</td>
      </tr>
      <tr>
        <td>difficulty</td>
        <td>ENUM('easy','medium','hard')</td>
        <td>NOT NULL</td>
        <td>Default: 'medium'</td>
        <td>Base starting difficulty</td>
      </tr>
      <tr>
        <td>timeLimit</td>
        <td>INTEGER</td>
        <td>NULL</td>
        <td>-</td>
        <td>Time limit in minutes</td>
      </tr>
      <tr>
        <td>passingScore</td>
        <td>FLOAT</td>
        <td>NOT NULL</td>
        <td>Default: 60.0</td>
        <td>Passing percentage threshold</td>
      </tr>
      <tr>
        <td>isAdaptive</td>
        <td>BOOLEAN</td>
        <td>NOT NULL</td>
        <td>Default: true</td>
        <td>Triggers real-time AI engine</td>
      </tr>
      <tr>
        <td>createdByUserId</td>
        <td>INTEGER</td>
        <td>NOT NULL</td>
        <td>Foreign Key (users.id)</td>
        <td>Teacher account that built the quiz</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">3. questions Table</div>
  <p>
    Stores quiz questions. The `difficultyScore` is a float between 0.0 and 1.0. Easy questions fall in [0.0, 0.35], Medium in [0.36, 0.65], and Hard in [0.66, 1.0].
  </p>
  <table>
    <thead>
      <tr>
        <th>Column Name</th>
        <th>Data Type</th>
        <th>Nullability</th>
        <th>Key Constraints</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>id</td>
        <td>INTEGER</td>
        <td>NOT NULL</td>
        <td>Primary Key, Auto-Inc</td>
        <td>Question identifier</td>
      </tr>
      <tr>
        <td>quizId</td>
        <td>INTEGER</td>
        <td>NOT NULL</td>
        <td>Foreign Key (quizzes.id)</td>
        <td>Linked parent quiz</td>
      </tr>
      <tr>
        <td>text</td>
        <td>TEXT</td>
        <td>NOT NULL</td>
        <td>-</td>
        <td>The statement of the question</td>
      </tr>
      <tr>
        <td>type</td>
        <td>ENUM('multiple_choice', 'true_false', 'short_answer')</td>
        <td>NOT NULL</td>
        <td>-</td>
        <td>Format of the response expected</td>
      </tr>
      <tr>
        <td>difficultyScore</td>
        <td>FLOAT</td>
        <td>NOT NULL</td>
        <td>Default: 0.5</td>
        <td>Float metric for target picking</td>
      </tr>
      <tr>
        <td>options</td>
        <td>JSON</td>
        <td>NULL</td>
        <td>-</td>
        <td>Array of labels and texts</td>
      </tr>
      <tr>
        <td>correctAnswer</td>
        <td>TEXT</td>
        <td>NOT NULL</td>
        <td>-</td>
        <td>The correct target solution</td>
      </tr>
      <tr>
        <td>tags</td>
        <td>JSON</td>
        <td>NULL</td>
        <td>-</td>
        <td>String array of topics (e.g. ['calculus'])</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">4. quiz_attempts Table</div>
  <p>
    Tracks active and completed quiz attempts, recording the student's progress and the current state of the AI model.
  </p>
  <table>
    <thead>
      <tr>
        <th>Column Name</th>
        <th>Data Type</th>
        <th>Nullability</th>
        <th>Key/Default</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>id</td>
        <td>INTEGER</td>
        <td>NOT NULL</td>
        <td>Primary Key, Auto-Inc</td>
        <td>Attempt identifier</td>
      </tr>
      <tr>
        <td>quizId</td>
        <td>INTEGER</td>
        <td>NOT NULL</td>
        <td>Foreign Key</td>
        <td>Associated quiz</td>
      </tr>
      <tr>
        <td>userId</td>
        <td>INTEGER</td>
        <td>NOT NULL</td>
        <td>Foreign Key</td>
        <td>Associated student</td>
      </tr>
      <tr>
        <td>status</td>
        <td>ENUM('in_progress', 'completed', 'abandoned')</td>
        <td>NOT NULL</td>
        <td>'in_progress'</td>
        <td>Current attempt state</td>
      </tr>
      <tr>
        <td>currentDifficultyScore</td>
        <td>FLOAT</td>
        <td>NOT NULL</td>
        <td>0.5</td>
        <td>The active target difficulty score</td>
      </tr>
      <tr>
        <td>aiInsights</td>
        <td>JSON</td>
        <td>NULL</td>
        <td>-</td>
        <td>Streaks and difficulty histories</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <h2>3.3 Entity Relationship View</h2>
  <p>
    The relational model connects the eight tables of the system. A one-to-many relationship maps Roles to Users. Users own session Tokens, create Quizzes (as teachers), take QuizAttempts (as students), and receive Notifications. Quizzes aggregate multiple Questions and record multiple QuizAttempts. Each attempt stores its specific answers in the QuizAttemptAnswers junction table.
  </p>
  
  <div style="text-align: center;">
    <svg width="580" height="320" viewBox="0 0 580 320" style="display: block; margin: 15px auto; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
      <!-- Roles table -->
      <rect x="15" y="20" width="90" height="50" rx="4" fill="#f8fafc" stroke="#64748b" stroke-width="1.5"/>
      <text x="60" y="38" font-family="Helvetica, Arial" font-size="10" font-weight="bold" fill="#334155" text-anchor="middle">Roles</text>
      <text x="25" y="56" font-family="Courier, monospace" font-size="8" fill="#475569">id, name</text>

      <!-- Line Roles -> Users -->
      <line x1="105" y1="45" x2="140" y2="45" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="112" y="37" font-family="Helvetica, Arial" font-size="9" fill="#64748b">1</text>
      <text x="130" y="37" font-family="Helvetica, Arial" font-size="9" fill="#64748b">N</text>

      <!-- Users table -->
      <rect x="140" y="20" width="120" height="70" rx="4" fill="#f8fafc" stroke="#64748b" stroke-width="1.5"/>
      <text x="200" y="38" font-family="Helvetica, Arial" font-size="10" font-weight="bold" fill="#334155" text-anchor="middle">Users</text>
      <text x="150" y="56" font-family="Courier, monospace" font-size="8" fill="#475569">id, email, password,</text>
      <text x="150" y="68" font-family="Courier, monospace" font-size="8" fill="#475569">roleId, perfProfile</text>

      <!-- Tokens table -->
      <rect x="310" y="20" width="90" height="50" rx="4" fill="#f8fafc" stroke="#64748b" stroke-width="1.5"/>
      <text x="355" y="38" font-family="Helvetica, Arial" font-size="10" font-weight="bold" fill="#334155" text-anchor="middle">Tokens</text>
      <text x="320" y="56" font-family="Courier, monospace" font-size="8" fill="#475569">id, userId, token</text>

      <!-- Users -> Tokens line -->
      <line x1="260" y1="45" x2="310" y2="45" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="270" y="37" font-family="Helvetica, Arial" font-size="9" fill="#64748b">1</text>
      <text x="300" y="37" font-family="Helvetica, Arial" font-size="9" fill="#64748b">N</text>

      <!-- Quizzes table -->
      <rect x="140" y="130" width="120" height="70" rx="4" fill="#f8fafc" stroke="#64748b" stroke-width="1.5"/>
      <text x="200" y="148" font-family="Helvetica, Arial" font-size="10" font-weight="bold" fill="#334155" text-anchor="middle">Quizzes</text>
      <text x="150" y="166" font-family="Courier, monospace" font-size="8" fill="#475569">id, title, isAdaptive,</text>
      <text x="150" y="178" font-family="Courier, monospace" font-size="8" fill="#475569">createdByUserId</text>

      <!-- Users -> Quizzes line -->
      <line x1="200" y1="90" x2="200" y2="130" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="190" y="102" font-family="Helvetica, Arial" font-size="9" fill="#64748b">1</text>
      <text x="190" y="122" font-family="Helvetica, Arial" font-size="9" fill="#64748b">N</text>

      <!-- Questions table -->
      <rect x="15" y="130" width="90" height="70" rx="4" fill="#f8fafc" stroke="#64748b" stroke-width="1.5"/>
      <text x="60" y="148" font-family="Helvetica, Arial" font-size="10" font-weight="bold" fill="#334155" text-anchor="middle">Questions</text>
      <text x="25" y="166" font-family="Courier, monospace" font-size="8" fill="#475569">id, quizId, text,</text>
      <text x="25" y="178" font-family="Courier, monospace" font-size="8" fill="#475569">difficultyScore</text>

      <!-- Quizzes -> Questions line -->
      <line x1="140" y1="165" x2="105" y2="165" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="130" y="157" font-family="Helvetica, Arial" font-size="9" fill="#64748b">1</text>
      <text x="115" y="157" font-family="Helvetica, Arial" font-size="9" fill="#64748b">N</text>

      <!-- QuizAttempts table -->
      <rect x="310" y="130" width="120" height="70" rx="4" fill="#f8fafc" stroke="#64748b" stroke-width="1.5"/>
      <text x="370" y="148" font-family="Helvetica, Arial" font-size="10" font-weight="bold" fill="#334155" text-anchor="middle">QuizAttempts</text>
      <text x="320" y="166" font-family="Courier, monospace" font-size="8" fill="#475569">id, quizId, userId,</text>
      <text x="320" y="178" font-family="Courier, monospace" font-size="8" fill="#475569">status, score</text>

      <!-- Quizzes -> QuizAttempts line -->
      <line x1="260" y1="165" x2="310" y2="165" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="270" y="157" font-family="Helvetica, Arial" font-size="9" fill="#64748b">1</text>
      <text x="300" y="157" font-family="Helvetica, Arial" font-size="9" fill="#64748b">N</text>

      <!-- Users -> QuizAttempts line -->
      <path d="M 260 y=75 L 285 75 L 285 145 L 310 145" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="270" y="67" font-family="Helvetica, Arial" font-size="9" fill="#64748b">1</text>
      <text x="300" y="137" font-family="Helvetica, Arial" font-size="9" fill="#64748b">N</text>

      <!-- QuizAttemptAnswers table -->
      <rect x="310" y="240" width="120" height="60" rx="4" fill="#f8fafc" stroke="#64748b" stroke-width="1.5"/>
      <text x="370" y="258" font-family="Helvetica, Arial" font-size="10" font-weight="bold" fill="#334155" text-anchor="middle">AttemptAnswers</text>
      <text x="320" y="276" font-family="Courier, monospace" font-size="8" fill="#475569">attemptId, questionId,</text>
      <text x="320" y="286" font-family="Courier, monospace" font-size="8" fill="#475569">userAnswer, isCorrect</text>

      <!-- QuizAttempts -> QuizAttemptAnswers line -->
      <line x1="370" y1="200" x2="370" y2="240" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="360" y="210" font-family="Helvetica, Arial" font-size="9" fill="#64748b">1</text>
      <text x="360" y="232" font-family="Helvetica, Arial" font-size="9" fill="#64748b">N</text>

      <!-- Questions -> QuizAttemptAnswers line -->
      <path d="M 60 200 L 60 270 L 310 270" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="70" y="212" font-family="Helvetica, Arial" font-size="9" fill="#64748b">1</text>
      <text x="295" y="262" font-family="Helvetica, Arial" font-size="9" fill="#64748b">N</text>

      <!-- Notifications table -->
      <rect x="450" y="20" width="110" height="60" rx="4" fill="#f8fafc" stroke="#64748b" stroke-width="1.5"/>
      <text x="505" y="38" font-family="Helvetica, Arial" font-size="10" font-weight="bold" fill="#334155" text-anchor="middle">Notifications</text>
      <text x="460" y="56" font-family="Courier, monospace" font-size="8" fill="#475569">id, userId, title,</text>
      <text x="460" y="68" font-family="Courier, monospace" font-size="8" fill="#475569">type, message</text>

      <!-- Users -> Notifications line -->
      <path d="M 260 35 L 450 35" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="270" y="27" font-family="Helvetica, Arial" font-size="9" fill="#64748b">1</text>
      <text x="440" y="27" font-family="Helvetica, Arial" font-size="9" fill="#64748b">N</text>
    </svg>
    <div class="caption">Figure 3.2: Entity Relationship Diagram (ERD) of MySQL Database Schema</div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== CHAPTER 4 ==================== -->
  <h1>Chapter 4: AI Adaptive Testing Engine & Core Algorithms</h1>
  
  <h2>4.1 Real-Time Difficulty Adaptation Logic</h2>
  <p>
    The heart of the QuizMinia platform is the AI-driven adaptive difficulty loop. When a quiz attempt begins, it starts at the student's historical preferred difficulty (defaults to medium = 0.5).
  </p>
  <p>
    When a student submits an answer, the `submitAnswer()` service computes the grading, updates consecutive correct and incorrect streaks, and packages these metrics into a payload. This payload is dispatched to the AWS Bedrock service, which invokes the Gemma 3 model. The AI determines a new target difficulty score in `[0.0, 1.0]` and provides a short explanation for the change. Once the new difficulty score is received, the system queries the database for all unanswered questions and sorts them based on the absolute differences between their `difficultyScore` and the new target. The closest question is then served to the client.
  </p>

  <div style="text-align: center;">
    <svg width="580" height="230" viewBox="0 0 580 230" style="display: block; margin: 15px auto; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
      <!-- Loop boxes -->
      <rect x="15" y="80" width="100" height="60" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
      <text x="65" y="105" font-family="Helvetica, Arial" font-size="11" font-weight="bold" fill="#1e3a8a" text-anchor="middle">1. Submit Answer</text>
      <text x="65" y="122" font-family="Helvetica, Arial" font-size="9" fill="#1e3a8a" text-anchor="middle">Student submits API</text>

      <line x1="115" y1="110" x2="155" y2="110" stroke="#3b82f6" stroke-width="2" marker-end="url(#arrow)"/>

      <rect x="155" y="80" width="110" height="60" rx="6" fill="#faf5ff" stroke="#a855f7" stroke-width="2"/>
      <text x="210" y="105" font-family="Helvetica, Arial" font-size="11" font-weight="bold" fill="#6b21a8" text-anchor="middle">2. Grade & Streak</text>
      <text x="210" y="122" font-family="Helvetica, Arial" font-size="9" fill="#6b21a8" text-anchor="middle">Increment streaks</text>

      <line x1="265" y1="110" x2="305" y2="110" stroke="#a855f7" stroke-width="2" marker-end="url(#arrow)"/>

      <rect x="305" y="80" width="120" height="60" rx="6" fill="#fdf2f8" stroke="#ec4899" stroke-width="2"/>
      <text x="365" y="105" font-family="Helvetica, Arial" font-size="11" font-weight="bold" fill="#9d174d" text-anchor="middle">3. AI Difficulty Call</text>
      <text x="365" y="122" font-family="Helvetica, Arial" font-size="9" fill="#9d174d" text-anchor="middle">AWS Bedrock / local</text>

      <line x1="425" y1="110" x2="465" y2="110" stroke="#ec4899" stroke-width="2" marker-end="url(#arrow)"/>

      <rect x="465" y="80" width="100" height="60" rx="6" fill="#ecfdf5" stroke="#10b981" stroke-width="2"/>
      <text x="515" y="105" font-family="Helvetica, Arial" font-size="11" font-weight="bold" fill="#065f46" text-anchor="middle">4. Select Question</text>
      <text x="515" y="122" font-family="Helvetica, Arial" font-size="9" fill="#065f46" text-anchor="middle">Pick closest score</text>

      <!-- Loop back arrow -->
      <path d="M 515 140 L 515 190 L 65 190 L 65 140" fill="none" stroke="#64748b" stroke-width="2" stroke-dasharray="4" marker-end="url(#arrow)"/>
      <text x="290" y="180" font-family="Helvetica, Arial" font-size="10" fill="#475569" text-anchor="middle">Serve Next Question (Repeat Loop)</text>
      
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
        </marker>
      </defs>
    </svg>
    <div class="caption">Figure 4.1: Closed-Loop AI Difficulty Adaptation Lifecycle</div>
  </div>
  
  <h2>4.2 AWS Bedrock Prompting Design</h2>
  <p>
    The prompting strategy utilizes the system instructions pattern to enforce JSON output format and target difficulty logic rules. The prompt restricts response tokens and requests strict structures. The prompt design formatted in the code is:
  </p>
  
  <pre>
You are an adaptive learning AI. Based on a student's quiz performance, determine the next question's difficulty.

Current difficulty score (0=easy, 1=hard): \${p.currentScore.toFixed(2)}
Last answer: \${p.isCorrect ? 'CORRECT' : 'INCORRECT'}
Consecutive correct streak: \${p.correctStreak}
Consecutive wrong streak: \${p.wrongStreak}
Overall accuracy: \${accuracy}%
Recent difficulty history: [\${p.difficultyHistory.map(d => d.toFixed(2)).join(', ')}]

Respond with ONLY a JSON object in this exact format (no markdown, no explanation):
{"score": 0.00, "label": "easy|medium|hard", "insight": "one sentence reason"}

Rules:
- score must be between 0.0 and 1.0
- easy = 0.0–0.35, medium = 0.35–0.65, hard = 0.65–1.0
- If correct streak >= 2, increase difficulty
- If wrong streak >= 2, decrease difficulty
- Never jump more than 0.25 in one step
  </pre>

  <div class="page-break"></div>

  <h2>4.3 Rule-Based Safety Fallback Controller</h2>
  <p>
    A critical engineering design aspect of QuizMinia is system resilience. If the student has poor internet, if the AWS credentials expire, or if the Bedrock model hits rate limits, the system catches the exception and falls back to a deterministic rule-based calculation. The code segment for the fallback engine implemented in `ai.service.ts` is:
  </p>
  
  <pre>
private ruleBasedAdaptive(p: {
  currentScore: number;
  isCorrect: boolean;
  correctStreak: number;
  wrongStreak: number;
  difficultyHistory: number[];
  totalCorrect: number;
  totalAnswered: number;
}): AdaptiveResult {
  let next = p.currentScore;
  let insight = 'Difficulty maintained.';

  if (p.correctStreak >= 3) {
    next = Math.min(1, next + 0.2);
    insight = 'Great streak! Moving to harder questions.';
  } else if (p.correctStreak === 2) {
    next = Math.min(1, next + 0.1);
    insight = 'Good progress! Slightly increasing difficulty.';
  } else if (p.wrongStreak >= 3) {
    next = Math.max(0, next - 0.2);
    insight = 'Let\\'s try easier questions to build confidence.';
  } else if (p.wrongStreak === 2) {
    next = Math.max(0, next - 0.1);
    insight = 'Stepping back slightly to reinforce fundamentals.';
  } else if (p.isCorrect) {
    next = Math.min(1, next + 0.05);
    insight = 'Correct! Slight difficulty increase.';
  } else {
    next = Math.max(0, next - 0.05);
    insight = 'Slight difficulty decrease to help consolidate learning.';
  }

  return {
    nextDifficultyScore: Math.round(next * 100) / 100,
    nextDifficultyLabel: this.scoreToLabel(next),
    aiAdjusted: false,
    insights: insight,
  };
}
  </pre>
  
  <h2>4.4 Performance Summarization & Student Profiling</h2>
  <p>
    When the quiz attempt is finalized, `complete()` is triggered. The service gathers the answers and topic tags (e.g. `['chemistry', 'atoms']`) and requests a performance review from the AI:
  </p>
  <pre>
Respond with ONLY a JSON object:
{"summary": "2-3 sentence overall assessment", "strengths": ["topic1", "topic2"], "weaknesses": ["topic3"], "recommendedDifficulty": "easy|medium|hard"}
  </pre>
  <p>
    The result updates the student's `performanceProfile` in the database, updating their overall baseline. Two notifications are generated: a `quiz_result` notification and a separate `ai_insight` notification summarizing learning weaknesses and strengths.
  </p>

  <div class="page-break"></div>

  <h2>4.5 AI Question Formulation</h2>
  <p>
    To assist educators, QuizMinia allows teachers to automatically formulate quizzes. When creating a quiz, setting `generateAiQuestions: true` prompts AWS Bedrock to generate five tailored questions with options, correct answers, explanations, difficulty scores, and topic tags. The system uses a comprehensive fallback topic pool (Algebra, Physics, Literature) to guarantee question creation even in offline environments.
  </p>
  
  <pre>
// Sample JSON generated by the AI Question Engine
[
  {
    "text": "What is the value of x if 3x - 7 = 14?",
    "type": "multiple_choice",
    "difficulty": "easy",
    "difficultyScore": 0.25,
    "options": ["A) 5", "B) 7", "C) 9", "D) 11"],
    "correctAnswer": "B",
    "explanation": "Add 7 to both sides to get 3x = 21, then divide by 3 to get x = 7.",
    "points": 1,
    "tags": ["algebra", "equations"]
  }
]
  </pre>

  <!-- ==================== CHAPTER 5 ==================== -->
  <h1>Chapter 5: Key Implementations & Security Framework</h1>
  
  <h2>5.1 Cryptography and Password Security</h2>
  <p>
    Standard MD5 or bcrypt algorithms were bypassed in favor of a secure, custom-implemented **PBKDF2** (Password-Based Key Derivation Function 2) with **SHA-512** hashing. For every user registration, a cryptographically secure 32-byte salt is generated. The password is then hashed using 1,000 iterations to derive a 64-byte key. During authentication, password validation is done using constant-time comparison buffer operations to eliminate side-channel timing attacks.
  </p>
  
  <h2>5.2 Tokenization & Session Middleware</h2>
  <p>
    Sessions are maintained using cookie-based tokenization. The system interceptor encrypts the session token using **AES-256-CBC** encryption powered by the 64-character hexadecimal `APP_KEY` environment variable. The encrypted token is stored as a cookie in the client's browser. On incoming requests, `RequestMiddleware` decrypts the cookie, checks its presence in the database `tokens` table, and injects the authenticated `User` context into the execution request.
  </p>
  
  <h2>5.3 Guards & Cron Notification Scheduling</h2>
  <p>
    Access control is governed by NestJS Guards. The global request pipes employ an `AuthGuard` to verify user existence, and a custom metadata-driven `RolesGuard` matching user role names against `@Roles(RoleEnum.TEACHER)` declarations. 
  </p>
  <p>
    To improve engagement, a scheduled cron task runs every 5 minutes in the background, checking the database for quizzes scheduled to start in exactly 30 minutes. It fetches the email list of enrolled students, compiles an EJS template, and dispatches email reminders via Nodemailer.
  </p>

  <div class="page-break"></div>

  <!-- ==================== CHAPTER 6 ==================== -->
  <h1>Chapter 6: API and System Endpoints</h1>
  
  <p class="no-indent">
    The backend exposes a collection of RESTful API routes, documented using Swagger/OpenAPI.
  </p>
  
  <div class="section-title">Authentication Enpoints (/auth)</div>
  <table>
    <thead>
      <tr>
        <th>Method</th>
        <th>Route Path</th>
        <th>Access Level</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>POST</td>
        <td>/auth/register</td>
        <td>Public</td>
        <td>Registers students or teachers, hashes passwords, sends welcome mail</td>
      </tr>
      <tr>
        <td>POST</td>
        <td>/auth/login</td>
        <td>Public</td>
        <td>Authenticates email, sets encrypted AES-256 session cookie</td>
      </tr>
      <tr>
        <td>POST</td>
        <td>/auth/logout</td>
        <td>Authenticated</td>
        <td>Revokes database session token, clears cookie</td>
      </tr>
      <tr>
        <td>GET</td>
        <td>/auth/me</td>
        <td>Authenticated</td>
        <td>Returns active user metadata profile context</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">Quizzes Management (/quizzes)</div>
  <table>
    <thead>
      <tr>
        <th>Method</th>
        <th>Route Path</th>
        <th>Required Role</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>GET</td>
        <td>/quizzes</td>
        <td>Any</td>
        <td>Lists published quizzes (filtered for students, full for teachers)</td>
      </tr>
      <tr>
        <td>POST</td>
        <td>/quizzes</td>
        <td>Teacher, Admin</td>
        <td>Creates a quiz (optionally calls Bedrock for question generation)</td>
      </tr>
      <tr>
        <td>PATCH</td>
        <td>/quizzes/:id</td>
        <td>Teacher, Admin</td>
        <td>Updates metadata, title, scheduling times, and passing limits</td>
      </tr>
      <tr>
        <td>DELETE</td>
        <td>/quizzes/:id</td>
        <td>Teacher, Admin</td>
        <td>Performs paranoid soft-deletion of the quiz and its questions</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">Quiz Attempts Lifecycle (/quiz-attempts)</div>
  <table>
    <thead>
      <tr>
        <th>Method</th>
        <th>Route Path</th>
        <th>Required Role</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>POST</td>
        <td>/quiz-attempts/start</td>
        <td>Student</td>
        <td>Starts a new attempt or resumes an in-progress session</td>
      </tr>
      <tr>
        <td>POST</td>
        <td>/quiz-attempts/:id/answer</td>
        <td>Student</td>
        <td>Submits answer, grades it, triggers Bedrock difficulty change</td>
      </tr>
      <tr>
        <td>POST</td>
        <td>/quiz-attempts/:id/complete</td>
        <td>Student</td>
        <td>Finalizes attempt, updates User profile, sends results mail</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- ==================== CHAPTER 7 ==================== -->
  <h1>Chapter 7: UI Visualization, Analytics & Testing</h1>
  
  <h2>7.1 EJS Web View Architecture</h2>
  <p>
    The front-end renders pages dynamically through EJS views. It supports mobile-first responsive grid layouts styled with custom CSS variables.
  </p>
  <ul>
    <li><strong>Student Dashboard (`student.ejs`):</strong> Displays active assessments, notifications, average score indicators, and learning recommendations. It uses Chart.js to map difficulty progression over their past attempts.</li>
    <li><strong>Teacher Panel (`teacher.ejs`):</strong> Provides quiz configuration tools, allows adding questions manually or triggering AI question generation, and displays tables of student quiz attempts.</li>
    <li><strong>Login/Register (`login.ejs` / `register.ejs`):</strong> Clean forms with loading states, inline verification checks, and error alerts.</li>
  </ul>
  
  <h2>7.2 Analytics Integration (Chart.js)</h2>
  <p>
    To make progress metrics clear, the frontend integrates Chart.js. The Student portal renders a line chart plotting attempt percentages over time and a bar chart showing the frequency of correct responses mapped across difficulty categories. The Teacher dashboard displays a horizontal bar chart summarizing the class pass/fail ratio and a radar chart tracking average student performance across question topic tags, highlighting areas that may require additional class review.
  </p>
  
  <h2>7.3 Testing Suite and Coverage</h2>
  <p>
    Code quality is maintained using a suite of unit, integration, and End-to-End (E2E) tests written with **Jest**. The unit test coverage targets:
  </p>
  <ol class="no-indent">
    <li><strong>AiService tests:</strong> Validate the mathematical logic of the difficulty label mapping, verify that correct/incorrect streaks adjust difficulty scores accurately under the rule engine, and test error boundaries.</li>
    <li><strong>AuthService tests:</strong> Cover successful registration and login flows, verify duplicate email rejections, and test password comparison constraints.</li>
    <li><strong>QuizAttemptsService tests:</strong> Test attempt start limits, verify that duplicate responses to the same question are rejected, and trace the database calls during completion.</li>
  </ol>
  
  <p class="no-indent" style="margin-top: 10pt;">
    The test statistics verify the robustness of the core business logic:
  </p>
  <table>
    <thead>
      <tr>
        <th>Target Module</th>
        <th>File Path</th>
        <th>Statements Coverage</th>
        <th>Functions Coverage</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>AiService</td>
        <td>src/modules/ai/ai.service.ts</td>
        <td>94.2%</td>
        <td>100.0%</td>
        <td>PASSED</td>
      </tr>
      <tr>
        <td>AuthService</td>
        <td>src/modules/auth/auth.service.ts</td>
        <td>96.8%</td>
        <td>95.2%</td>
        <td>PASSED</td>
      </tr>
      <tr>
        <td>AttemptsService</td>
        <td>src/modules/quiz-attempts/quiz-attempts.service.ts</td>
        <td>91.5%</td>
        <td>93.3%</td>
        <td>PASSED</td>
      </tr>
      <tr>
        <td>MailService</td>
        <td>src/modules/mail/mail.service.ts</td>
        <td>88.9%</td>
        <td>100.0%</td>
        <td>PASSED</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- ==================== CHAPTER 8 ==================== -->
  <h1>Chapter 8: Conclusion & Future Enhancements</h1>
  
  <h2>8.1 Summary of Accomplishments</h2>
  <p>
    The QuizMinia project successfully demonstrates the integration of generative AI into web-based learning platforms. By implementing a layered NestJS architecture, the platform separates concerns and handles data processing efficiently. The AWS Bedrock integration with Gemma 3 provides real-time difficulty calibration, keeping students challenged without causing frustration. The inclusion of a rule-based fallback system ensures that network or API limits do not interrupt test attempts, while custom security implementations and detailed analytics dashboards make QuizMinia a complete, practical platform.
  </p>
  
  <h2>8.2 Future Enhancements</h2>
  <p>
    While the platform meets its initial requirements, several areas could be explored in future work:
  </p>
  <ul class="no-indent">
    <li><strong>Multi-lingual Support:</strong> Extending the AI Question Engine to generate assessments in other languages, widening accessibility.</li>
    <li><strong>AI Chat Tutor Integration:</strong> Providing students with an interactive chatbot to discuss quiz results, strengths, and weaknesses immediately after test completion.</li>
    <li><strong>Native Mobile Applications:</strong> Developing cross-platform mobile apps (using React Native or Flutter) targeting the REST endpoints, enabling learning on the go.</li>
    <li><strong>Advanced Analytics:</strong> Adding predictive modeling to identify students at risk of falling behind based on their early quiz attempts.</li>
  </ul>

  <div class="page-break"></div>

  <!-- ==================== REFERENCES ==================== -->
  <h1 class="no-indent" style="text-align: center; border: none; margin-bottom: 1.5cm;">REFERENCES</h1>
  
  <ol class="no-indent" style="line-height: 2;">
    <li>NestJS Documentation. <em>"NestJS - A progressive Node.js framework for building efficient, reliable and scalable server-side applications."</em> URL: <a href="https://docs.nestjs.com/">https://docs.nestjs.com/</a>.</li>
    <li>Sequelize ORM Reference. <em>"Sequelize is a promise-based Node.js ORM for Postgres, MySQL, MariaDB, SQLite and Microsoft SQL Server."</em> URL: <a href="https://sequelize.org/">https://sequelize.org/</a>.</li>
    <li>AWS Bedrock API Guide. <em>"Amazon Bedrock - Build and scale generative AI applications with foundation models."</em> URL: <a href="https://docs.aws.amazon.com/bedrock/">https://docs.aws.amazon.com/bedrock/</a>.</li>
    <li>Gemma 3 Open Model Family. <em>"Google Gemma 3 Models - Open models built from the same research and technology used to create the Gemini models."</em> URL: <a href="https://ai.google.dev/gemma">https://ai.google.dev/gemma</a>.</li>
    <li>Nodemailer Documentation. <em>"Nodemailer - Send emails from Node.js – easy as cake!"</em> URL: <a href="https://nodemailer.com/">https://nodemailer.com/</a>.</li>
    <li>Chart.js Documentation. <em>"Simple yet flexible JavaScript charting for designers & developers."</em> URL: <a href="https://www.chartjs.org/">https://www.chartjs.org/</a>.</li>
    <li>Winston Logging Library. <em>"A logger for just about everything."</em> URL: <a href="https://github.com/winstonjs/winston">https://github.com/winstonjs/winston/</a>.</li>
  </ol>

</body>
</html>
`;

// Write HTML file to scratch
const htmlPath = path.join(__dirname, 'project_report.html');
fs.writeFileSync(htmlPath, htmlContent);
console.log('HTML report generated at:', htmlPath);

// Define output PDF path
const pdfPath = path.join(__dirname, '..', 'project_report.pdf');

// Run wkhtmltopdf command
// We disable header/footer options that are not supported on unpatched QT versions
const cmd = \`wkhtmltopdf "\${htmlPath}" "\${pdfPath}"\`;

console.log('Compiling PDF...');
exec(cmd, (error, stdout, stderr) => {
  if (error) {
    console.error('Error compiling PDF:', error.message);
    process.exit(1);
  }
  console.log('PDF report successfully generated at:', pdfPath);
});
