import { AIProvider, GenerateTextOptions } from './AIProvider';

export class MockAIProvider implements AIProvider {
  name = 'MockAISimulator';

  async generateText(options: GenerateTextOptions): Promise<string> {
    const p = options.prompt.toLowerCase();
    if (p.includes('resume') || p.includes('cv')) {
      return `# Professional Executive Resume\n\n## Summary\nAccomplished professional with over 8 years of proven track record in driving scalable operational growth, optimizing cross-functional processes, and leveraging cutting-edge AI technologies.\n\n## Experience\n**Senior Product Lead** — Global Tech Solutions (2021 – Present)\n- Scaled enterprise SaaS usage by 180% year-over-year.\n- Led engineering, design, and marketing teams to release next-gen cloud document tooling.\n\n**Product Manager** — Apex Innovations (2018 – 2021)\n- Streamlined workflow automation, saving 350+ employee hours per week.\n\n## Key Skills\n- Strategic Roadmapping, Cross-Platform Architecture, AI Prompt Engineering, Agile Management.`;
    }

    if (p.includes('report') || p.includes('research')) {
      return `# Comprehensive Executive Report\n\n### Executive Overview\nThis report analyzes key industry performance indicators and opportunities for high-impact workflow transformation.\n\n### Key Findings\n1. **Productivity Multipliers**: Teams adopting AI document tooling observed a 64% reduction in manual document turnaround.\n2. **Security & Governance**: Zero-trust document storage and granular role-based permissions remain non-negotiable for enterprise deployments.\n\n### Strategic Recommendations\n- Accelerate digital workspace adoption across core operational units.\n- Standardize template libraries to maintain brand consistency.\n- Integrate real-time analytics to monitor credit and resource consumption.`;
    }

    return `# Generated Document: ${options.prompt}\n\n### 1. Introduction\nIn today's fast-paced environment, streamlining document lifecycle operations is essential. This document provides structured insights tailored for ${options.tone || 'Professional'} objectives.\n\n### 2. Core Pillars\n- **Efficiency**: Reducing manual formatting and redundant workflows.\n- **Precision**: Ensuring accurate data aggregation and formatting.\n- **Scalability**: Enabling rapid collaboration and team sharing.\n\n### 3. Actionable Next Steps\n1. Review and refine initial draft specifications.\n2. Distribute for collaborative feedback and stakeholder approvals.\n3. Export to target format (PDF, Word, or Spreadsheet) for final archival.`;
  }

  async rewriteText(text: string, action: string, tone?: string, targetLanguage?: string): Promise<string> {
    switch (action) {
      case 'rewrite':
        return `Streamlined and polished version: "${text.trim()} - optimized with clarity, impact, and concise structure."`;
      case 'expand':
        return `${text.trim()}\n\nFurthermore, this initiative delivers substantial long-term strategic value by improving operational efficiency, fostering collaboration among distributed teams, and establishing scalable foundational standards for ongoing organizational excellence.`;
      case 'summarize':
        return `Key Takeaway: ${text.slice(0, 150)}... [Document distilled to core actionable points]`;
      case 'grammar':
        return text.replace(/\b(teh)\b/gi, 'the').replace(/\s+/g, ' ').trim();
      case 'professional':
        return `We are pleased to present the following formal assessment: ${text.trim()}. Please let us know should you require any additional supporting documentation.`;
      case 'simplify':
        return `In simple terms: ${text.trim()}`;
      case 'translate':
        return `[Translated to ${targetLanguage || 'Target Language'}]: ${text.trim()}`;
      default:
        return text;
    }
  }

  async summarizeText(text: string, length: 'short' | 'medium' | 'detailed' = 'medium'): Promise<string> {
    return `### Summary (${length.toUpperCase()})\n\n- **Core Theme**: The document focuses on streamlining productivity, document generation, and digital workflow acceleration.\n- **Primary Outcomes**: Measurable increase in operational speed and enhanced accuracy.\n- **Conclusion**: Recommended for immediate implementation and review.`;
  }

  async analyzeSpreadsheet(data: any, action: string, prompt?: string): Promise<any> {
    return {
      summary: "Data Analysis complete. Processed 100% of cell records with no critical anomalies detected.",
      metrics: {
        totalRowsAnalyzed: Array.isArray(data) ? data.length : 15,
        trendDirection: "Positive (+24.8% growth trajectory)",
        potentialDuplicates: 0,
        highestValueCategory: "Enterprise Tier Subscriptions",
      },
      recommendedFormulas: [
        { formula: "=SUM(B2:B20)", description: "Calculates total revenue across selected column" },
        { formula: "=AVERAGE(C2:C20)", description: "Calculates average conversion percentage" },
        { formula: "=IF(D2>1000, 'Tier 1', 'Tier 2')", description: "Categorizes high-value customer accounts" }
      ],
      chartSuggestion: {
        recommendedChartType: "BarChart",
        xAxis: "Category / Month",
        yAxis: "Revenue / Conversions",
        title: "Monthly Growth & Volume Breakdown"
      }
    };
  }

  async generatePresentationOutline(topic: string, slideCount: number, audience: string, tone: string): Promise<any> {
    const slides = [];
    const titles = [
      `Introduction to ${topic}`,
      `Current Market Landscape & Challenges`,
      `The DocuFlow AI Solution & Architecture`,
      `Key Capabilities & Strategic Advantages`,
      `Implementation Roadmap & Timelines`,
      `Financial ROI & Performance Metrics`,
      `Case Studies & Real-World Impact`,
      `Next Steps & Conclusion`
    ];

    for (let i = 0; i < Math.min(slideCount, titles.length); i++) {
      slides.push({
        slideNumber: i + 1,
        title: titles[i],
        layout: i === 0 ? 'title' : i % 2 === 0 ? 'two_column' : 'bullets',
        bulletPoints: [
          `Key strategic pillar: Driving measurable impact in ${topic}`,
          `Optimizing resource allocation and operational throughput`,
          `Establishing enterprise-grade quality and continuous refinement`
        ],
        speakerNotes: `Emphasize value proposition for ${audience} using a ${tone} tone.`
      });
    }

    return {
      topic,
      totalSlides: slides.length,
      audience,
      tone,
      slides
    };
  }

  async answerPdfQuestion(pdfContext: string, question: string): Promise<{ answer: string; references: string[] }> {
    return {
      answer: `Based on the uploaded document, the inquiry regarding "${question}" is addressed in Section 2 & 4. The document emphasizes automated compliance, efficient cloud conversion workflows, and centralized team permissions.`,
      references: ["Page 1, Paragraph 3: Executive Statement", "Page 3, Section 2.4: Workflow Security Architecture"]
    };
  }

  async extractOCRText(imageBuffer: Buffer | string): Promise<string> {
    return `DOCUFLOW AI OCR EXTRACTED TEXT
=====================================
INVOICE / DOCUMENT SCAN
Document ID: DF-2026-9812
Date: 2026-08-16
Status: Verified & Validated

Description                     Qty    Rate       Total
-----------------------------------------------------------
AI Document Automation Engine     1    $29.00     $29.00
Cloud Storage 50GB Tier           1    $10.00     $10.00
-----------------------------------------------------------
Subtotal: $39.00
Tax (0%): $0.00
Total Due: $39.00

Thank you for choosing DocuFlow AI!`;
  }
}
