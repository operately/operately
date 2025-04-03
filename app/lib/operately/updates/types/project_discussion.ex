defmodule Operately.Updates.Types.ProjectDiscussion do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false
  embedded_schema do
    field :title, :string
    field :body, :map
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:title, :body])
  end

  def build(title, body) do
    %{
      :title => title,
      :body => body
    }
  end

end
