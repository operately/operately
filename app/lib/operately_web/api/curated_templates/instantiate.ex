defmodule OperatelyWeb.Api.CuratedTemplates.Instantiate do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups.{Group, Permissions}
  alias Operately.Operations.CuratedTemplateInstantiation

  inputs do
    field :template_id, :id, null: false
    field :space_id, :id, null: false
    field? :champion_id, :id, null: true
    field? :reviewer_id, :id, null: true
    field? :start_date, :date, null: true
  end

  outputs do
    field :resource_type, :curated_template_type, null: false
    field :resource_id, :id, null: false
    field :space_id, :id, null: false
  end

  def call(conn, inputs) do
    with {:ok, person} <- find_me(conn),
         {:ok, space} <- Group.get(person, id: inputs.space_id, company_id: person.company_id),
         {:ok, _} <- Permissions.check(space.request_info.access_level, :can_edit, company_read_only: company_read_only(conn)),
         {:ok, _} <- validate_people(person, space, [inputs[:champion_id], inputs[:reviewer_id]]),
         {:ok, result} <- CuratedTemplateInstantiation.run(person, Group.preload_access_levels(space), inputs) do
      {:ok, Serializer.serialize(result)}
    else
      {:error, reason} when reason in [:not_found, :forbidden, :bad_request] -> {:error, reason}
      {:error, _} -> {:error, :internal_server_error}
    end
  end

  defp validate_people(person, space, ids) do
    Enum.reduce_while(Enum.reject(ids, &is_nil/1), {:ok, :valid}, fn id, _ ->
      with {:ok, selected} <- Operately.People.Person.get(person, id: id),
           true <- selected.company_id == person.company_id and not selected.suspended,
           {:ok, _} <- Group.get(selected, id: space.id) do
        {:cont, {:ok, :valid}}
      else
        _ -> {:halt, {:error, :bad_request}}
      end
    end)
  end
end
