import { type VariantProps, cva } from "class-variance-authority";
import "./tailwind.css";

import clsx from "clsx";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneLight,
  vscDarkPlus,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { twMerge } from "tailwind-merge";
import type { MessageParam } from "./utils";

const useTheme = () => {
  const [isDark, setDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setDark(document.documentElement.classList.contains("dark"));
    };
    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      setDark(event.matches);
    };
    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  return { isDark };
};

const bubbleVariants = cva(
  "flex flex-col gap-1 justify-center rounded-lg dark:text-gray-200 text-gray-800 max-w-full overflow-x-auto",
  {
    variants: {
      size: {
        default: "px-4 py-2",
        lg: "px-6 py-3 text-lg",
        md: "px-4 py-2 text-base",
        sm: "px-3 py-1 text-sm",
        xs: "px-2 py-1 text-xs",
      },
      align: {
        left: "self-start",
        center: "self-center",
        right: "self-end",
      },
      background: {
        transparent: "bg-transparent",
        solid: "bg-gray-100 dark:bg-gray-800",
      },
    },
    defaultVariants: {
      size: "default",
      align: "left",
    },
  },
);

export type BackgroundType =
  | "transparent"
  | "solid"
  | "left-only"
  | "right-only";
/**
 * Props for the Bubble component.
 */
export interface BubbleProps
  extends React.ComponentProps<"div">,
    Omit<VariantProps<typeof bubbleVariants>, "background"> {
  /**
   * The text to display in the bubble.
   * @description The content of the bubble, which can include Markdown syntax.
   */
  text: string;
  /**
   * Whether to display the background of the bubble.
   * @default "right-only"
   */
  background?: BackgroundType;
}

export function Bubble({
  className,
  text,
  size,
  align,
  background = "right-only",
  ...props
}: BubbleProps) {
  const { isDark } = useTheme();

  return (
    <div
      data-slot="bubble"
      className={twMerge(
        clsx(
          bubbleVariants({
            className,
            size,
            align,
            background:
              background === "solid" ||
              (background === "left-only" && align === "left") ||
              (background === "right-only" && align === "right")
                ? "solid"
                : "transparent",
          }),
        ),
      )}
      {...props}
    >
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        components={{
          code(props) {
            const { children, className, ref: _ref, ...rest } = props;
            const match = /language-(\w+)/.exec(className || "");
            return match ? (
              <div className="w-full overflow-x-auto border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <SyntaxHighlighter
                  {...rest}
                  PreTag="div"
                  language={match[1]}
                  style={isDark ? vscDarkPlus : oneLight}
                  customStyle={{
                    background: "transparent",
                    margin: 0,
                    padding: "1rem",
                    borderRadius: "0.5rem",
                    overflowX: "auto",
                  }}
                  codeTagProps={{
                    style: {
                      fontFamily: "monospace",
                      fontSize: "0.875rem",
                    },
                  }}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code {...rest} className={className}>
                {children}
              </code>
            );
          },
        }}
      >
        {text}
      </Markdown>
    </div>
  );
}

export interface AvatarProps {
  text?: string;
  imageUrl?: string;
}

export function Avatar({
  className,
  text,
  imageUrl,
  ...props
}: React.ComponentProps<"div"> & AvatarProps) {
  return (
    <div
      data-slot="avatar"
      className={twMerge(
        clsx(
          "flex items-center justify-center w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-800 dark:text-gray-200 text-gray-800",
          className,
        ),
      )}
      {...props}
    >
      {imageUrl ? (
        <img
          className="w-full h-full object-cover rounded-full"
          src={imageUrl}
          alt={text}
        />
      ) : (
        text
      )}
    </div>
  );
}

export interface BubbleListProps extends React.ComponentProps<"div"> {
  messages: MessageParam[];
  background?: BackgroundType;
  footer?: React.ReactNode;
}

export function BubbleList({
  className,
  background,
  footer,
  ...props
}: BubbleListProps) {
  const { messages } = props;
  const lastMessageRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: This effect runs only when messages change
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages]);

  return (
    <div
      data-slot="bubble-list"
      className={twMerge(
        clsx("flex flex-col overflow-y-auto flex-1 gap-4", className),
      )}
      {...props}
    >
      <div
        data-slot="bubble-items"
        className="flex flex-col max-w-full flex-1 gap-4"
      >
        {messages.map((message, index) => (
          <div
            key={message.content.slice(0, 8) + index.toString()}
            data-slot="bubble-item"
            className={twMerge(
              clsx(
                "flex items-start gap-2",
                message.align === "right" && "flex-row-reverse",
              ),
            )}
          >
            {message.avatar && (
              <Avatar
                className="flex-shrink-0"
                {...(typeof message.avatar === "string"
                  ? { imageUrl: message.avatar }
                  : message.avatar)}
              />
            )}
            <Bubble
              text={message.content}
              align={message.align}
              background={background}
              ref={index === messages.length - 1 ? lastMessageRef : undefined}
            />
          </div>
        ))}
      </div>
      {footer && (
        <div
          data-slot="bubble-footer"
          className="flex items-center justify-center mt-4"
        >
          {footer}
        </div>
      )}
    </div>
  );
}
