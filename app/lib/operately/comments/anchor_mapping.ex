defmodule Operately.Comments.AnchorMapping do
  @moduledoc "Maps anchors between rich-text snapshots; ambiguous or deleted selections detach."
  alias Operately.RichContent.Selection

  def prepare(old_content, new_content) do
    with {:ok, old} <- Selection.index(old_content),
         {:ok, new} <- Selection.index(new_content) do
      old_tokens = Enum.reject(old.tokens, &(&1.kind == :block))
      new_tokens = Enum.reject(new.tokens, &(&1.kind == :block))

      unchanged = Enum.map(old_tokens, & &1.value) == Enum.map(new_tokens, & &1.value)

      %{
        old: old,
        new: new,
        old_text: document_text(old),
        new_text: document_text(new),
        unchanged: unchanged,
        forward: if(unchanged, do: %{}, else: correspondences(old_tokens, new_tokens)),
        reverse: if(unchanged, do: %{}, else: correspondences(Enum.reverse(old_tokens), Enum.reverse(new_tokens)))
      }
    else
      _ -> :invalid
    end
  end

  def remap(%{status: :attached} = anchor, %{old: old, new: new} = mapping, version) do
    range = {anchor.current_from, anchor.current_to}

    with {:ok, previous} <- Selection.extract(old, range),
         {:ok, {from, to}} <- mapped_range(mapping, range),
         {:ok, current} <- Selection.extract(new, {from, to}),
         true <- mapping.unchanged or unambiguous_context?(mapping, range, previous, current) do
      %{anchor | status: :attached, current_version: version, current_from: from, current_to: to}
    else
      _ -> detach(anchor, version)
    end
  end

  def remap(anchor, _, version), do: detach(anchor, version)

  defp detach(anchor, version), do: %{anchor | status: :unattached, current_version: version, current_from: nil, current_to: nil}

  defp mapped_range(%{unchanged: true}, range), do: {:ok, range}

  defp mapped_range(mapping, {from, to}) do
    selected = Enum.filter(mapping.old.tokens, &(&1.kind == :text and &1.from >= from and &1.to <= to))
    forward = mapped_tokens(selected, mapping.forward)
    reverse = mapped_tokens(selected, mapping.reverse)
    range = token_range(forward)

    if range != nil and range == token_range(reverse) and meaningful_survivor?(selected, forward) and meaningful_survivor?(selected, reverse) do
      {:ok, range}
    else
      :error
    end
  end

  defp token_range([]), do: nil
  defp token_range(tokens), do: {hd(tokens).from, List.last(tokens).to}

  defp mapped_tokens(tokens, matches) do
    Enum.flat_map(tokens, fn token ->
      case Map.fetch(matches, token.from) do
        {:ok, mapped} -> [mapped]
        :error -> []
      end
    end)
  end

  defp meaningful_survivor?(selected, surviving) do
    Enum.all?(selected, &(String.trim(&1.text) == "")) or Enum.any?(surviving, &(String.trim(&1.text) != ""))
  end

  # Repeated text needs context; a changed quote needs surviving edges or context.
  defp unambiguous_context?(mapping, {from, to}, previous, current) do
    repeated = repeated?(mapping.old_text, previous.quote) or repeated?(mapping.new_text, current.quote)
    prefix_matches = String.ends_with?(current.prefix, previous.prefix) and (previous.prefix != "" or current.prefix == "")
    suffix_matches = String.starts_with?(current.suffix, previous.suffix) and (previous.suffix != "" or current.suffix == "")

    if repeated do
      (previous.prefix != "" and prefix_matches) or (previous.suffix != "" and suffix_matches)
    else
      previous.quote == current.quote or prefix_matches or suffix_matches or surviving_edges?(mapping, {from, to})
    end
  end

  defp surviving_edges?(mapping, {from, to}) do
    selected = Enum.filter(mapping.old.tokens, &(&1.kind == :text and &1.from >= from and &1.to <= to))
    selected != [] and Map.has_key?(mapping.forward, hd(selected).from) and Map.has_key?(mapping.forward, List.last(selected).from)
  end

  defp repeated?(text, selected_text), do: length(:binary.matches(text, selected_text)) > 1

  defp document_text(indexed) do
    case Selection.extract(indexed, {0, indexed.size}) do
      {:ok, %{quote: text}} -> text
      _ -> ""
    end
  end

  # Compare token values without positions, then walk both token lists along the diff.
  # Equal runs map each old position to its matching new token; deletions advance
  # only the old list, and insertions advance only the new list.
  defp correspondences(old, new) do
    diff = List.myers_difference(Enum.map(old, & &1.value), Enum.map(new, & &1.value))

    {matches, _, _} =
      Enum.reduce(diff, {%{}, old, new}, fn {operation, values}, {matches, remaining_old, remaining_new} ->
        count = length(values)

        case operation do
          :eq ->
            {old_run, rest_old} = Enum.split(remaining_old, count)
            {new_run, rest_new} = Enum.split(remaining_new, count)
            matches = Enum.reduce(Enum.zip(old_run, new_run), matches, fn {a, b}, acc -> Map.put(acc, a.from, b) end)
            {matches, rest_old, rest_new}

          :del ->
            {matches, Enum.drop(remaining_old, count), remaining_new}

          :ins ->
            {matches, remaining_old, Enum.drop(remaining_new, count)}
        end
      end)

    matches
  end
end
