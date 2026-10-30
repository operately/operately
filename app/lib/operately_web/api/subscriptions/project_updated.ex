defmodule OperatelyWeb.Api.Subscriptions.ProjectUpdated do
  use TurboConnect.Subscription

  alias Operately.Projects.Project
  alias OperatelyWeb.Api.Helpers

  def join(_name, %{"projectId" => id}, %{assigns: %{person: person, company: company}} = socket) when is_binary(id) do
    with true <- person.company_id == company.id,
         {:ok, id} <- Helpers.decode_id(id),
         {:ok, project} <- Project.get(person, id: id, company_id: company.id) do
      {:ok, socket, [project.id]}
    else
      _ -> {:error, %{reason: "unauthorized"}}
    end
  end

  def join(_, _, _), do: {:error, %{reason: "unauthorized"}}

  def broadcast(project_ids) do
    project_ids
    |> List.wrap()
    |> Enum.reject(&is_nil/1)
    |> Enum.uniq()
    |> Enum.each(&OperatelyWeb.ApiSocket.broadcast!("api:project_updated:#{&1}"))
  end

  # Call only after the owning transaction has committed, never from a Multi step.
  def broadcast_result({:ok, changes} = result, project_ids) do
    # Nested writers (for example rich-text checklist updates) leave publication
    # to the outer operation so a later rollback cannot leak an event.
    unless Operately.Repo.in_transaction?() do
      ids = if is_function(project_ids, 1), do: project_ids.(changes), else: project_ids
      broadcast(ids)
    end

    result
  end

  def broadcast_result(result, _project_ids), do: result
end
