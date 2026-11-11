import { highlightTerms } from '@/domain/highlight';
import type { LanguageCode } from '@/domain/languages';

import { AppText, type AppTextProps } from './AppText';

type HighlightedTextProps = Omit<AppTextProps, 'children'> & {
  text: string;
  /** Words to show in bold (in any form: plural, -ing…), e.g. the word and its translations. */
  terms: string[];
  /** Language of `text`: lets "to run" / "the battery" drop their first word. */
  language?: LanguageCode;
};

/** A sentence with the studied word in bold: "This film is so **boring**". */
export function HighlightedText({ text, terms, language, ...rest }: HighlightedTextProps) {
  return (
    <AppText {...rest}>
      {highlightTerms(text, terms, language).map((part, index) =>
        part.bold ? (
          <AppText key={index} variant="bodyBold" color={rest.color}>
            {part.text}
          </AppText>
        ) : (
          part.text
        )
      )}
    </AppText>
  );
}
