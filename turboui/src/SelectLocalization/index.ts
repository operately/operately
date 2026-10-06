import { useTranslation } from "react-i18next";
import type { AriaLiveMessages, GroupBase } from "react-select";
import { tn } from "../i18n";

// Shared defaults for the single-select controls used by forms and people search.
export function useSelectLocalization<Option>() {
  const { t } = useTranslation();
  const ariaLiveMessages: AriaLiveMessages<Option, false, GroupBase<Option>> = {
    guidance: ({ context, isSearchable, tabSelectsValue, "aria-label": label }) => {
      if (context === "menu") {
        const navigation = t(
          "Use Up and Down to choose options, press Enter to select the focused option, and press Escape to exit the menu.",
        );
        return tabSelectsValue ? `${navigation} ${t("Press Tab to select the option and exit the menu.")}` : navigation;
      }
      if (context === "value")
        return t("Use Left and Right to focus selected values. Press Backspace to remove the focused value.");
      const focus = t("{{label}} is focused. Press Down to open the menu.", { label: label || t("Select") });
      return isSearchable ? `${focus} ${t("Type to refine the list.")}` : focus;
    },
    onChange: ({ action, label, labels, isDisabled }) => {
      switch (action) {
        case "clear":
          return t("All selected options have been cleared.");
        case "deselect-option":
        case "pop-value":
        case "remove-value":
          return t("Option {{label}} deselected.", { label });
        case "select-option":
          return isDisabled
            ? t("Option {{label}} is disabled. Select another option.", { label })
            : t("Option {{label}} selected.", { label });
        case "initial-input-focus":
          return labels.length ? t("Selected: {{labels}}.", { labels: labels.join(", ") }) : "";
        default:
          return "";
      }
    },
    onFocus: ({ label, focused, options, selectValue, context, isDisabled, isSelected }) => {
      const available =
        context === "value" ? selectValue : options.flatMap((option) => (isGroup(option) ? option.options : [option]));
      const focus = t("{{label}}, option {{position}} of {{total}}.", {
        label,
        position: available.indexOf(focused) + 1,
        total: available.length,
      });
      if (isDisabled) return `${focus} ${t("This option is disabled.")}`;
      return isSelected ? `${focus} ${t("This option is selected.")}` : focus;
    },
    onFilter: ({ inputValue, resultsMessage }) =>
      inputValue ? `${resultsMessage} ${t("Search term: {{term}}.", { term: inputValue })}` : resultsMessage,
  };

  return {
    placeholder: t("Select..."),
    loadingMessage: () => t("Loading..."),
    noOptionsMessage: () => t("No options"),
    screenReaderStatus: ({ count }: { count: number }) =>
      tn("{{count}} result available.", "{{count}} results available.", count),
    ariaLiveMessages,
  };
}

function isGroup<Option>(option: Option | GroupBase<Option>): option is GroupBase<Option> {
  return typeof option === "object" && option !== null && "options" in option;
}
