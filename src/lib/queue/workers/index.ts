import { startEvaluationWorker } from './evaluationWorker'
import { startResponseEvaluationWorker } from './responseEvaluationWorker'

/**
 * Start all queue workers
 * This should be called from a separate worker process, not the main Next.js server
 */
export function startAllWorkers(): void {
  console.log('[Workers] Starting all queue workers...')

  startEvaluationWorker()
  startResponseEvaluationWorker()

  console.log('[Workers] All workers started successfully')
}

export { startEvaluationWorker, startResponseEvaluationWorker }

export default startAllWorkers
