defmodule Operately.ApiDocs.Markdown do
  alias Operately.ApiDocs.CurlExample
  alias Operately.ApiDocs.TypeFormatter

  @moduledoc false

  def api_index(catalog) do
    root_endpoint_rows =
      catalog.endpoints_by_namespace
      |> Map.get("root", [])
      |> Enum.map(fn endpoint ->
        """
        <tr>
          <td><a href="./#{endpoint.name}">#{endpoint.name}</a></td>
          <td><code>#{endpoint.method}</code></td>
          <td><code>#{endpoint.type}</code></td>
          <td><code>#{endpoint.path}</code></td>
        </tr>
        """
      end)
      |> Enum.join("\n")

    namespace_rows =
      catalog.namespaces
      |> Enum.reject(&(&1 == "root"))
      |> Enum.map(fn namespace ->
        endpoints = catalog.endpoints_by_namespace[namespace] || []
        query_count = Enum.count(endpoints, &(&1.type == :query))
        mutation_count = Enum.count(endpoints, &(&1.type == :mutation))

        "| [#{namespace_title(namespace)}](./#{namespace}) | #{query_count} | #{mutation_count} | #{length(endpoints)} |"
      end)
      |> Enum.join("\n")

    root_endpoints_section =
      if root_endpoint_rows == "" do
        "There are currently no additional endpoints."
      else
        """
        <div style={{ overflowX: "auto" }}>
          <table style={{ minWidth: "52rem", whiteSpace: "nowrap" }}>
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Method</th>
                <th>Type</th>
                <th>Path</th>
              </tr>
            </thead>
            <tbody>
              #{root_endpoint_rows}
            </tbody>
          </table>
        </div>
        """
      end

    namespace_section =
      if namespace_rows == "" do
        "There are currently no namespaced endpoints."
      else
        """
        | Namespace | Queries | Mutations | Total |
        | --- | ---: | ---: | ---: |
        #{namespace_rows}
        """
      end

    """
    ---
    title: API docs
    description: Generated reference for Operately API endpoints.
    ---

    Operately API provides HTTP endpoints for querying and mutating Operately resources.

    - Every endpoint is authenticated with an API token.
    - Use the header `Authorization: Bearer <token>`.
    - Queries are read operations (`GET`).
    - Mutations are write operations (`POST`).
    - Read-only tokens cannot execute mutations and return `403`.

    ## Endpoint Namespaces

    #{namespace_section}

    ## Other Endpoints

    These endpoints do not belong to a namespace and are available directly under `/help/api/*`.

    #{root_endpoints_section}
    """
  end

  def namespace_index(namespace, endpoints) do
    endpoint_rows =
      endpoints
      |> Enum.map(fn endpoint ->
        """
        <tr>
          <td><a href="./#{endpoint.name}">#{endpoint.name}</a></td>
          <td><code>#{endpoint.method}</code></td>
          <td><code>#{endpoint.type}</code></td>
          <td><code>#{endpoint.path}</code></td>
        </tr>
        """
      end)
      |> Enum.join("\n")

    endpoints_section =
      if endpoint_rows == "" do
        "There are currently no endpoints in this namespace."
      else
        """
        <div style={{ overflowX: "auto" }}>
          <table style={{ minWidth: "52rem", whiteSpace: "nowrap" }}>
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Method</th>
                <th>Type</th>
                <th>Path</th>
              </tr>
            </thead>
            <tbody>
              #{endpoint_rows}
            </tbody>
          </table>
        </div>
        """
      end

    """
    ---
    title: API #{namespace_title(namespace)}
    description: Generated endpoint reference for the #{namespace_title(namespace)} namespace.
    ---

    #{endpoints_section}
    """
  end

  def endpoint_page(endpoint, types) do
    curl_command =
      endpoint
      |> CurlExample.command(types)
      |> Jason.encode!()

    """
    ---
    title: "#{endpoint.full_name}"
    description: "Generated reference for the #{endpoint.type} endpoint #{endpoint.full_name}."
    ---

    import CurlExampleBlock from "@components/CurlExampleBlock.jsx"

    ## Endpoint

    | Property | Value |
    | --- | --- |
    | Type | `#{endpoint.type}` |
    | Method | `#{endpoint.method}` |
    | Path | `#{endpoint.path}` |
    | Handler | `#{endpoint.handler}` |

    ## Authentication

    #{endpoint_auth_notes(endpoint.type)}

    ## cURL Example

    <CurlExampleBlock client:load command={#{curl_command}} />

    ## Inputs

    #{inputs_table(endpoint.inputs, types)}

    ## Outputs

    #{outputs_table(endpoint.outputs, types)}
    """
  end

  defp inputs_table([], _types), do: "This endpoint has no input fields."

  defp inputs_table(fields, types) do
    rows =
      fields
      |> Enum.map(fn {name, type, opts} ->
        default =
          if Keyword.has_key?(opts, :default) do
            "<code>#{TypeFormatter.escape_html(inspect(Keyword.get(opts, :default)))}</code>"
          else
            "-"
          end

        required = yes_no(not Keyword.get(opts, :optional, true))
        nullable = yes_no(Keyword.get(opts, :null, false))

        """
        <tr>
          <td style={{ whiteSpace: "nowrap" }}><code>#{TypeFormatter.escape_html(name)}</code></td>
          <td style={{ whiteSpace: "normal" }}>#{TypeFormatter.format_html(type, types)}</td>
          <td style={{ whiteSpace: "nowrap" }}>#{required}</td>
          <td style={{ whiteSpace: "nowrap" }}>#{nullable}</td>
          <td style={{ whiteSpace: "nowrap" }}>#{default}</td>
        </tr>
        """
      end)
      |> Enum.join("\n")

    """
    <div style={{ overflowX: "auto" }}>
      <table style={{ minWidth: "56rem" }}>
        <thead>
          <tr>
            <th style={{ whiteSpace: "nowrap" }}>Field</th>
            <th style={{ whiteSpace: "normal" }}>Type</th>
            <th style={{ whiteSpace: "nowrap" }}>Required</th>
            <th style={{ whiteSpace: "nowrap" }}>Nullable</th>
            <th style={{ whiteSpace: "nowrap" }}>Default</th>
          </tr>
        </thead>
        <tbody>
          #{rows}
        </tbody>
      </table>
    </div>
    """
  end

  defp outputs_table([], _types), do: "This endpoint has no output fields."

  defp outputs_table(fields, types) do
    rows =
      fields
      |> Enum.map(fn {name, type, opts} ->
        required = yes_no(not Keyword.get(opts, :optional, true))
        nullable = yes_no(Keyword.get(opts, :null, false))

        "| `#{name}` | #{TypeFormatter.format(type, types)} | #{required} | #{nullable} |"
      end)
      |> Enum.join("\n")

    """
    | Field | Type | Required | Nullable |
    | --- | --- | --- | --- |
    #{rows}
    """
  end

  defp endpoint_auth_notes(:query) do
    """
    - Requires a valid API token.
    - Read-only and full-access tokens can execute this query.
    """
  end

  defp endpoint_auth_notes(:mutation) do
    """
    - Requires a valid API token.
    - Requires a write-enabled token.
    - Read-only tokens return `403`.
    """
  end

  defp namespace_title("root"), do: "Root"
  defp namespace_title(namespace), do: namespace |> String.replace("_", " ") |> String.capitalize()

  defp yes_no(true), do: "Yes"
  defp yes_no(false), do: "No"
end
