defmodule Operately.Updates.Update do
  use Ecto.Schema
  import Ecto.Changeset

  #
  # The content of the update is polymorphic, and can be one of the following
  # types. Each type has its own schema, and is validated separately.
  #
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

  #
  # Validation of the content field
  #
  # First, we validate that the type is one of the known types.
  # Then, we validate the content against the schema for that type.
  # If the type is unknown, or the content is invalid, we return an error.
  # Otherwise, we return an empty list.
  #
  defp validate_content_format(changeset, type) do
    validate_change(changeset, :content, fn _field, value ->
      case find_schema(type) do
        nil -> 
          [content: "unknown update type #{type}"]

        schema -> 
          case apply(schema, :changeset, [value]) do
            %Ecto.Changeset{valid?: true} -> []
            e -> [content: "invalid update content for type #{type} #{inspect(e)}}"]
          end
      end
    end)
  end

  #
  # Utility function to find the schema for a given type
  #
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
      field :message, :map
    end

    def changeset(params) do
      %__MODULE__{}
      |> cast(params, [:message])
      |> validate_required([:message])
    end
  end

end
