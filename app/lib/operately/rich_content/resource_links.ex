defmodule Operately.RichContent.ResourceLinks do
  @moduledoc """
  Parses Operately resource URLs on the current instance into company, type, and ID.
  """

  @path_types %{
    "tasks" => :task,
    "projects" => :project,
    "goals" => :goal,
    "milestones" => :milestone,
    "discussions" => :discussion,
    "documents" => :document,
    "links" => :link,
    "files" => :file,
    "folders" => :folder,
    "people" => :person,
    "spaces" => :space
  }

  def types, do: Map.values(@path_types)

  def parse(url, origin) when is_binary(url) and is_binary(origin) do
    with {:ok, uri} <- parse_uri(url),
         :ok <- validate_origin(uri, origin),
         {:ok, ref} <- parse_route(uri) do
      {:ok, ref}
    else
      _ -> :error
    end
  end

  def parse(_, _), do: :error

  defp parse_uri(url) do
    case URI.parse(url) do
      %URI{path: path} = uri when is_binary(path) and path != "" -> {:ok, uri}
      _ -> :error
    end
  end

  defp validate_origin(%URI{host: host} = uri, origin) when is_binary(host) do
    canonical = URI.parse(origin)

    if origin_key(uri) == origin_key(canonical) do
      :ok
    else
      :error
    end
  end

  defp validate_origin(%URI{host: nil, path: path}, _origin) when is_binary(path) do
    if String.starts_with?(path, "/") do
      :ok
    else
      :error
    end
  end

  defp origin_key(%URI{scheme: scheme, host: host, port: port}) do
    {scheme, host, port || default_port(scheme)}
  end

  defp default_port("https"), do: 443
  defp default_port("http"), do: 80
  defp default_port(_), do: nil

  defp parse_route(uri) do
    case path_segments(uri.path) do
      [company_id, "spaces", _space_id, "kanban"] ->
        case task_id_from_query(uri.query) do
          {:ok, task_id} -> {:ok, ref(company_id, :task, task_id)}
          :error -> :error
        end

      [company_id, type, resource_id] ->
        case Map.fetch(@path_types, type) do
          {:ok, resource_type} -> {:ok, ref(company_id, resource_type, resource_id)}
          :error -> :error
        end

      _ ->
        :error
    end
  end

  defp ref(company_id, type, id) do
    %{company_id: company_id, type: type, id: strip_fragment(id)}
  end

  defp path_segments(path) do
    path
    |> String.split("/", trim: true)
    |> Enum.map(&strip_fragment/1)
  end

  defp strip_fragment(value) do
    value
    |> String.split("#", parts: 2)
    |> hd()
  end

  defp task_id_from_query(query) when is_binary(query) do
    case URI.decode_query(query) do
      %{"taskId" => task_id} when is_binary(task_id) and task_id != "" -> {:ok, strip_fragment(task_id)}
      _ -> :error
    end
  end

  defp task_id_from_query(_), do: :error
end
