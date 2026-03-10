const WORD_PATTERN = /[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g;

export type ParsedSentence = {
  text: string;
  start: number;
  end: number;
  wordCount: number;
  sentenceNumber: number;
  paragraphNumber: number;
};

export type ParsedParagraph = {
  text: string;
  start: number;
  end: number;
  wordCount: number;
  sentenceCount: number;
  paragraphNumber: number;
};

export type ParsedDraft = {
  text: string;
  sentences: ParsedSentence[];
  paragraphs: ParsedParagraph[];
};

function trimSpan(text: string, start: number, end: number) {
  let nextStart = start;
  let nextEnd = end;

  while (nextStart < nextEnd && /\s/.test(text[nextStart] ?? '')) {
    nextStart += 1;
  }

  while (nextEnd > nextStart && /\s/.test(text[nextEnd - 1] ?? '')) {
    nextEnd -= 1;
  }

  return {
    start: nextStart,
    end: nextEnd,
  };
}

function countWords(text: string) {
  return text.match(WORD_PATTERN)?.length ?? 0;
}

function parseParagraphs(text: string) {
  const paragraphs: Array<{ start: number; end: number; paragraphNumber: number }> = [];
  const separatorPattern = /\n\s*\n/g;
  let cursor = 0;
  let paragraphNumber = 0;

  for (const match of text.matchAll(separatorPattern)) {
    const span = trimSpan(text, cursor, match.index ?? cursor);

    if (span.start < span.end) {
      paragraphNumber += 1;
      paragraphs.push({
        start: span.start,
        end: span.end,
        paragraphNumber,
      });
    }

    cursor = (match.index ?? cursor) + match[0].length;
  }

  const finalSpan = trimSpan(text, cursor, text.length);

  if (finalSpan.start < finalSpan.end) {
    paragraphNumber += 1;
    paragraphs.push({
      start: finalSpan.start,
      end: finalSpan.end,
      paragraphNumber,
    });
  }

  return paragraphs;
}

function parseSentences(paragraphText: string, paragraphStart: number, paragraphNumber: number, sentenceOffset: number) {
  const sentences: ParsedSentence[] = [];
  const sentencePattern = /[^.!?]+(?:[.!?]+|$)/g;
  let sentenceNumber = sentenceOffset;

  for (const match of paragraphText.matchAll(sentencePattern)) {
    const span = trimSpan(paragraphText, match.index ?? 0, (match.index ?? 0) + match[0].length);
    const textStart = paragraphStart + span.start;
    const textEnd = paragraphStart + span.end;

    if (textStart >= textEnd) {
      continue;
    }

    sentenceNumber += 1;

    sentences.push({
      text: paragraphText.slice(span.start, span.end),
      start: textStart,
      end: textEnd,
      wordCount: countWords(paragraphText.slice(span.start, span.end)),
      sentenceNumber,
      paragraphNumber,
    });
  }

  return sentences;
}

export function parseDraft(text: string): ParsedDraft {
  const paragraphSpans = parseParagraphs(text);
  const sentences: ParsedSentence[] = [];
  const paragraphs: ParsedParagraph[] = [];
  let sentenceCount = 0;

  for (const paragraphSpan of paragraphSpans) {
    const paragraphText = text.slice(paragraphSpan.start, paragraphSpan.end);
    const paragraphSentences = parseSentences(
      paragraphText,
      paragraphSpan.start,
      paragraphSpan.paragraphNumber,
      sentenceCount,
    );

    sentenceCount += paragraphSentences.length;
    sentences.push(...paragraphSentences);
    paragraphs.push({
      text: paragraphText,
      start: paragraphSpan.start,
      end: paragraphSpan.end,
      wordCount: countWords(paragraphText),
      sentenceCount: paragraphSentences.length,
      paragraphNumber: paragraphSpan.paragraphNumber,
    });
  }

  return {
    text,
    sentences,
    paragraphs,
  };
}
