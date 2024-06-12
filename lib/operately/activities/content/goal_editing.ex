defmodule Operately.Activities.Content.GoalEditing do
  use Operately.Activities.Content

  defmodule UpdatedTarget do
    use Operately.Activities.Content

    embedded_schema do
      field :id, :string

      field :old_name, :string
      field :new_name, :string

      field :old_from, :float
      field :new_from, :float

      field :old_to, :float
      field :new_to, :float

      field :old_unit, :string
      field :new_unit, :string

      field :old_index, :integer
      field :new_index, :integer
    end

    def changeset(update, attrs) do
      update
      |> cast(attrs, __schema__(:fields))
      |> validate_required(__schema__(:fields))
    end
  end

  defmodule AddedTarget do
    use Operately.Activities.Content

    embedded_schema do
      field :id, :string
      field :name, :string
      field :from, :float
      field :to, :float
      field :unit, :string
      field :index, :integer
    end

    def changeset(update, attrs) do
      update
      |> cast(attrs, __schema__(:fields))
      |> validate_required(__schema__(:fields))
    end
  end

  defmodule DeletedTarget do
    use Operately.Activities.Content

    embedded_schema do
      field :id, :string
      field :name, :string
      field :from, :float
      field :to, :float
      field :unit, :string
      field :index, :integer
    end

    def changeset(update, attrs) do
      update
      |> cast(attrs, __schema__(:fields))
      |> validate_required(__schema__(:fields))
    end
  end

  embedded_schema do
    field :company_id, :string
    field :goal_id, :string

    field :old_name, :string
    field :new_name, :string

    field :old_timeframe, :string # deprecated, use previous_timeframe
    field :new_timeframe, :string # deprecated, use current_timeframe

    embeds_one :previous_timeframe, Operately.Goals.Timeframe
    embeds_one :current_timeframe, Operately.Goals.Timeframe

    field :old_champion_id, :string
    field :new_champion_id, :string

    field :old_reviewer_id, :string
    field :new_reviewer_id, :string

    embeds_many :added_targets, AddedTarget
    embeds_many :updated_targets, UpdatedTarget
    embeds_many :deleted_targets, DeletedTarget
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:company_id, :goal_id, :old_name, :new_name, :old_champion_id, :new_champion_id, :old_reviewer_id, :new_reviewer_id] -- [:old_timeframe, :new_timeframe])
    |> cast_embed(:previous_timeframe)
    |> cast_embed(:current_timeframe)
    |> cast_embed(:added_targets)
    |> cast_embed(:updated_targets)
    |> cast_embed(:deleted_targets)
    |> validate_required([:company_id, :goal_id, :old_name, :new_name, :old_champion_id, :new_champion_id, :old_reviewer_id, :new_reviewer_id] -- [:old_timeframe, :new_timeframe])
  end

  def build(params) do
    changeset(params)
  end

  def previous_timeframe(content) do
    IO.inspect(content)
    if content["previous_timeframe"] do
      content["previous_timeframe"]
    else
      Operately.Goals.Timeframe.convert_old_timeframe(content["old_timeframe"])
    end
  end

  def current_timeframe(content) do
    if content["current_timeframe"] do
      content["current_timeframe"]
    else
      Operately.Goals.Timeframe.convert_old_timeframe(content["new_timeframe"])
    end
  end
end
