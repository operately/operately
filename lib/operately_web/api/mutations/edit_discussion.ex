defmodule OperatelyWeb.Api.Mutations.EditDiscussion do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters

  inputs do
    field :discussion_id, :string
    field :title, :string
    field :body, :string
  end

  outputs do
    field :discussion, :discussion
  end

  def call(conn, inputs) do
    {:ok, id} = decode_id(inputs.discussion_id)
    person = me(conn)
    discussion = %{updatable_id: space_id} = Operately.Updates.get_update!(id)

    case load_space(person, space_id, is_company_space?(conn, space_id)) do
      nil ->
        query(space_id)
        |> return_error(person, is_company_space?(conn, space_id))

      space ->
        {:ok, discussion} = Operately.Operations.DiscussionEditing.run(person, discussion, space, inputs)
        {:ok, %{discussion: Serializer.serialize(discussion, level: :essential)}}
    end
  end

  defp load_space(person, space_id, false) do
    query(space_id)
    |> filter_by_edit_access(person.id)
    |> Repo.one()
  end

  defp load_space(person, space_id, true) do
    query(space_id)
    |> filter_by_edit_access(person.id, join_parent: :company)
    |> Repo.one()
  end

  defp return_error(q, person, false), do: forbidden_or_not_found(q, person.id)
  defp return_error(q, person, true), do: forbidden_or_not_found(q, person.id, join_parent: :company)

  defp query(space_id) do
    from(s in Operately.Groups.Group, where: s.id == ^space_id)
  end

  defp is_company_space?(conn, space_id) do
    company(conn).company_space_id == space_id
  end
end
