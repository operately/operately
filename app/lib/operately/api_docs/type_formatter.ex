defmodule Operately.ApiDocs.TypeFormatter do
  @builtin_types [:string, :integer, :float, :boolean, :date, :time, :datetime]

  def format({:list, inner}, types) do
    "array of #{format(inner, types)}"
  end

  def format(type, types) when is_atom(type) do
    cond do
      type in @builtin_types ->
        md_code(type)

      Map.has_key?(types.enums, type) ->
        values = types.enums[type] |> Enum.map(&md_code/1) |> Enum.join(", ")
        "#{md_code(type)} enum (#{values})"

      Map.has_key?(types.primitives, type) ->
        encoded = types.primitives[type] |> Keyword.get(:encoded_type)

        if encoded do
          "#{md_code(type)} primitive (encoded as #{md_code(encoded)})"
        else
          "#{md_code(type)} primitive"
        end

      Map.has_key?(types.unions, type) ->
        "#{md_code(type)} union"

      Map.has_key?(types.objects, type) ->
        "#{md_code(type)} object"

      true ->
        md_code(type)
    end
  end

  def format(type, _types) when is_binary(type), do: md_code(type)
  def format(type, _types), do: md_code(inspect(type))

  def format_html({:list, inner}, types) do
    "array of #{format_html(inner, types)}"
  end

  def format_html(type, types) when is_atom(type) do
    cond do
      type in @builtin_types ->
        html_code(type)

      Map.has_key?(types.enums, type) ->
        values = types.enums[type] |> Enum.map(&html_code/1) |> Enum.join(", ")
        "#{html_code(type)} enum (#{values})"

      Map.has_key?(types.primitives, type) ->
        encoded = types.primitives[type] |> Keyword.get(:encoded_type)

        if encoded do
          "#{html_code(type)} primitive (encoded as #{html_code(encoded)})"
        else
          "#{html_code(type)} primitive"
        end

      Map.has_key?(types.unions, type) ->
        "#{html_code(type)} union"

      Map.has_key?(types.objects, type) ->
        "#{html_code(type)} object"

      true ->
        html_code(type)
    end
  end

  def format_html(type, _types) when is_binary(type), do: html_code(type)
  def format_html(type, _types), do: html_code(inspect(type))

  defp md_code(value), do: "`#{value}`"
  defp html_code(value), do: "<code>#{escape_html(value)}</code>"

  defp escape_html(value) do
    value
    |> to_string()
    |> String.replace("&", "&amp;")
    |> String.replace("<", "&lt;")
    |> String.replace(">", "&gt;")
    |> String.replace("\"", "&quot;")
    |> String.replace("'", "&#39;")
  end
end
