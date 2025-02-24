import React, { useCallback, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import InputText from '../components/InputText';
import Select from '../components/Select';
import Button from '../components/Button';
import Markdown from '../components/Markdown';
import useTyping from '../hooks/useTyping';
import useChat from '../hooks/useChat';
import { create } from 'zustand';
import debounce from 'lodash.debounce';
import { TodaysEnglishQueryParams } from '../@types/navigate';
import { MODELS } from '../hooks/useModel';
import { getPrompter } from '../prompts';
import queryString from 'query-string';


type StateType = {
  word: string;
  setWord: (s: string) => void;
  generatedConversation: string;
  setGeneratedConversation: (s: string) => void;
  clear: () => void;
};

const useTodaysEnglishState = create<StateType>((set) => {
  return {
    word: '',
    generatedConversation: '',
    setWord: (s: string) => {
      set(() => ({
        word: s,
      }));
    },
    setGeneratedConversation: (s: string) => {
      set(() => ({
        generatedConversation: s,
      }));
    },
    clear: () => {
      set(() => ({
        word: '',
        generatedConversation: '',
      }))
    }
  };
});

const TodaysEnglishPage: React.FC = () => {
  const {
    word,
    setWord,
    generatedConversation,
    setGeneratedConversation,
    clear,
  } = useTodaysEnglishState();

  const { pathname, search } = useLocation();

  const {
    getModelId,
    setModelId,
    loading,
    messages,
    postChat,
    continueGeneration,
    clear: clearChat,
    updateSystemContextByModel,
    getStopReason,
  } = useChat(pathname);
  const { setTypingTextInput, typingTextOutput } = useTyping(loading);
  const { modelIds: availableModels } = MODELS;
  const modelId = getModelId();
  const prompter = useMemo(() => {
    return getPrompter(modelId);
  }, [modelId]);
  const stopReason = getStopReason();

  useEffect(() => {
    updateSystemContextByModel();
    // eslint-disable-next-line  react-hooks/exhaustive-deps
  }, [prompter]);

  // Memo 変数
  const disabledExec = useMemo(() => {
    return word === '' || loading;
  }, [word, loading]);

  useEffect(() => {
    const _modelId = !modelId ? availableModels[0] : modelId;
    if (search !== '') {
      const params = queryString.parse(search) as TodaysEnglishQueryParams;
      setWord(params.word ?? '');
      setModelId(
        availableModels.includes(params.modelId ?? '')
          ? params.modelId!
          : _modelId
      );
    } else {
      setModelId(_modelId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    setWord,
    modelId,
    availableModels,
    search,
  ]);

  useEffect(() => {
    setTypingTextInput(generatedConversation);
  }, [generatedConversation, setTypingTextInput]);

  useEffect(() => {
    onWordChange(word, loading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word]);

  const onWordChange = useCallback(
    debounce(
      (
        _word: string,
        _loading: boolean
      ) => {
        _word = _word.trim();
        if (_word === '') {
          setGeneratedConversation('');
        }
        if (_word !== '' && !_loading) {
          getConversation(_word);
        }
      },
      1000
    ),
    [prompter]
  );

  useEffect(() => {
    if (messages.length === 0) return;
    const _lastMessage = messages[messages.length - 1];
    if (_lastMessage.role !== 'assistant') return;
    const _response = messages[messages.length - 1].content;
    setGeneratedConversation(_response.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const getConversation = (
    word: string
  ) => {
    postChat(
      word.trim(),
      true
    );
  };

  // 作文を実行
  const onClickExec = useCallback(() => {
    if (loading) return;
    getConversation(word);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word]);

  // リセット
  const onClickClear = useCallback(() => {
    clear();
    clearChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex flex-col gap-4 p-4">
        <h1 className="text-2xl font-bold">Today's English Conversation</h1>
        <p className="text-sm text-gray-600">
          Enter a word to generate business English conversations
        </p>
        <Select
              value={modelId}
              onChange={setModelId}
              options={availableModels.map((m) => {
                return { value: m, label: m };
              })}
            />
        <div className="flex gap-2">
          <InputText
            value={word}
            onChange={setWord}
            placeholder="Enter a word..."
          />
          <Button disabled={!word.trim() || loading} onClick={onClickExec}>
            実行
          </Button>
          <Button outlined onClick={onClickClear} disabled={disabledExec}>
            クリア
          </Button>
        </div>

        <div className="flex gap-2">
          <Markdown>{typingTextOutput}</Markdown>
            {loading && (
              <div className="border-aws-sky size-5 animate-spin rounded-full border-4 border-t-transparent"></div>
            )}
            {!loading && generatedConversation === '' && (
              <div className="text-gray-500">
                作成文がここに表示されます
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TodaysEnglishPage;
