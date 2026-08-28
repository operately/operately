defmodule Operately.ProductReleases.Parser do
  @moduledoc false

  import SweetXml

  alias Operately.ProductReleases.Release

  def parse(xml) when is_binary(xml) do
    try do
      items =
        xml
        |> SweetXml.parse(quiet: true)
        |> xpath(~x"//rss/channel/item"l,
          id: ~x"./guid/text()"s,
          version: ~x"./*[local-name()='version']/text()"s,
          title: ~x"./title/text()"s,
          published_at: ~x"./pubDate/text()"s,
          teaser: ~x"./description/text()"s
        )
        |> Enum.map(&normalize_item/1)
        |> Enum.reject(&is_nil/1)

      case Enum.max_by(items, & &1.published_at, DateTime, fn -> nil end) do
        nil -> {:ok, nil}
        item -> {:ok, struct(Release, item)}
      end
    rescue
      _ -> {:error, :invalid_feed}
    catch
      :exit, _reason -> {:error, :invalid_feed}
    end
  end

  def parse(_), do: {:error, :invalid_feed}

  defp normalize_item(item) do
    id = blank_to_nil(item[:id])
    title = item[:title] |> to_plain_text() |> blank_to_nil()
    published_at = parse_pub_date(item[:published_at])

    if id && title && published_at do
      %{
        id: id,
        version: blank_to_nil(item[:version]),
        title: title,
        published_at: published_at,
        teaser: teaser(item[:teaser], title)
      }
    end
  end

  defp teaser(raw, title) do
    case raw |> to_plain_text() |> blank_to_nil() do
      ^title -> nil
      text -> text
    end
  end

  defp to_plain_text(nil), do: ""

  defp to_plain_text(value) when is_binary(value) do
    value
    |> String.replace(~r/<[^>]+>/, " ")
    |> unescape_entities()
    |> String.replace(~r/\s+/, " ")
    |> String.trim()
  end

  defp unescape_entities(text) do
    text
    |> String.replace("&amp;", "&")
    |> String.replace("&lt;", "<")
    |> String.replace("&gt;", ">")
    |> String.replace("&quot;", "\"")
    |> String.replace("&#39;", "'")
    |> String.replace("&apos;", "'")
    |> String.replace("&nbsp;", " ")
  end

  defp parse_pub_date(value) when is_binary(value) do
    normalized =
      value
      |> String.trim()
      |> String.replace(~r/\s+[+-]\d{4}$/, " GMT")

    case :httpd_util.convert_request_date(String.to_charlist(normalized)) do
      {{year, month, day}, {hour, minute, second}} ->
        NaiveDateTime.new!(year, month, day, hour, minute, second)
        |> DateTime.from_naive!("Etc/UTC")

      :bad_date ->
        nil
    end
  end

  defp parse_pub_date(_), do: nil

  defp blank_to_nil(nil), do: nil

  defp blank_to_nil(value) when is_binary(value) do
    case String.trim(value) do
      "" -> nil
      trimmed -> trimmed
    end
  end
end
