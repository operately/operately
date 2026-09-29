import React from "react";
import { Trans as RichTranslation } from "react-i18next";
import type { TOptions } from "i18next";

type Props = Omit<React.ComponentProps<typeof RichTranslation>, "tOptions"> & { tOptions?: TOptions };

/** Keep user-authored names as text while allowing catalog-owned rich-text tags. */
export function Trans(props: Props) {
  const values =
    props.values && Object.fromEntries(Object.entries(props.values).map(([key, value]) => [key, value ?? ""]));

  return (
    <RichTranslation
      {...props}
      values={values}
      shouldUnescape
      tOptions={{
        ...props.tOptions,
        interpolation: { ...props.tOptions?.interpolation, escapeValue: true },
      }}
    />
  );
}
