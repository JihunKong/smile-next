'use client'

/**
 * ExamStyles Component
 *
 * Global CSS styles for the exam taking experience.
 * Includes anti-cheating protection (text selection disabled) and modal animations.
 *
 * @see VIBE-0010
 */

export function ExamStyles() {
  return (
    <style jsx global>{`
      /* STRONGEST POSSIBLE: Disable text selection on questions and answers */
      .exam-content,
      .question-text,
      .answer-choice,
      #question-content,
      .choice-text,
      #choices-container,
      #choices-container * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        pointer-events: auto !important;
      }

      /* Prevent drag-and-drop of text */
      .exam-content *,
      .question-text *,
      .answer-choice * {
        -webkit-user-drag: none;
        -khtml-user-drag: none;
        -moz-user-drag: none;
        -o-user-drag: none;
        user-drag: none;
      }

      /* Visual indicator that content is protected */
      .exam-content {
        cursor: default;
      }

      /* Modal animation */
      @keyframes modal-appear {
        from {
          opacity: 0;
          transform: scale(0.9) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      .animate-modal-appear {
        animation: modal-appear 0.3s ease-out;
      }

      /* Pulse animation for submit button */
      @keyframes pulse-grow {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.05);
        }
      }

      .pulse-grow:not(:disabled) {
        animation: pulse-grow 1s ease-in-out infinite;
      }
    `}</style>
  )
}
