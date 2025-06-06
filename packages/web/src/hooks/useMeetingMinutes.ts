import { useState, useCallback } from 'react';
import useChatApi from './useChatApi';
import useModel from './useModel';
import { getPrompter } from '../prompts';
import { BaseMessage, Content, Model } from 'generative-ai-use-cases-jp';
import { produce } from 'immer';

export type MeetingMinutesStyle =
  | 'standard'
  | 'executive'
  | 'detailed'
  | 'custom';

export const useMeetingMinutes = () => {
  const { predictStream } = useChatApi();
  const { modelIds: availableModels, textModels } = useModel();

  // Meeting minutes specific state
  const [minutesStyle, setMinutesStyle] =
    useState<MeetingMinutesStyle>('standard');
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [generationFrequency, setGenerationFrequency] = useState(5); // in minutes
  const [generatedMinutes, setGeneratedMinutes] = useState('');
  const [lastProcessedTranscript, setLastProcessedTranscript] = useState('');
  const [lastGeneratedTime, setLastGeneratedTime] = useState<Date | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const generateMinutes = useCallback(
    async (
      transcript: string,
      modelId: string,
      onGenerate?: (
        status: 'generating' | 'success' | 'error',
        data?: { message?: string; minutes?: string }
      ) => void
    ) => {
      if (!transcript || transcript.trim() === '') return;

      const model = textModels.find((m) => m.modelId === modelId);
      if (!model) {
        console.error('Model not found:', modelId);
        onGenerate?.('error', { message: 'Model not found' });
        return;
      }

      setLoading(true);
      onGenerate?.('generating');

      try {
        const prompter = getPrompter(model);

        const promptContent =
          minutesStyle === 'custom' && customPrompt
            ? customPrompt
            : prompter.meetingMinutesPrompt({
                transcript,
                format: minutesStyle as 'standard' | 'executive' | 'detailed',
              });

        const messages: BaseMessage[] = [
          {
            role: 'user',
            content: [
              {
                contentType: 'text',
                body: promptContent,
              },
            ] as Content[],
          },
        ];

        const stream = predictStream({
          model: model as Model,
          messages,
        });

        let fullResponse = '';
        setGeneratedMinutes('');

        for await (const chunk of stream) {
          if (chunk) {
            fullResponse += chunk;
            setGeneratedMinutes(produce((draft) => draft + chunk));
          }
        }

        setLastProcessedTranscript(transcript);
        setLastGeneratedTime(new Date());
        onGenerate?.('success', { minutes: fullResponse });
      } catch (error) {
        console.error('Error generating minutes:', error);
        onGenerate?.('error', {
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        setLoading(false);
      }
    },
    [minutesStyle, customPrompt, predictStream, textModels]
  );

  const clearMinutes = useCallback(() => {
    setGeneratedMinutes('');
    setLastProcessedTranscript('');
    setLastGeneratedTime(null);
  }, []);

  return {
    // State
    minutesStyle,
    setMinutesStyle,
    autoGenerate,
    setAutoGenerate,
    generationFrequency,
    setGenerationFrequency,
    generatedMinutes,
    setGeneratedMinutes,
    lastProcessedTranscript,
    setLastProcessedTranscript,
    lastGeneratedTime,
    setLastGeneratedTime,
    customPrompt,
    setCustomPrompt,
    loading,

    // Actions
    generateMinutes,
    clearMinutes,

    // Utilities
    availableModels,
  };
};

export default useMeetingMinutes;
