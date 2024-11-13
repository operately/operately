defmodule Operately.Messages.MessagesBoard do
  use Operately.Schema

  schema "messages_boards" do
    belongs_to :space, Operately.Groups.Group, foreign_key: :space_id

    field :name, :string
    field :description, :map

    has_many :messages, Operately.Messages.Message, foreign_key: :messages_board_id

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(update, attrs) do
    update
    |> cast(attrs, [:space_id, :name, :description])
    |> validate_required([:space_id, :name])
  end
end
