defmodule Operately.JUnitReportMerger do
  @moduledoc false

  @type suite_acc :: %{
          name: String.t(),
          properties: [tuple()],
          testcases: %{{String.t(), String.t()} => tuple()}
        }

  @spec merge!([Path.t()], Path.t()) :: :ok
  def merge!(paths, output_path) do
    paths = Enum.filter(paths, &File.exists?/1)

    if paths != [] do
      content = merge(paths)
      File.mkdir_p!(Path.dirname(output_path))
      File.write!(output_path, content)
    end

    :ok
  end

  @spec merge([Path.t()]) :: iodata()
  def merge(paths) do
    paths
    |> Enum.reduce(%{}, &merge_path/2)
    |> Map.values()
    |> Enum.sort_by(& &1.name)
    |> build_document()
  end

  defp merge_path(path, suites) do
    path
    |> parse_document()
    |> element_content()
    |> Enum.reduce(suites, &merge_testsuite/2)
  end

  defp merge_testsuite(testsuite, suites) do
    name = testsuite |> element_attrs() |> attr_value(:name)

    testcases =
      testsuite
      |> element_content()
      |> Enum.filter(fn node -> element_name(node) == :testcase end)
      |> Enum.reduce(Map.get(suites, name, %{})[:testcases] || %{}, fn testcase, acc ->
        key = testcase_key(testcase)
        Map.put(acc, key, to_export(testcase))
      end)

    properties =
      case Map.get(suites, name) do
        %{properties: existing} -> existing
        nil -> testsuite |> element_content() |> find_properties()
      end

    Map.put(suites, name, %{
      name: name,
      properties: properties,
      testcases: testcases
    })
  end

  defp find_properties(content) do
    case Enum.find(content, fn node -> element_name(node) == :properties end) do
      nil -> []
      properties -> to_export(properties) |> elem(2)
    end
  end

  defp build_document(suites) do
    suites
    |> Enum.map(&build_testsuite/1)
    |> then(&:xmerl.export_simple([{:testsuites, [], &1}], :xmerl_xml))
    |> List.to_string()
  end

  defp build_testsuite(%{name: name, properties: properties, testcases: testcases}) do
    cases = testcases |> Map.values() |> Enum.sort_by(&testcase_sort_key/1)

    stats =
      Enum.reduce(cases, %{tests: 0, failures: 0, errors: 0, skipped: 0, time: 0.0}, fn testcase, acc ->
        status = testcase_status(testcase)
        time = testcase |> elem(1) |> attr_value(:time) |> parse_time()

        acc =
          acc
          |> Map.update!(:tests, &(&1 + 1))
          |> Map.update!(:time, &(&1 + time))

        case status do
          :pass -> acc
          key -> Map.update!(acc, key, &(&1 + 1))
        end
      end)

    attrs = [
      name: to_charlist(name),
      tests: Integer.to_string(stats.tests),
      failures: Integer.to_string(stats.failures),
      errors: Integer.to_string(stats.errors),
      skipped: Integer.to_string(stats.skipped),
      time: format_time(stats.time)
    ]

    {:testsuite, attrs, [{:properties, [], properties} | cases]}
  end

  defp testcase_status({:testcase, _attrs, children}) do
    cond do
      Enum.any?(children, fn {:failure, _, _} -> true; _ -> false end) -> :failures
      Enum.any?(children, fn {:error, _, _} -> true; _ -> false end) -> :errors
      Enum.any?(children, fn {:skipped, _, _} -> true; _ -> false end) -> :skipped
      true -> :pass
    end
  end

  defp testcase_sort_key({:testcase, attrs, _}) do
    {attr_value(attrs, :classname), attr_value(attrs, :name)}
  end

  defp testcase_key(testcase) do
    attrs = element_attrs(testcase)
    {attr_value(attrs, :classname), attr_value(attrs, :name)}
  end

  defp parse_document(path) do
    case :xmerl_scan.file(String.to_charlist(path)) do
      {{:xmlElement, _, _, _, _, _, _, _, _, _, _, _} = doc, _} -> doc
      {other, _} -> raise "Failed to parse JUnit report #{path}: #{inspect(other)}"
    end
  end

  defp parse_time(value) do
    case Float.parse(value) do
      {time, _} -> time
      :error -> 0.0
    end
  end

  defp format_time(time) do
    :io_lib.format("~.4f", [time]) |> List.to_string()
  end

  defp element_name({:xmlElement, name, _, _, _, _, _, _, _, _, _, _}), do: name

  defp element_attrs({:xmlElement, _, _, _, _, _, _, attrs, _, _, _, _}) do
    Enum.map(attrs, fn {:xmlAttribute, name, _, _, _, _, _, _, value, _} ->
      {name, attribute_value(value)}
    end)
  end

  defp element_content({:xmlElement, _, _, _, _, _, _, _, content, _, _, _}) do
    Enum.filter(content, fn
      {:xmlElement, _, _, _, _, _, _, _, _, _, _, _} -> true
      _ -> false
    end)
  end

  defp attribute_value({:xmlText, _, _, _, value, :text}), do: value

  defp attribute_value({:xmlAttribute, _, _, _, _, _, _, _, value, _}),
    do: attribute_value(value)

  defp attribute_value(value) when is_list(value), do: value
  defp attribute_value(value) when is_binary(value), do: String.to_charlist(value)
  defp attribute_value(value), do: value |> xml_value_to_string() |> String.to_charlist()

  defp to_export({:xmlElement, name, _, _, _, _, _, attrs, content, _, _, _}) do
    attrs =
      Enum.map(attrs, fn {:xmlAttribute, key, _, _, _, _, _, _, value, _} ->
        {key, attribute_value(value)}
      end)

    children =
      content
      |> Enum.filter(fn
        {:xmlElement, _, _, _, _, _, _, _, _, _, _, _} -> true
        _ -> false
      end)
      |> Enum.map(&to_export/1)

    {name, attrs, children}
  end

  defp attr_value(attrs, key) do
    case List.keyfind(attrs, key, 0) do
      {^key, value} -> xml_value_to_string(value)
      nil -> ""
    end
  end

  defp xml_value_to_string(value) when is_list(value), do: List.to_string(value)
  defp xml_value_to_string(value) when is_binary(value), do: value
  defp xml_value_to_string(value), do: inspect(value)
end
