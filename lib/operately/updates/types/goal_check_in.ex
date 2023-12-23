defmodule Operately.Updates.Types.GoalCheckIn do
  use Ecto.Schema
  import Ecto.Changeset

  defmodule TargetValue do
    use Ecto.Schema
    import Ecto.Changeset

    @primary_key false

    embedded_schema do
      field :target_id, :string
      field :target_name, :string
      field :value, :float
    end

    def changeset(value, attrs) do
      value |> cast(attrs, [:target_id, :target_name, :value])
    end
  end

  @primary_key false
  embedded_schema do
    field :message, :map

    embeds_many :target_values, TargetValue
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:message])
    |> cast_embed(:target_values)
    |> validate_required([:message])
  end

  def build(target_values, message) do
    result = %{}

    result = Map.merge(result, %{:message => message})

    result = Map.merge(result, %{
      :target_values => Enum.map(target_values, fn target_value ->
        %{
          :target_id => target_value.target_id,
          :target_name => target_value.target_name,
          :value => target_value.value,
        }
      end)
    })

    result
  end

end
