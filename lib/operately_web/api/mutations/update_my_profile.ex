defmodule OperatelyWeb.Api.Mutations.UpdateMyProfile do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :full_name, :string
    field :title, :string
    field :timezone, :string
    field :manager_id, :string
    field :avatar_url, :string
    field :avatar_blob_id, :string
    field :theme, :string
  end

  outputs do
    field :me, :person
  end

  def call(conn, inputs) do
    {:ok, me} = Operately.People.update_person(me(conn), inputs)
    {:ok, serialize(me)}
  end

  defp serialize(me) do
    %{
      me: %{
        full_name: me.full_name,
        title: me.title,
        timezone: me.timezone,
        avatar_url: me.avatar_url,
      }
    }
  end
end
