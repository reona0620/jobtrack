"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/page-header";
import { useApplications } from "@/hooks/use-applications";
import { scheduleTypeLabels, selectionTypeLabels, statusLabels } from "@/lib/application";

type ChatLine = { role: "user" | "assistant"; content: string };
type ChatSession = { id: string; title: string; updatedAt: string; messages: ChatLine[] };
type PendingQuestion = { question: string; context: string; chatId: string };

const CHAT_HISTORY_KEY = "jobtrack.ai-chat-history.v1";
const ACTIVE_CHAT_KEY = "jobtrack.ai-active-chat.v1";

const exampleQuestions = [
  "次の面接はどの会社？",
  "応募締切が近い企業を教えて",
  "登録企業を一覧にして",
];

export function AssistantView() {
  const { applications } = useApplications();
  const [question, setQuestion] = useState("");
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [historyActionChatId, setHistoryActionChatId] = useState<string | null>(null);
  const [historyReady, setHistoryReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "asking" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorDetail, setErrorDetail] = useState("");
  const [errorChatId, setErrorChatId] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const loadedRef = useRef(false);
  const pendingRef = useRef<PendingQuestion | null>(null);
  const activeRequestChatRef = useRef<string | null>(null);

  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null;
  const messages = activeChat?.messages ?? [];

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CHAT_HISTORY_KEY);
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      const restored = Array.isArray(parsed)
        ? parsed.filter((chat): chat is ChatSession =>
            !!chat && typeof chat === "object" &&
            typeof chat.id === "string" && typeof chat.title === "string" &&
            typeof chat.updatedAt === "string" && Array.isArray(chat.messages) &&
            chat.messages.every((message: ChatLine) =>
              message && (message.role === "user" || message.role === "assistant") && typeof message.content === "string",
            ),
          )
        : [];
      setChats(restored);
      const lastActiveId = window.localStorage.getItem(ACTIVE_CHAT_KEY);
      setActiveChatId(restored.some((chat) => chat.id === lastActiveId) ? lastActiveId : restored[0]?.id ?? null);
    } catch {
      setChats([]);
      setActiveChatId(null);
    } finally {
      setHistoryReady(true);
    }
  }, []);

  useEffect(() => {
    if (!historyReady) return;
    window.localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chats));
  }, [chats, historyReady]);

  useEffect(() => {
    if (!historyReady) return;
    if (activeChatId) window.localStorage.setItem(ACTIVE_CHAT_KEY, activeChatId);
    else window.localStorage.removeItem(ACTIVE_CHAT_KEY);
  }, [activeChatId, historyReady]);

  function appendChatMessage(chatId: string, message: ChatLine) {
    setChats((current) => current
      .map((chat) => {
        if (chat.id !== chatId) return chat;
        const firstUserMessage = message.role === "user" && !chat.messages.some((line) => line.role === "user");
        const title = firstUserMessage ? (message.content.length > 34 ? message.content.slice(0, 34) + "…" : message.content) : chat.title;
        return { ...chat, title, updatedAt: new Date().toISOString(), messages: [...chat.messages, message] };
      })
      .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt)));
  }

  function startNewChat() {
    const id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : "chat-" + Date.now();
    const newChat: ChatSession = { id, title: "新しいチャット", updatedAt: new Date().toISOString(), messages: [] };
    setChats((current) => [newChat, ...current]);
    setActiveChatId(id);
    setQuestion("");
    setErrorMessage("");
    setErrorDetail("");
    setErrorChatId(null);
    setHistoryActionChatId(null);
  }

  function deleteChat(chatId: string) {
    const chat = chats.find((item) => item.id === chatId);
    if (!chat || !window.confirm(`「${chat.title}」を履歴から削除しますか？`)) return;

    const remaining = chats.filter((item) => item.id !== chatId);
    setChats(remaining);
    setHistoryActionChatId(null);
    if (activeChatId === chatId) setActiveChatId(remaining[0]?.id ?? null);
    if (activeRequestChatRef.current === chatId) {
      workerRef.current?.terminate();
      workerRef.current = null;
      loadedRef.current = false;
      pendingRef.current = null;
      activeRequestChatRef.current = null;
      setStatus("idle");
    }
  }

  function showError(message: string, detail = "") {
    workerRef.current?.terminate();
    workerRef.current = null;
    loadedRef.current = false;
    pendingRef.current = null;
    setErrorChatId(activeRequestChatRef.current);
    activeRequestChatRef.current = null;
    setErrorMessage(message);
    setErrorDetail(detail);
    setStatus("error");
  }

  function createContext() {
    const records = applications.flatMap((application) => {
      const tracks = application.tracks?.length ? application.tracks : [null];
      return tracks.map((track) => ({
        company: application.companyName,
        selectionType: track?.selectionType ? selectionTypeLabels[track.selectionType] : "未登録",
        position: track?.position ?? "",
        status: track ? statusLabels[track.status] : "未登録",
        deadline: track?.deadline ?? null,
        companyUrl: application.companyUrl,
        userId: application.userId ?? null,
        schedules: (track?.schedules ?? []).map((schedule) => ({
          type: scheduleTypeLabels[schedule.type],
          startsAt: schedule.startsAt,
          endsAt: schedule.endsAt,
          note: schedule.note,
        })),
        memo: track?.memo ?? "",
        entrySheetResponses: (track?.entrySheetResponses ?? []).map((response) => ({
          question: response.question,
          answer: response.answer,
        })),
      }));
    });
    return JSON.stringify(records);
  }

  function ask(nextQuestion: string) {
    const trimmedQuestion = nextQuestion.trim();
    if (!trimmedQuestion || status === "loading" || status === "asking") return;

    let chatId = activeChatId;
    if (!chatId) {
      chatId = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : "chat-" + Date.now();
      setChats((current) => [{ id: chatId!, title: "新しいチャット", updatedAt: new Date().toISOString(), messages: [] }, ...current]);
      setActiveChatId(chatId);
    }
    appendChatMessage(chatId, { role: "user", content: trimmedQuestion });
    setQuestion("");
    setErrorMessage("");
    setErrorDetail("");
    setErrorChatId(null);
    activeRequestChatRef.current = chatId;
    const request: PendingQuestion = { question: trimmedQuestion, context: createContext(), chatId };

    if (!workerRef.current) {
      try {
        const worker = new Worker(
          new URL("../workers/assistant.worker.ts", import.meta.url),
          { type: "module" },
        );
        workerRef.current = worker;
        pendingRef.current = request;
        worker.onmessage = (event: MessageEvent<{ type: string; answer?: string; message?: string }>) => {
          if (event.data.type === "ready") {
            loadedRef.current = true;
            const pending = pendingRef.current;
            pendingRef.current = null;
            setStatus("asking");
            if (pending) worker.postMessage({ type: "ask", ...pending });
          } else if (event.data.type === "need-model") {
            setStatus("loading");
            worker.postMessage({ type: "load" });
          } else if (event.data.type === "answer") {
            pendingRef.current = null;
            const targetChatId = activeRequestChatRef.current;
            if (targetChatId) appendChatMessage(targetChatId, { role: "assistant", content: event.data.answer ?? "回答を生成できませんでした。" });
            activeRequestChatRef.current = null;
            setStatus("idle");
          } else if (event.data.type === "error") {
            showError(
              "AIモデルを起動できませんでした。WebGPU対応ブラウザで再度お試しください。",
              event.data.message ?? "詳細を取得できませんでした。",
            );
          }
        };
        worker.onerror = (event) => {
          showError(
            "AIモデルを起動できませんでした。WebGPU対応ブラウザで再度お試しください。",
            event.message,
          );
        };
        setStatus("asking");
        worker.postMessage({ type: "ask", ...request });
      } catch {
        setErrorMessage("このブラウザではローカルAIを起動できませんでした。");
        setStatus("error");
      }
      return;
    }

    if (!loadedRef.current) {
      pendingRef.current = request;
      setStatus("asking");
      workerRef.current.postMessage({ type: "ask", ...request });
      return;
    }

    pendingRef.current = request;
    setStatus("asking");
    workerRef.current.postMessage({ type: "ask", ...request });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    ask(question);
  }

  const busy = status === "loading" || status === "asking";
  const activeBusy = busy && activeRequestChatRef.current === activeChatId;
  const showCurrentError = !!errorMessage && errorChatId === activeChatId;

  return (
    <main className="min-h-screen bg-[#f5f7fb]">
      <PageHeader title="AIに質問できます。" titleClassName="text-sm font-medium leading-6 text-slate-300" titlePlacement="header" titleBlockClassName="mt-2" showBackLink={false} />
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-8 sm:py-8 md:flex-row">
        <aside className={`w-full shrink-0 transition-[width] ${historyOpen ? "md:w-72" : "md:w-12"}`} aria-label="チャット履歴">
          <div className={historyOpen ? "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" : "flex justify-center"}>
            <div className={`flex items-center ${historyOpen ? "gap-2 p-2" : "justify-center"}`}>
              {historyOpen ? (
                <button type="button" onClick={startNewChat} className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-700 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800">
                  <span aria-hidden="true" className="text-lg leading-none">＋</span> 新しいチャット
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setHistoryOpen((open) => !open)}
                aria-label={historyOpen ? "履歴をしまう" : "履歴を表示"}
                aria-expanded={historyOpen}
                title={historyOpen ? "履歴をしまう" : "履歴を表示"}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              >
                <span aria-hidden="true" className="text-lg">{historyOpen ? "←" : "☰"}</span>
              </button>
            </div>
            {historyOpen ? (
              <div className="max-h-52 overflow-y-auto border-t border-slate-100 p-2 md:max-h-[calc(100vh-17rem)]">
                <h2 className="px-2 py-2 text-xs font-bold tracking-wide text-slate-400">履歴</h2>
                {chats.length ? (
                  <div className="space-y-1">
                    {chats.map((chat) => (
                      <div key={chat.id} className="rounded-xl">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => { setActiveChatId(chat.id); setErrorMessage(""); setErrorDetail(""); setErrorChatId(null); setHistoryActionChatId(null); }}
                            aria-current={activeChatId === chat.id ? "page" : undefined}
                            className={`min-w-0 flex-1 truncate rounded-xl px-3 py-2.5 text-left text-sm transition ${activeChatId === chat.id ? "bg-teal-50 font-semibold text-teal-900" : "text-slate-700 hover:bg-slate-50"}`}
                          >
                            {chat.title}
                          </button>
                          <button
                            type="button"
                            onClick={() => setHistoryActionChatId((current) => current === chat.id ? null : chat.id)}
                            aria-label={`${chat.title}の操作`}
                            aria-expanded={historyActionChatId === chat.id}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                          >
                            <span aria-hidden="true">⋯</span>
                          </button>
                        </div>
                        {historyActionChatId === chat.id ? (
                          <div className="ml-2 mt-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                            <button type="button" onClick={() => deleteChat(chat.id)} className="w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-50">
                              履歴を削除
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-3 py-3 text-sm text-slate-400">履歴はまだありません。</p>
                )}
              </div>
            ) : null}
          </div>
        </aside>

        <section className="min-w-0 flex-1 rounded-[1.75rem] bg-[radial-gradient(#cbd5e1_0.8px,transparent_0.8px)] [background-size:18px_18px] p-3 sm:p-5">
          <div className="flex min-h-[65vh] flex-col rounded-[1.4rem] border border-slate-200/90 bg-white/95 px-4 py-5 shadow-sm sm:px-6 sm:py-6">
            {messages.length === 0 ? (
              <div className="flex flex-1 flex-col justify-center">
                <h1 className="text-center text-xl font-normal tracking-tight text-slate-700 sm:text-2xl">何について聞きたいですか？</h1>
                <p className="text-center text-sm text-slate-500">登録した企業や選考状況、締切、面接予定について質問できます。</p>
                <form onSubmit={handleSubmit} autoComplete="off" className="mt-5 flex gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-50">
                  <label className="sr-only" htmlFor="assistant-question">質問</label>
                  <input id="assistant-question" name="assistant-question" autoComplete="off" value={question} onChange={(event) => setQuestion(event.target.value)} disabled={busy} placeholder={busy ? "回答を生成しています…" : "質問を入力してください"} className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60" />
                  <button type="submit" aria-label="質問する" title="質問する" disabled={busy || !question.trim()} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-700 text-2xl font-medium leading-none text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40"><span aria-hidden="true" className="-mt-0.5">↑</span></button>
                </form>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {exampleQuestions.map((example) => (
                    <button key={example} type="button" disabled={busy} onClick={() => ask(example)} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 disabled:opacity-50">{example}</button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto pb-5" aria-live="polite">
                  {messages.map((message, index) => (
                    <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <p className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"}`}>{message.content}</p>
                    </div>
                  ))}
                  {activeBusy ? <p className="text-sm text-slate-500">考えています…</p> : null}
                </div>
                {busy && !activeBusy ? <p className="mb-2 text-center text-xs text-slate-400">別のチャットの回答を生成中です。</p> : null}
                <form onSubmit={handleSubmit} autoComplete="off" className="mt-auto flex gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-50">
                  <label className="sr-only" htmlFor="assistant-question">質問</label>
                  <input id="assistant-question" name="assistant-question" autoComplete="off" value={question} onChange={(event) => setQuestion(event.target.value)} disabled={busy} placeholder="質問を入力してください" className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60" />
                  <button type="submit" aria-label="質問する" title="質問する" disabled={busy || !question.trim()} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-700 text-2xl font-medium leading-none text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40"><span aria-hidden="true" className="-mt-0.5">↑</span></button>
                </form>
              </>
            )}

            {showCurrentError ? (
              <div role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800">
                <p>{errorMessage}</p>
                {errorDetail ? <details className="mt-2 text-xs"><summary className="cursor-pointer font-semibold">エラー詳細</summary><pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono">{errorDetail}</pre></details> : null}
                <p className="mt-1 text-xs">通常の企業一覧や検索機能は引き続き使えます。</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
