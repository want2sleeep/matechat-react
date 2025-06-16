import "./tailwind.css";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import PublishNew from "./icons/publish-new.svg";
import QuickStop from "./icons/quick-stop.svg";
import type { Backend } from "./utils";

export function SenderButton({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="sender-button"
      className={twMerge(
        clsx(
          "flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 hover:bg-blue-500/90 text-white",
          className,
        ),
      )}
      {...props}
    />
  );
}

export interface SenderProps extends React.ComponentProps<"div"> {
  initialMessage?: string;
  placeholder?: string;
  input: Backend["input"];
  onMessageChange?: (message: string) => void;
  onSend?: (controller: AbortController) => void;
}
export function Sender({
  className,
  initialMessage = "",
  placeholder = "Type your message here...",
  onMessageChange,
  input,
  onSend,
  ...props
}: SenderProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState(initialMessage);
  const [isSending, setIsSending] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: height adjustment
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    onMessageChange?.(message || "");
  }, [message]);

  const [controller, setController] = useState<AbortController | null>(null);
  const handleSend = () => {
    if (isSending) {
      setIsSending(false);
      return controller?.abort();
    }

    if (message.trim() === "") return;
    setIsSending(true);
    const newController = new AbortController();
    setController(newController);
    const maybePromise = input(message, {
      callbacks: {
        onFinish: () => setIsSending(false),
      },
      signal: newController.signal,
    });
    setMessage("");
    if (maybePromise instanceof Promise) {
      maybePromise.then(() => {
        onSend?.(newController);
      });
    } else {
      onSend?.(newController);
    }
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      data-slot="sender"
      className={twMerge(
        clsx(
          "flex flex-col items-center gap-4 border border-gray-200 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500",
          className,
        ),
      )}
      {...props}
    >
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full py-4 px-4 border-0 rounded-2xl resize-none focus:ring-0 focus:outline-none text-gray-700 placeholder-gray-400"
        rows={1}
      />
      <div className="flex items-center justify-between w-full px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{message.length} / 500</span>
        </div>
        <SenderButton onClick={handleSend}>
          {isSending ? (
            <img
              className="filter brightness-0 invert"
              src={QuickStop}
              alt="icon-quick-stop"
            />
          ) : (
            <img
              className="filter brightness-0 invert"
              src={PublishNew}
              alt="icon-publish-new"
            />
          )}
        </SenderButton>
      </div>
    </div>
  );
}
