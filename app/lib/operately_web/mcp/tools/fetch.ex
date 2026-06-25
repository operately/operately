defmodule OperatelyWeb.Mcp.Tools.Fetch do
  use OperatelyWeb.Mcp.Tool

  alias OperatelyWeb.Api.Goals.Get, as: GoalGet
  alias OperatelyWeb.Api.Helpers
  alias OperatelyWeb.Api.Projects.Get, as: ProjectGet
  alias OperatelyWeb.Api.Projects.GetMilestone
  alias OperatelyWeb.Api.Spaces.Get, as: SpaceGet
  alias OperatelyWeb.Endpoint
  alias OperatelyWeb.Paths

  @accepted_url_patterns [
    "/:company_id/projects/:project_id",
    "/:company_id/goals/:goal_id",
    "/:company_id/milestones/:milestone_id",
    "/:company_id/spaces/:space_id"
  ]

  @examples [
    %{"title" => "Fetch a project page URL", "arguments" => %{"url" => "https://app.operately.com/acme/projects/project_123"}},
    %{"title" => "Fetch a goal page URL", "arguments" => %{"url" => "https://app.operately.com/acme/goals/goal_123"}},
    %{"title" => "Fetch a milestone page URL", "arguments" => %{"url" => "https://app.operately.com/acme/milestones/milestone_123"}},
    %{"title" => "Fetch a space page URL", "arguments" => %{"url" => "https://app.operately.com/acme/spaces/space_123"}}
  ]

  @impl true
  def definition do
    Definition.new!(
      name: "fetch",
      title: "Fetch Operately Resource",
      description:
        "Fetches a canonical Operately resource from its URL for citation-friendly reading. The URL must use the current Operately app origin and one of these paths: " <>
          Enum.join(@accepted_url_patterns, ", "),
      company_mode: :resource_derived,
      required_scopes: ["mcp:read"],
      safety_classification: :read_only,
      sort_order: 100,
      annotations: read_annotations(),
      security_schemes: read_security_schemes(),
      discovery_metadata: %{
        "category" => "fetch",
        "acceptedUrlPatterns" => @accepted_url_patterns
      },
      examples: @examples,
      input_schema:
        JsonSchema.object(
          %{
            "url" =>
              JsonSchema.string(
                "Canonical Operately URL on the current app origin. Accepted paths: " <> Enum.join(@accepted_url_patterns, ", "),
                format: "uri"
              )
          },
          required: ["url"]
        ),
      output_schema:
        JsonSchema.object(
          %{
            "url" => JsonSchema.string("The canonical Operately URL.", format: "uri"),
            "resource" => JsonSchema.any_object("Structured resource data when available."),
            "content" => JsonSchema.array(JsonSchema.any_object(), description: "Citation-friendly content blocks.")
          },
          required: ["url", "resource", "content"]
        )
    )
  end

  @impl true
  def call(conn, %{"url" => url}) do
    with {:ok, uri} <- parse_uri(url),
         :ok <- validate_origin(uri),
         {:ok, route} <- parse_route(uri),
         {:ok, payload} <- fetch_route(conn, route) do
      {:ok, payload}
    end
  end

  defp fetch_route(conn, {:project, project_id}) do
    with {:ok, %{project: project, markdown: markdown}} <- ProjectGet.call(conn, %{id: project_id, include_markdown: true}) do
      {:ok,
       %{
         url: canonical_url(conn, :project, project.id),
         resource: %{type: "project", data: project},
         content: [text_content(markdown)]
       }}
    end
  end

  defp fetch_route(conn, {:goal, goal_id}) do
    with {:ok, %{goal: goal, markdown: markdown}} <- GoalGet.call(conn, %{id: goal_id, include_markdown: true}) do
      {:ok,
       %{
         url: canonical_url(conn, :goal, goal.id),
         resource: %{type: "goal", data: goal},
         content: [text_content(markdown)]
       }}
    end
  end

  defp fetch_route(conn, {:milestone, milestone_id}) do
    with {:ok, %{milestone: milestone, markdown: markdown}} <- GetMilestone.call(conn, %{id: milestone_id, include_markdown: true}) do
      {:ok,
       %{
         url: canonical_url(conn, :milestone, milestone.id),
         resource: %{type: "milestone", data: milestone},
         content: [text_content(markdown)]
       }}
    end
  end

  defp fetch_route(conn, {:space, space_id}) do
    with {:ok, %{space: space, markdown: markdown}} <- SpaceGet.call(conn, %{id: space_id, include_markdown: true}) do
      {:ok,
       %{
         url: canonical_url(conn, :space, space.id),
         resource: %{type: "space", data: space},
         content: [text_content(markdown)]
      }}
    end
  end

  defp parse_uri(url) do
    case URI.parse(url) do
      %URI{scheme: scheme, host: host, path: path} = uri when is_binary(scheme) and is_binary(host) and is_binary(path) ->
        {:ok, uri}

      _ ->
        {:error, :invalid_arguments}
    end
  end

  defp validate_origin(uri) do
    canonical_uri = URI.parse(Endpoint.url())

    if same_origin?(uri, canonical_uri) do
      :ok
    else
      {:error, :invalid_arguments}
    end
  end

  defp parse_route(uri) do
    case path_segments(uri.path) do
      [_company_id, "projects", project_id] ->
        decode_route({:project, project_id})

      [_company_id, "goals", goal_id] ->
        decode_route({:goal, goal_id})

      [_company_id, "milestones", milestone_id] ->
        decode_route({:milestone, milestone_id})

      [_company_id, "spaces", space_id] ->
        decode_route({:space, space_id})

      _ ->
        {:error, :invalid_arguments}
    end
  end

  defp decode_route({type, id}) do
    with {:ok, decoded_id} <- decode_id(id) do
      {:ok, {type, decoded_id}}
    end
  end

  defp decode_id(id) do
    case Helpers.decode_id(id) do
      {:ok, decoded_id} -> {:ok, decoded_id}
      {:error, _reason} -> {:error, :invalid_arguments}
    end
  end

  defp path_segments(path) do
    path
    |> String.split("/", trim: true)
  end

  defp same_origin?(left, right) do
    String.downcase(left.scheme) == String.downcase(right.scheme || "") and
      String.downcase(left.host) == String.downcase(right.host || "") and
      effective_port(left) == effective_port(right)
  end

  defp effective_port(%URI{port: port}) when is_integer(port), do: port
  defp effective_port(%URI{scheme: "http"}), do: 80
  defp effective_port(%URI{scheme: "https"}), do: 443
  defp effective_port(_), do: nil

  defp canonical_url(conn, type, resource_id) do
    company_id = Paths.company_id(conn.assigns.current_company)

    path =
      case type do
        :project -> "/" <> company_id <> "/projects/" <> resource_id
        :goal -> "/" <> company_id <> "/goals/" <> resource_id
        :milestone -> "/" <> company_id <> "/milestones/" <> resource_id
        :space -> "/" <> company_id <> "/spaces/" <> resource_id
      end

    Paths.to_url(path)
  end

  defp text_content(text) do
    %{
      type: "text",
      text: text
    }
  end
end
