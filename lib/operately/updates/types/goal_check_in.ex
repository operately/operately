defmodule Operately.Updates.Types.GoalCheckIn do
  use Ecto.Schema
  import Ecto.Changeset

  defmodule Target do
    use Ecto.Schema
    import Ecto.Changeset

    @primary_key false

    embedded_schema do
      field :id, :string
      field :name, :string
      field :value, :float
      field :unit, :string
      field :previous_value, :float
      field :index, :integer
      field :from, :float
      field :to, :float
    end

    def changeset(value, attrs) do
      value |> cast(attrs, [
        :id, 
        :name, 
        :value, 
        :previous_value, 
        :unit,
        :index, 
        :from,
        :to
      ])
    end
  end

  @primary_key false
  embedded_schema do
    field :message, :map
    embeds_many :targets, Target
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:message])
    |> cast_embed(:targets)
    |> validate_required([:message])
  end

  def build(target_values, message) do
    %{
      "message" => message,
      "targets" => Enum.map(target_values, fn target_value ->
        %{
          "id" => target_value["id"],
          "name" => target_value["name"],
          "value" => target_value["value"],
          "unit" => target_value["unit"],
          "previous_value" => target_value["previous_value"],
          "index" => target_value["index"],
          "from" => target_value["from"],
          "to" => target_value["to"]
        }
      end)
    }
  end

end
