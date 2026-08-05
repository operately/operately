defmodule Operately.Search.CompanyQuery.Filters do
  @moduledoc """
  Optional company full-text search filters and sort selection.
  """

  import Ecto.Query

  alias Operately.Search.FullTextQuery

  @time_ranges [:last_7_days, :last_30_days, :last_90_days, :last_12_months]
  @sorts [:best_match, :most_recent]

  def time_ranges, do: @time_ranges
  def sorts, do: @sorts

  def normalize(filters) when is_map(filters) do
    %{
      space_ids: present_list(Map.get(filters, :space_ids) || Map.get(filters, "space_ids")),
      types: present_types(Map.get(filters, :types) || Map.get(filters, "types")),
      time_range: present_time_range(Map.get(filters, :time_range) || Map.get(filters, "time_range")),
      sort: present_sort(Map.get(filters, :sort) || Map.get(filters, "sort"))
    }
  end

  def normalize(_), do: %{space_ids: nil, types: nil, time_range: nil, sort: :best_match}

  def apply(query, filters) do
    filters = normalize(filters)

    query
    |> filter_spaces(filters.space_ids)
    |> filter_types(filters.types)
    |> filter_time(filters.time_range)
  end

  def order_by(filters, full_text) do
    case normalize(filters).sort do
      :most_recent ->
        [
          desc: dynamic([entry: entry], entry.source_inserted_at),
          asc: dynamic([entry: entry], entry.source_id)
        ]

      _ ->
        FullTextQuery.ranking_order(full_text)
    end
  end

  defp filter_spaces(query, nil), do: query

  defp filter_spaces(query, space_ids) do
    from([entry: entry] in query, where: entry.space_id in ^space_ids)
  end

  defp filter_types(query, nil), do: query

  defp filter_types(query, types) do
    from([entry: entry] in query, where: entry.source_type in ^types)
  end

  defp filter_time(query, nil), do: query

  defp filter_time(query, time_range) do
    cutoff = cutoff_for(time_range)
    from([entry: entry] in query, where: entry.source_inserted_at >= ^cutoff)
  end

  defp cutoff_for(:last_7_days), do: shift_naive(day: -7)
  defp cutoff_for(:last_30_days), do: shift_naive(day: -30)
  defp cutoff_for(:last_90_days), do: shift_naive(day: -90)
  defp cutoff_for(:last_12_months), do: shift_naive(month: -12)

  defp shift_naive(shift) do
    DateTime.utc_now()
    |> DateTime.shift(shift)
    |> DateTime.to_naive()
    |> NaiveDateTime.truncate(:microsecond)
  end

  defp present_list(nil), do: nil
  defp present_list([]), do: nil
  defp present_list(list) when is_list(list), do: list
  defp present_list(_), do: nil

  defp present_types(nil), do: nil
  defp present_types([]), do: nil

  defp present_types(types) when is_list(types) do
    types
    |> Enum.map(&normalize_type/1)
    |> Enum.reject(&is_nil/1)
    |> case do
      [] -> nil
      normalized -> normalized
    end
  end

  defp present_types(_), do: nil

  defp normalize_type(type) when is_atom(type), do: type

  defp normalize_type(type) when is_binary(type) do
    try do
      String.to_existing_atom(type)
    rescue
      ArgumentError -> nil
    end
  end

  defp normalize_type(_), do: nil

  defp present_time_range(nil), do: nil
  defp present_time_range(range) when range in @time_ranges, do: range

  defp present_time_range(range) when is_binary(range) do
    try do
      atom = String.to_existing_atom(range)
      if atom in @time_ranges, do: atom, else: nil
    rescue
      ArgumentError -> nil
    end
  end

  defp present_time_range(_), do: nil

  defp present_sort(nil), do: :best_match
  defp present_sort(sort) when sort in @sorts, do: sort

  defp present_sort(sort) when is_binary(sort) do
    try do
      atom = String.to_existing_atom(sort)
      if atom in @sorts, do: atom, else: :best_match
    rescue
      ArgumentError -> :best_match
    end
  end

  defp present_sort(_), do: :best_match
end
