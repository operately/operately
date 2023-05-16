defmodule Operately.Updates.Update do
  use Ecto.Schema
  import Ecto.Changeset

  @content_types [
    %{
      type: :created,
      schema: __MODULE__.Created,
    },
    %{
      type: :status_update,
      schema: __MODULE__.StatusUpdate,
    }
  ]

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "updates" do
    field :updatable_id, Ecto.UUID
    field :updatable_type, Ecto.Enum, values: [:objective, :project]
    field :author_id, :binary_id

    field :type, Ecto.Enum, values: Enum.map(@content_types, & &1[:type])
    field :content, :map

    timestamps()
  end

  @doc false
  def changeset(update, attrs) do
    update
    |> cast(attrs, [:content, :updatable_id, :updatable_type, :author_id, :type])
    |> validate_required([:content, :updatable_id, :updatable_type, :author_id, :type])
    |> validate_content_format(attrs[:type])
  end

  defp validate_content_format(changeset, type) do
    validate_change(changeset, :content, fn field, value ->
      case find_schema(type) do
        nil -> 
          [content: "unknown update type #{type}"]

        schema -> 
          case apply(schema, :changeset, [value]) do
            %Ecto.Changeset{valid?: true} -> []
            _ -> [content: "invalid update content"]
          end
      end
    end)
  end

  defp find_schema(type) do
    case Enum.find(@content_types, & &1[:type] == type) do
      nil -> nil
      content_type -> content_type[:schema]
    end
  end


  #
  # Content Types (embedded schemas)
  #
  # These are the different types of content that can be added to an update.
  # They are validated separately from the update itself.
  #

  defmodule Created do
    use Ecto.Schema

    embedded_schema do
    end

    def changeset(params) do
      %__MODULE__{} |> cast(params, []) |> validate_required([])
    end
  end

  defmodule StatusUpdate do
    use Ecto.Schema

    embedded_schema do
      field :message, :string
    end

    def changeset(params) do
      %__MODULE__{}
      |> cast(params, [:message])
      |> validate_required([:message])
    end
  end

end
