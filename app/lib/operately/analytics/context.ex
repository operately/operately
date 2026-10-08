defmodule Operately.Analytics.Context do
  @moduledoc "Validates optional, untrusted browser analytics metadata. Never carries authentication."
  @attribution_limits [{"utm_source", 200}, {"utm_medium", 200}, {"utm_campaign", 200}, {"landing_path", 512}, {"referrer_host", 253}, {"observed_at", 40}, {"source_kind", 8}]

  def normalize(input) when is_map(input) do
    %{
      anonymous_id: uuid(value(input, :anonymous_id)),
      attempt_id: uuid(value(input, :attempt_id)),
      attribution: attribution(value(input, :attribution)),
      preference: preference(value(input, :preference))
    }
  end

  def normalize(_), do: normalize(%{})

  @doc """
  Validates and sanitizes first-touch attribution: the campaign, referrer, landing
  page, and time of a visitor's first observed visit. This data links signups,
  workspace creation, and activation to their acquisition sources.

  Keeps only allowed fields and valid values; returns an empty map for non-map input.
  """
  def attribution(input) when is_map(input) do
    Enum.reduce(@attribution_limits, %{}, fn {key, limit}, acc ->
      case Map.get(input, key) do
        value when is_binary(value) and byte_size(value) <= limit ->
          value = sanitize(key, value)
          if value == nil, do: acc, else: Map.put(acc, key, value)

        _ ->
          acc
      end
    end)
  end

  def attribution(_), do: %{}

  defp sanitize("landing_path", value) do
    if String.starts_with?(value, "/") and not String.starts_with?(value, "//"), do: value |> String.split(["?", "#"]) |> hd(), else: nil
  end

  defp sanitize("referrer_host", value) do
    if Regex.match?(~r/^[a-zA-Z0-9.-]+$/, value), do: value, else: nil
  end

  defp sanitize("observed_at", value) do
    case DateTime.from_iso8601(value) do
      {:ok, _, _} -> value
      _ -> nil
    end
  end

  defp sanitize("source_kind", value) when value in ["campaign", "referral", "direct", "unknown"], do: value
  defp sanitize("source_kind", _), do: nil
  defp sanitize(_, value), do: value

  defp preference("denied"), do: "denied"
  defp preference(_), do: "unspecified"

  defp uuid(value) do
    case Ecto.UUID.cast(value) do
      {:ok, id} -> id
      _ -> nil
    end
  end

  defp value(map, key), do: Map.get(map, key, Map.get(map, Atom.to_string(key)))
end
