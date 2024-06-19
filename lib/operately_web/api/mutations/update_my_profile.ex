defmodule OperatelyWeb.Api.Mutations.UpdateMyProfile do
  use TurboConnect.Mutation

  inputs do
    field :full_name, :string
    field :title, :string
    field :timezone, :string
    field :manager_id, :string
    field :avatar_url, :string
    field :avatar_blob_id, :string
  end

  outputs do
    field :me, :person
  end

  def call(conn, inputs) do
    me = conn.assigns.current_account.person

    {:ok, me} = Operately.People.update_person(me, %{
      full_name: inputs[:full_name],
      title: inputs[:title],
      timezone: inputs[:timezone],
      avatar_blob_id: inputs[:avatar_blob_id],
      avatar_url: inputs[:avatar_url],
      manager_id: inputs[:manager_id],
    })

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
