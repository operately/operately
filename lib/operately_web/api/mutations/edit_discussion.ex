defmodule OperatelyWeb.Api.Mutations.EditDiscussion do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups
  alias Operately.Groups.Permissions

  inputs do
    field :discussion_id, :string
    field :title, :string
    field :body, :string
  end

  outputs do
    field :discussion, :discussion
  end

  def call(conn, inputs) do
    person = me(conn)
    {:ok, id} = decode_id(inputs.discussion_id)
    discussion = %{updatable_id: space_id} = Operately.Updates.get_update!(id)

    case Groups.get_group_and_access_level(space_id, person.id) do
      {:ok, space, access_level} ->
        if Permissions.can_edit_discussions(access_level) do
          execute(person, discussion, space, inputs)
        else
          {:error, :forbidden}
        end
      {:error, reason} -> {:error, reason}
    end
  end

  defp execute(person, discussion, space, inputs) do
    {:ok, discussion} = Operately.Operations.DiscussionEditing.run(person, discussion, space, inputs)
    {:ok, %{discussion: Serializer.serialize(discussion, level: :essential)}}
  end
end
