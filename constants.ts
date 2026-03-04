
import { ModuleRubric } from './types';

export const MODULES_RUBRICS: ModuleRubric[] = [
  {
    moduleId: 1,
    unit: 2,
    title: "Technology trajectory and impact",
    totalMarks: 16,
    categories: [
      { id: "adherence", name: "Adherence to the instructions", maxScore: 4 },
      { id: "factors", name: "Factors of success or failure (Q1.1)", maxScore: 4 },
      { id: "trajectory", name: "Trajectory of AI (Q1.2)", maxScore: 4 },
      { id: "clarity", name: "Clarity and organisation of the writing", maxScore: 4 }
    ]
  },
  {
    moduleId: 2,
    unit: 3,
    title: "Supervised learning and movie reviews",
    totalMarks: 24,
    categories: [
      { id: "adherence", name: "Adherence to the instructions", maxScore: 4 },
      { id: "evaluation", name: "Evaluation of methods", maxScore: 4 },
      { id: "analysis", name: "Analysis of Requirements", maxScore: 4 },
      { id: "limitations", name: "Discuss limitations of the approach", maxScore: 4 },
      { id: "improvements", name: "Discuss improvements to the approach", maxScore: 4 },
      { id: "clarity", name: "Clarity and organisation of the writing", maxScore: 4 }
    ]
  },
  {
    moduleId: 3,
    unit: 3,
    title: "Deep neural networks and handwritten digits",
    totalMarks: 28,
    categories: [
      { id: "adherence", name: "Adherence to the instructions", maxScore: 4 },
      { id: "challenges", name: "Challenges associated with handwriting (Q1)", maxScore: 4 },
      { id: "recommendations", name: "Recommendations to overcome challenges (Q2)", maxScore: 4 },
      { id: "num_recommendations", name: "Number of recommendations proposed (Q2)", maxScore: 4 },
      { id: "features", name: "Features of handwritten digits (Q3)", maxScore: 4 },
      { id: "num_features", name: "Number of features identified (Q3)", maxScore: 4 },
      { id: "clarity", name: "Clarity and organisation of the writing", maxScore: 4 }
    ]
  },
  {
    moduleId: 4,
    unit: 2,
    title: "Leveraging GenAI and safety",
    totalMarks: 24,
    categories: [
      { id: "adherence", name: "Adherence to the instructions", maxScore: 4 },
      { id: "q1", name: "Application of generative AI to the organisation (Q1)", maxScore: 8 },
      { id: "q2", name: "Identification of safety measures for generative AI (Q2)", maxScore: 8 },
      { id: "adherence_clarity", name: "Adherence to the brief and clarity of writing", maxScore: 8 }
    ]
  },
  {
    moduleId: 5,
    unit: 3,
    title: "Ethical principles for AI",
    totalMarks: 16,
    categories: [
      { id: "adherence", name: "Adherence to the instructions", maxScore: 4 },
      { id: "principles", name: "Ethical principles", maxScore: 4 },
      { id: "relevance", name: "Relevance of ethical principles", maxScore: 4 },
      { id: "clarity", name: "Clarity and organisation of the writing", maxScore: 4 }
    ]
  },
  {
    moduleId: 6,
    unit: 2,
    title: "Business case for AI implementation",
    totalMarks: 32,
    categories: [
      { id: "adherence", name: "Adherence to the instructions", maxScore: 4 },
      { id: "understanding", name: "Understanding of AI's potential in the organisation", maxScore: 4 },
      { id: "needs", name: "Needs", maxScore: 4 },
      { id: "alignment", name: "Alignment", maxScore: 4 },
      { id: "finance", name: "Finance", maxScore: 4 },
      { id: "test", name: "Test", maxScore: 4 },
      { id: "analyse", name: "Analyse", maxScore: 4 },
      { id: "clarity", name: "Clarity and organisation of the writing", maxScore: 4 }
    ]
  }
];
