// ===============================
// QUIZ DOM ELEMENTS
// ===============================
// All quiz element ids follow the same pattern, with the direction
// ("eng-ita" / "ita-eng") inside the id.

export function getQuizElements(direction) {
  const byId = (id) => document.getElementById(id);

  return {
    // Screens
    startScreen: byId(`${direction}-start-screen`),
    selectionScreen: byId(`${direction}-selection-screen`),
    quizScreen: byId(`${direction}-quiz-screen`),

    // Selection screen
    options: byId(`${direction}-quiz-options`),
    startButton: byId(`start-${direction}-button`),
    backButton: byId(`back-${direction}-start-button`),

    // Active quiz screen
    question: byId(`${direction}-question`),
    answerInput: byId(`${direction}-answer`),
    feedback: byId(`${direction}-feedback`),
    mistakes: byId(`${direction}-mistakes`),
    progress: byId(`${direction}-progress`),

    // Active quiz buttons
    checkButton: byId(`check-${direction}-button`),
    nextButton: byId(`next-${direction}-button`),
    endButton: byId(`end-${direction}-button`),
    restartButton: byId(`restart-${direction}-button`),
    mistakesButton: byId(`view-${direction}-mistakes-button`)
  };
}
