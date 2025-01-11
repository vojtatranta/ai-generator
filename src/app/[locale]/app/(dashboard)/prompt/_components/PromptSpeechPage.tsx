"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Square, Play, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Maybe } from "actual-maybe";
import { toast } from "sonner";
import { trpcApi } from "@/components/providers/TRPCProvider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MemoizedLangtailMarkdownBlock } from "@/components/Markdown";
import { AIResult } from "@/lib/supabase-server";
import { UsedPromptType } from "@/constants/data";
import PageContainer from "@/components/layout/page-container";
import { uploadFileAction } from "@/lib/upload-file-action";
import { getAudioUploadStreamLink } from "@/lib/public-links";

const QueryFormSchema = z.object({
  message: z.string(),
  length: z.number(),
  locale: z.string(),
});
function formatEllapsedTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const remainingSeconds = seconds % 3600;
  const minutes = Math.floor(remainingSeconds / 60);
  const remainingSeconds2 = remainingSeconds % 60;
  return `${hours < 10 ? "0" : ""}${hours}:${minutes < 10 ? "0" : ""}${minutes}:${
    remainingSeconds2 < 10 ? "0" : ""
  }${Math.floor(remainingSeconds2)}`;
}

function chunkBlob(blob: Blob, chunkSizeMB = 3) {
  const chunkSize = chunkSizeMB * 1024 * 1024; // Convert MB to bytes
  const chunks = [];
  let start = 0;

  while (start < blob.size) {
    const end = Math.min(start + chunkSize, blob.size); // Calculate chunk size
    const chunk = blob.slice(start, end); // Create a slice of the blob
    chunks.push(chunk);
    start = end;
  }

  return chunks; // Return an array of blob chunks
}

const AUDIO_MIME_TYPE = "audio/mpeg";

type QueryFormType = z.infer<typeof QueryFormSchema>;

interface RecordedAudio {
  timestamp: number;
  length: number;
  streamableUrl?: string | null;
  id: string;
  transcription?: string;
}

const getDefaultValues = (
  t: (key: string) => string,
  randomNumberFromTopics: number,
  prompt: UsedPromptType,
  locale: string,
): QueryFormType => {
  return {
    message: "",
    length: prompt.defaultLength ?? 200,
    locale,
  };
};

interface Props {
  aiResults: AIResult[];
  prompt: UsedPromptType;
  randomNumberFromTopics: number;
  onUploadFileAction: (
    formData: FormData,
  ) => ReturnType<typeof uploadFileAction>;
}

export const PromptSpeechPage = ({
  aiResults,
  prompt,
  randomNumberFromTopics,
  onUploadFileAction,
}: Props) => {
  const t = useTranslations();
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const chunksRef = useRef<Blob[]>([]);
  const [recordings, setRecordings] = useState<RecordedAudio[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingBlobsPromisesRef = useRef<Map<string, Promise<any>[]>>(
    new Map(),
  );
  const [currentTranscription, setCurrentTranscription] = useState<string>("");
  const recordingStartTimeRef = useRef<number | null>(null);
  const recordingIdRef = useRef<string | null>(null);
  const locale = useLocale();
  const [ellapsedTime, setElapsedTime] = useState(0);

  const timerIdRef = useRef<NodeJS.Timer | null>(null);

  const updateEllapsed = (started: number) => {
    if (timerIdRef.current) {
      const diff = (Date.now() - started) / 1000;
      console.log("diff", diff);
      setElapsedTime(diff);
    }
  };

  const audioUploadMutation = trpcApi.filesRouter.saveFileChunk.useMutation({
    onSuccess: (data) => {
      setCurrentTranscription((prev) => prev + data.transcription);
    },
  });
  const saveCompletedAudio =
    trpcApi.speechToText.saveTheCompletedAudio.useMutation({
      onSuccess: (data) => {
        toast.success(t("prompt.transcriptionCompleted"));
        toast.success(data.addedFile.filename);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const form = useForm<QueryFormType>({
    resolver: zodResolver(QueryFormSchema),
    defaultValues: getDefaultValues(t, randomNumberFromTopics, prompt, locale),
  });

  const startRecording = async () => {
    if (recordingIdRef.current) {
      return;
    }

    const currentRecordingRefId = uuidv4();
    setCurrentTranscription("");
    recordingIdRef.current = currentRecordingRefId;
    setElapsedTime(0);
    const nowStarte = Date.now();
    recordingStartTimeRef.current = nowStarte;
    timerIdRef.current = setInterval(() => {
      updateEllapsed(nowStarte);
    }, 300);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        console.log("e.,dat", e.data);
        if (e.data.size > 0) {
          const chunkedBlobs = chunkBlob(
            new Blob([e.data], {
              type: AUDIO_MIME_TYPE,
            }),
          );

          if (!recordingBlobsPromisesRef.current.has(currentRecordingRefId)) {
            recordingBlobsPromisesRef.current.set(currentRecordingRefId, []);
          }

          chunkedBlobs.forEach((blob) => {
            recordingBlobsPromisesRef.current.get(currentRecordingRefId)?.push(
              new Promise<string>((resolve) => {
                const fileReader = new FileReader();
                fileReader.onload = () => {
                  const blobBase64 = fileReader.result as string;
                  resolve(blobBase64);
                };

                fileReader.readAsDataURL(blob);
              }).then((blobBase64) => {
                return audioUploadMutation.mutateAsync({
                  chunkBase64: blobBase64,
                  commonFileUuid: currentRecordingRefId,
                  mime: AUDIO_MIME_TYPE,
                  transcribe: true,
                });
              }),
            );
          });
        }
      };

      recorder.onstop = async () => {
        // Calculate recording length
        console.log(
          "recordingStartTimeRef.current",
          recordingStartTimeRef.current,
        );
        const recordingLength = recordingStartTimeRef.current
          ? Math.round((Date.now() - recordingStartTimeRef.current) / 1000)
          : 0;

        // Add new recording to the list
        setRecordings((prev) => [
          ...prev,
          {
            id: currentRecordingRefId,
            timestamp: Date.now(),
            length: recordingLength,
          },
        ]);

        try {
          await Promise.all(
            Array.from(
              recordingBlobsPromisesRef.current.get(currentRecordingRefId) ??
                [],
            ),
          );

          setRecordings((prev) =>
            prev.map((rec) => {
              if (rec.id === currentRecordingRefId) {
                return {
                  ...rec,
                  streamableUrl: `${getAudioUploadStreamLink(
                    currentRecordingRefId,
                  )}`,
                };
              }
              return rec;
            }),
          );

          //   Complete transcript by creating a new file completely
          await saveCompletedAudio.mutateAsync({
            commonFileUuid: currentRecordingRefId,
          });

          recordingBlobsPromisesRef.current.delete(currentRecordingRefId);
          toast.success(t("prompt.audioUploadSuccess"));
        } catch (error) {
          console.error("Error uploading audio:", error);
          toast.error(t("prompt.audioUploadError"));
        } finally {
          recordingIdRef.current = null;
          recordingStartTimeRef.current = null;
        }
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error(t("prompt.microphoneAccessError"));
    } finally {
      recordingIdRef.current = null;
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      setMediaRecorder(null);
    }

    const timerId = timerIdRef.current;
    if (timerId) {
      clearInterval(Number(timerId));
      timerIdRef.current = null;
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const playRecording = (recording: RecordedAudio) => {
    const streamableUrl = recording.streamableUrl;
    if (!streamableUrl) {
      return;
    }

    if (audioRef.current) {
      if (currentlyPlaying === streamableUrl) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setCurrentlyPlaying(null);
      } else {
        audioRef.current.src = streamableUrl;
        audioRef.current.play();
        setCurrentlyPlaying(streamableUrl);
      }
    }
  };

  const deleteRecording = (timestamp: number) => {
    setRecordings((prev) => {
      const newRecordings = prev.filter((rec) => rec.timestamp !== timestamp);
      // Clean up the URL object
      const recordingToDelete = prev.find((rec) => rec.timestamp === timestamp);
      if (recordingToDelete) {
        URL.revokeObjectURL(recordingToDelete.id);
      }
      return newRecordings;
    });
  };

  useEffect(() => {
    return () => {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [mediaRecorder, recordings]);

  return (
    <PageContainer>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mb-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Mic className="w-5 h-5 mr-2" />
              {t("prompt.speechToText")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={toggleRecording}
                variant={isRecording ? "destructive" : "default"}
                className="rounded-full w-16 h-16 p-0"
              >
                {isRecording ? (
                  <Square className="h-6 w-6" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </Button>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              {isRecording
                ? t("prompt.recording")
                : t("prompt.clickToStartRecording")}
            </div>
            <div>
              {isRecording && (
                <div className="text-center text-sm font-medium">
                  {formatEllapsedTime(ellapsedTime)}
                </div>
              )}
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-medium mb-4">
                {t("prompt.recordings")}
              </h3>
              <div className="space-y-2">
                {recordings.map((recording) => (
                  <div
                    key={recording.timestamp}
                    className="flex items-center justify-between p-2 bg-muted rounded-md"
                  >
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={!recording.streamableUrl}
                        onClick={() => playRecording(recording)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <span className="text-sm">
                        {formatEllapsedTime(recording.length)}{" "}
                        {/* {new Date(recording.timestamp).toLocaleTimeString()} */}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteRecording(recording.timestamp)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <audio
                  ref={audioRef}
                  onEnded={() => setCurrentlyPlaying(null)}
                  className="hidden"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              {t("prompt.transcription")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px] w-full rounded-md border p-4">
              {!currentTranscription ? (
                <p className="text-sm text-muted-foreground">
                  {t("prompt.transcriptionWillAppearHere")}
                </p>
              ) : (
                <p className="text-sm">{currentTranscription}</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};
