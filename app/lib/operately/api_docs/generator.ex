defmodule Operately.ApiDocs.Generator do
  alias Operately.ApiDocs.Markdown

  @moduledoc false

  @default_api_module OperatelyWeb.Api.External
  @default_api_base_path "/api/external/v1"
  @default_out_dir "../tmp/generated/api-docs"

  def generate(opts \\ []) do
    out_dir = opts |> Keyword.get(:out_dir, @default_out_dir) |> Path.expand()
    api_module = Keyword.get(opts, :api_module, @default_api_module)
    api_base_path = Keyword.get(opts, :api_base_path, @default_api_base_path)

    catalog = build_catalog(api_module, api_base_path)
    write_docs(out_dir, catalog)

    %{
      out_dir: out_dir,
      api_docs_dir: Path.join(out_dir, "help/api"),
      endpoint_count: length(catalog.endpoints),
      query_count: length(catalog.queries),
      mutation_count: length(catalog.mutations)
    }
  end

  def build_catalog(api_module, api_base_path \\ @default_api_base_path) do
    queries =
      api_module.__queries__()
      |> Enum.map(fn {full_name, spec} -> build_endpoint(spec, full_name, :query, api_base_path) end)
      |> Enum.sort_by(& &1.full_name)

    mutations =
      api_module.__mutations__()
      |> Enum.map(fn {full_name, spec} -> build_endpoint(spec, full_name, :mutation, api_base_path) end)
      |> Enum.sort_by(& &1.full_name)

    endpoints = Enum.sort_by(queries ++ mutations, &{&1.namespace_segment, &1.name, &1.type})

    endpoints_by_namespace =
      endpoints
      |> Enum.group_by(& &1.namespace_segment)
      |> Enum.map(fn {namespace, namespace_endpoints} ->
        {namespace, Enum.sort_by(namespace_endpoints, &{&1.name, &1.type})}
      end)
      |> Enum.into(%{})

    namespaces =
      endpoints_by_namespace
      |> Map.keys()
      |> Enum.sort_by(fn namespace ->
        {if(namespace == "root", do: 0, else: 1), namespace}
      end)

    %{
      types: api_module.__types__(),
      queries: queries,
      mutations: mutations,
      endpoints: endpoints,
      endpoints_by_namespace: endpoints_by_namespace,
      namespaces: namespaces
    }
  end

  defp build_endpoint(spec, full_name, type, api_base_path) do
    namespace_segment = if spec.namespace == nil, do: "root", else: Atom.to_string(spec.namespace)
    endpoint_name = spec.name |> to_string()
    method = if type == :query, do: "GET", else: "POST"
    path = "#{api_base_path}/#{full_name}"

    %{
      full_name: full_name,
      namespace: spec.namespace,
      namespace_segment: namespace_segment,
      name: endpoint_name,
      type: type,
      method: method,
      path: path,
      handler: inspect(spec.handler),
      inputs: spec.inputs.fields,
      outputs: spec.outputs.fields
    }
  end

  defp write_docs(out_dir, catalog) do
    docs_dir = Path.join(out_dir, "help/api")
    File.rm_rf!(docs_dir)
    File.mkdir_p!(docs_dir)

    write_file!(Path.join(docs_dir, "index.mdx"), Markdown.api_index(catalog))

    root_endpoints = Map.get(catalog.endpoints_by_namespace, "root", [])

    Enum.each(root_endpoints, fn endpoint ->
      endpoint_file = Path.join(docs_dir, "#{endpoint.name}.mdx")
      write_file!(endpoint_file, Markdown.endpoint_page(endpoint, catalog.types))
    end)

    catalog.namespaces
    |> Enum.reject(&(&1 == "root"))
    |> Enum.each(fn namespace ->
      namespace_dir = Path.join(docs_dir, namespace)
      File.mkdir_p!(namespace_dir)

      namespace_endpoints = Map.get(catalog.endpoints_by_namespace, namespace, [])
      write_file!(Path.join(namespace_dir, "index.mdx"), Markdown.namespace_index(namespace, namespace_endpoints))

      Enum.each(namespace_endpoints, fn endpoint ->
        endpoint_file = Path.join(namespace_dir, "#{endpoint.name}.mdx")
        write_file!(endpoint_file, Markdown.endpoint_page(endpoint, catalog.types))
      end)
    end)
  end

  defp write_file!(path, content) do
    File.mkdir_p!(Path.dirname(path))
    File.write!(path, content)
  end
end
