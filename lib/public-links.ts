export const getLoginLink = (): string => {
  return "/login";
};

export const getAudioUploadStreamLink = (commonFileUuid: string): string => {
  return `/api/audio-stream?commonFileUuid=${commonFileUuid}`;
};
