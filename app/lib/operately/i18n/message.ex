defmodule Operately.I18n.Message do
  @moduledoc false

  @enforce_keys [:msgid]
  defstruct [
    :msgid,
    msgid_plural: nil,
    msgctxt: nil,
    msgstr: "",
    msgstr_plural: %{},
    references: [],
    extracted_comments: []
  ]

  @type t :: %__MODULE__{
          msgid: String.t(),
          msgid_plural: String.t() | nil,
          msgctxt: String.t() | nil,
          msgstr: String.t(),
          msgstr_plural: %{optional(non_neg_integer()) => String.t()},
          references: [{String.t(), pos_integer()}],
          extracted_comments: [String.t()]
        }

  def key(%__MODULE__{msgctxt: msgctxt, msgid: msgid}), do: {msgctxt || "", msgid}

  def merge(%__MODULE__{} = left, %__MODULE__{} = right) do
    %__MODULE__{
      msgid: left.msgid,
      msgid_plural: left.msgid_plural || right.msgid_plural,
      msgctxt: left.msgctxt || right.msgctxt,
      msgstr: prefer_present(left.msgstr, right.msgstr),
      msgstr_plural: Map.merge(left.msgstr_plural, right.msgstr_plural, fn _key, l, r -> prefer_present(l, r) end),
      references: merge_references(left.references, right.references),
      extracted_comments: (left.extracted_comments ++ right.extracted_comments) |> Enum.uniq() |> Enum.sort()
    }
  end

  defp prefer_present("", fallback), do: fallback
  defp prefer_present(value, _fallback), do: value

  defp merge_references(left, right) do
    (left ++ right)
    |> Enum.uniq()
    |> Enum.sort()
  end
end
