defmodule Operately.Activities.Content.TaskBoardDefaultChanged do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :board, Operately.Tasks.TaskBoard
    belongs_to :previous_board, Operately.Tasks.TaskBoard
    field :name, :string
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:company_id, :space_id, :board_id, :name])
  end

  def build(params), do: changeset(params)
end
