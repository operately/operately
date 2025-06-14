defmodule OperatelyWeb.Api.Spaces do
  alias Operately.Groups.Group, as: Space
  alias OperatelyWeb.Api.Serializer

  defmodule Search do
    use TurboConnect.Query

    inputs do
      field :query, :string, null: true
    end

    outputs do
      field :spaces, list_of(:space), null: true
    end

    def call(conn, inputs) do
      spaces = Space.search(conn.assigns.current_person, inputs.query)

      {:ok, %{spaces: Serializer.serialize(spaces, level: :essential)}}
    end
  end
end
