export const getProductionAnswerLink = (quizUuid: string) =>
  `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/answer/${quizUuid}`;

export const getDevAnswerLink = (quizUuid: string) =>
  `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/answer/${quizUuid}?test=1`;

export const getQuizResultLink = (
  quizUuid: string,
  quizResultUuid: string,
  options: {
    domain?: string;
  } = {},
) =>
  `${
    (options.domain ?? typeof window !== "undefined")
      ? window.location.origin
      : ""
  }/answer/${quizUuid}/result/${quizResultUuid}`;

export const getQuizResultRedirectLink = (resultId: number) =>
  `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/api/quiz-result-id-redirect?resultId=${resultId}`;
