"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Square, Play, Trash2, Loader2, Pause } from "lucide-react";
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
import { Else, If, Then } from "@/components/ui/condition";

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

function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob); // Create a URL for the blob
  const a = document.createElement("a"); // Create an anchor element
  a.href = url;
  a.download = fileName; // Set the file name
  document.body.appendChild(a);
  a.click(); // Trigger the download
  document.body.removeChild(a);
  URL.revokeObjectURL(url); // Revoke the URL to free up memory
}

/**
 * Chunks a blob by the specified size (in MB) while ensuring headers are preserved.
 * @param blob - The input audio blob.
 * @param chunkSizeMB - The maximum size (in MB) for each chunk.
 * @returns Array of properly chunked blobs.
 */
export async function chunkBlob(
  blob: Blob,
  chunkSizeMB: number = 3,
): Promise<Blob[]> {
  const minChunkSizeBytes = 150 * 1024; // Minimum chunk size of 100kB
  const maxChunkSizeBytes = chunkSizeMB * 1024 * 1024; // Convert MB to bytes
  const chunkSizeBytes =
    blob.size > maxChunkSizeBytes
      ? maxChunkSizeBytes
      : Math.max(
          minChunkSizeBytes,
          Math.floor(blob.size / Math.ceil(blob.size / maxChunkSizeBytes)),
        ); // Calculate the chunk size sensibly so that you are as close to max chunkSize as to minimum
  const headerBlob = await getFirstBlobHeader(blob); // Extract the header (first bytes)
  const chunks: Blob[] = [];

  let offset = headerBlob.size; // Start after the header
  while (offset < blob.size) {
    const end =
      offset + chunkSizeBytes > blob.size
        ? blob.size
        : offset + Math.max(minChunkSizeBytes, chunkSizeBytes);
    const chunkData = blob.slice(offset, end); // Slice the audio data

    // If the last chunk is too small, add empty data to it to fill up the minimum
    if (chunkData.size < minChunkSizeBytes) {
      const emptyData = new Uint8Array(minChunkSizeBytes - chunkData.size);
      const chunkWithHeader = new Blob([headerBlob, chunkData, emptyData], {
        type: blob.type,
      });
      chunks.push(chunkWithHeader);
    } else {
      // Create a new blob with the header + actual audio data
      const chunkWithHeader = new Blob([headerBlob, chunkData], {
        type: blob.type,
      });
      chunks.push(chunkWithHeader);
    }

    offset = end; // Move to the next offset
  }

  return chunks;
}

/**
 * Extracts the first few bytes of the blob that contain the audio headers.
 * @param blob - The audio blob.
 * @returns A blob containing just the header bytes.
 */
async function getFirstBlobHeader(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Re-encode the buffer into a small blob to preserve header bytes
  const wavHeader = audioBuffer.length > 0 ? blob.slice(0, 1024) : blob; // Example: use the first 1 KB
  return wavHeader; // Return a header blob
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
  const [
    completedTranscriptionCommonFileUuid,
    setCompletedTranscriptionCommonFileUuid,
  ] = useState<string | null>(null);

  const chunksRef = useRef<Blob[]>([]);
  const [recordings, setRecordings] = useState<RecordedAudio[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingBlobsPromisesRef = useRef<Map<string, Promise<any>[]>>(
    new Map(),
  );
  const transcriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [currentTranscription, setCurrentTranscription] = useState<string>("");
  const recordingStartTimeRef = useRef<number | null>(null);
  const recordingIdRef = useRef<string | null>(null);
  const [makingTranscription, setMakingTranscription] = useState(false);
  const locale = useLocale();
  const [ellapsedTime, setElapsedTime] = useState(0);
  const recordingPromiseRef = useRef<Promise<void> | null>(null);

  const timerIdRef = useRef<NodeJS.Timer | null>(null);

  const updateEllapsed = (started: number) => {
    if (timerIdRef.current) {
      const diff = (Date.now() - started) / 1000;
      setElapsedTime(diff);
    }
  };

  const completedTranscriptionQuery =
    trpcApi.filesRouter.getCompletedTranscription.useQuery(
      {
        commonFileUuid: completedTranscriptionCommonFileUuid ?? "",
      },

      {
        enabled: Boolean(
          completedTranscriptionCommonFileUuid && !currentTranscription,
        ),
        refetchInterval: 1000,
      },
    );

  const audioUploadMutation = trpcApi.filesRouter.saveFileChunk.useMutation({});

  const completeAudioMutation =
    trpcApi.speechToText.completeAudioProcess.useMutation();

  useEffect(() => {
    if (completedTranscriptionQuery.data?.finished) {
      if (completedTranscriptionCommonFileUuid) {
        completeAudioMutation.mutateAsync({
          commonFileUuid: completedTranscriptionCommonFileUuid,
        });
      }
      setCurrentTranscription(completedTranscriptionQuery.data?.text ?? "");
      setCompletedTranscriptionCommonFileUuid(null);
      setMakingTranscription(false);
    }
  }, [
    setCurrentTranscription,
    completeAudioMutation,
    completedTranscriptionQuery.data,
  ]);

  const startRecording = async () => {
    if (recordingIdRef.current) {
      return;
    }

    let endRecordingResolve: (() => void) | null = null;
    recordingPromiseRef.current = new Promise<void>(async (resolve) => {
      endRecordingResolve = resolve;
    });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          const completeBlob = new Blob([e.data], {
            type: AUDIO_MIME_TYPE,
          });

          // saveBlob(completeBlob, "recording.mp3");
          const chunkedBlobs = await chunkBlob(completeBlob, 1.25);

          if (!recordingBlobsPromisesRef.current.has(currentRecordingRefId)) {
            recordingBlobsPromisesRef.current.set(currentRecordingRefId, []);
          }

          chunkedBlobs.forEach((blob, index) => {
            recordingBlobsPromisesRef.current.get(currentRecordingRefId)?.push(
              new Promise<string>((resolve) => {
                const fileReader = new FileReader();
                fileReader.onload = () => {
                  const blobBase64 = fileReader.result as string;
                  resolve(blobBase64);
                };

                fileReader.readAsDataURL(blob);
              }).then(async (blobBase64) => {
                return new Promise((resolve) => {
                  setTimeout(() => {
                    resolve(
                      audioUploadMutation.mutateAsync({
                        chunkBase64: blobBase64,
                        commonFileUuid: currentRecordingRefId,
                        mime: AUDIO_MIME_TYPE,
                        transcribe: true,
                        locale,
                        order: index,
                        final: index === chunkedBlobs.length - 1,
                      }),
                    );
                  }, 1000 * Math.random());
                });
              }),
            );
          });

          Promise.all(
            Array.from(
              recordingBlobsPromisesRef.current.get(currentRecordingRefId) ??
                [],
            ),
          ).then(() => {
            endRecordingResolve?.();
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
          await Promise.all([
            ...Array.from(
              recordingBlobsPromisesRef.current.get(currentRecordingRefId) ??
                [],
            ),
            recordingPromiseRef.current,
          ]);

          recordingPromiseRef.current = null;

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
          // await saveCompletedAudio.mutateAsync({
          //   commonFileUuid: currentRecordingRefId,
          // });

          setCompletedTranscriptionCommonFileUuid(currentRecordingRefId);
          transcriptionTimeoutRef.current = setTimeout(() => {
            if (!recordingIdRef.current) {
              return;
            }

            setCompletedTranscriptionCommonFileUuid(null);
            toast.error(t("prompt.transcriptionTimeout"));
            setMakingTranscription(false);
          }, 30000);

          recordingBlobsPromisesRef.current.delete(currentRecordingRefId);
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

      setCompletedTranscriptionCommonFileUuid(null);
      const currentRecordingRefId = uuidv4();
      setCurrentTranscription("");
      recordingIdRef.current = currentRecordingRefId;
      setElapsedTime(0);
      const nowStarte = Date.now();
      recordingStartTimeRef.current = nowStarte;
      timerIdRef.current = setInterval(() => {
        updateEllapsed(nowStarte);
      }, 300);
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
      setMakingTranscription(true);
      setElapsedTime(0);
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
              <div className="text-center text-sm font-medium">
                {formatEllapsedTime(ellapsedTime ?? 0)}
              </div>
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
                        <If
                          condition={
                            currentlyPlaying === recording.streamableUrl
                          }
                        >
                          <Then>
                            <Pause className="h-4 w-4" />
                          </Then>
                          <Else>
                            <Play className="h-4 w-4" />
                          </Else>
                        </If>
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
                <If condition={makingTranscription}>
                  <Then>
                    <div className="flex flex-col items-center justify-center h-full">
                      <Loader2 className="h-4 w-4 my-2 animate-spin" />
                    </div>
                  </Then>
                  <Else>
                    <p className="text-sm text-muted-foreground">
                      {t("prompt.transcriptionWillAppearHere")}
                    </p>
                  </Else>
                </If>
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
