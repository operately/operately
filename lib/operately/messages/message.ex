defmodule Operately.Messages.Message do
  use Operately.Schema
  use Operately.Repo.Getter

  schema "messages" do
    belongs_to :space, Operately.Groups.Group
    belongs_to :author, Operately.People.Person

    field :title
    field :body, :map

    timestamps()
    requester_access_level()
    request_info()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(update, attrs) do
    update
    |> cast(attrs, [:space_id, :author_id, :title, :body])
    |> validate_required([:space_id, :author_id, :title, :body])
  end
end
