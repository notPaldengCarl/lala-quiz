
import LZString from 'lz-string';
import { QuizData, Question, QuestionType, QuizMetadata, StudyPlanItem } from '../types';

// Minified Interfaces for cleaner URL
interface MinifiedQuestion {
  t: number;      // type (mapped to index)
  q: string;      // question
  o?: string[];   // options
  a: string;      // answer
  e?: string;     // explanation
}

interface MinifiedData {
  m: {            // metadata
    s: string;    // source
    d: string;    // difficulty
  };
  q: MinifiedQuestion[];
  s?: string;     // summary
  k?: string[];   // keywords
  p?: {           // study plan
    d: string;    // day
    t: string;    // topic
    a: string;    // activity
  }[];
}

const TYPE_MAP = [
  QuestionType.MultipleChoice,
  QuestionType.TrueFalse,
  QuestionType.Identification,
  QuestionType.FillInBlank
];

export const compressQuizData = (data: QuizData): string => {
  try {
    // 1. Minify
    const minified: MinifiedData = {
      m: {
        // Truncate source if too long to save URL space
        s: data.metadata.source.length > 50 ? data.metadata.source.substring(0, 50) + "..." : data.metadata.source,
        d: data.metadata.difficulty
      },
      q: data.questions.map(q => {
        const isTF = q.type === QuestionType.TrueFalse;
        return {
          t: TYPE_MAP.indexOf(q.type),
          q: q.question,
          // Optimization: Drop options for T/F or if empty
          o: (isTF || !q.options || q.options.length === 0) ? undefined : q.options,
          a: q.correct_answer,
          // Optimization: Drop explanation if empty
          e: q.explanation || undefined
        };
      }),
      // Optional fields - include only if they exist
      s: data.summary || undefined,
      k: (data.keywords && data.keywords.length > 0) ? data.keywords : undefined,
      p: (data.study_plan && data.study_plan.length > 0) ? data.study_plan.map(p => ({
        d: p.day,
        t: p.topic,
        a: p.activity
      })) : undefined
    };

    // 2. Stringify & Compress
    const jsonStr = JSON.stringify(minified);
    return LZString.compressToEncodedURIComponent(jsonStr);
  } catch (e) {
    console.error("Compression failed", e);
    throw new Error("Failed to compress data");
  }
};

export const decompressQuizData = (compressed: string): QuizData | null => {
  try {
    const jsonStr = LZString.decompressFromEncodedURIComponent(compressed);
    if (!jsonStr) return null;

    const minified: MinifiedData = JSON.parse(jsonStr);

    // Reconstruct full QuizData
    const questions: Question[] = minified.q.map((mq, idx) => ({
      id: idx + 1, // Regenerate ID
      type: TYPE_MAP[mq.t] || QuestionType.MultipleChoice,
      question: mq.q,
      // Reconstruct options for T/F if missing
      options: (!mq.o && TYPE_MAP[mq.t] === QuestionType.TrueFalse) 
        ? ["True", "False"] 
        : mq.o,
      correct_answer: mq.a,
      explanation: mq.e
    }));

    const metadata: QuizMetadata = {
      source: minified.m.s,
      number_of_questions: questions.length, // Derived
      difficulty: minified.m.d,
      types: [] 
    };

    const studyPlan: StudyPlanItem[] | undefined = minified.p?.map(mp => ({
      day: mp.d,
      topic: mp.t,
      activity: mp.a
    }));

    return {
      metadata,
      questions,
      summary: minified.s,
      keywords: minified.k,
      study_plan: studyPlan
    };
  } catch (e) {
    console.error("Decompression failed", e);
    return null;
  }
};
