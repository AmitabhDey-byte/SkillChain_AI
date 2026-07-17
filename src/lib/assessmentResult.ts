import type { AssessmentRunResult } from './api'

export const ASSESSMENT_RESULT_KEY = 'skillchain.assessment.result'

export function loadAssessmentResult(): AssessmentRunResult | null {
  const saved = localStorage.getItem(ASSESSMENT_RESULT_KEY)
  if (!saved) return null

  try {
    return JSON.parse(saved) as AssessmentRunResult
  } catch {
    return null
  }
}

export function saveAssessmentResult(result: AssessmentRunResult) {
  localStorage.setItem(ASSESSMENT_RESULT_KEY, JSON.stringify(result))
}

export function clearAssessmentResult() {
  localStorage.removeItem(ASSESSMENT_RESULT_KEY)
}
