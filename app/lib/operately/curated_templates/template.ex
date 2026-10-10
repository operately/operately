defmodule Operately.CuratedTemplates.Template do
  def __api_typename__, do: "curated_template"

  use Operately.Schema
  alias Operately.CuratedTemplates.Definitions

  schema "curated_templates" do
    belongs_to :creator_account, Operately.People.Account
    belongs_to :updater_account, Operately.People.Account

    field :type, Ecto.Enum, values: [:kpi, :goal, :project]
    field :state, Ecto.Enum, values: [:draft, :published], default: :draft
    field :category, :string
    field :title, :string
    field :summary, :string
    field :content_language, :string, default: "en"
    field :definition, :map, default: %{}

    field :published_at, :utc_datetime_usec

    timestamps(type: :utc_datetime_usec)
  end

  def types, do: Ecto.Enum.values(__MODULE__, :type)
  def states, do: Ecto.Enum.values(__MODULE__, :state)

  def changeset(template, attrs) do
    template
    |> cast(attrs, [:type, :title, :summary, :category, :content_language, :definition])
    |> validate_required([:title, :type, :content_language, :definition])
    |> validate_length(:title, max: 200)
    |> validate_length(:summary, max: 2000)
    |> validate_length(:category, max: 100)
    |> validate_inclusion(:content_language, Operately.I18n.Languages.supported())
    |> validate_type_change()
    |> validate_definition()
  end

  defp validate_type_change(%{data: %{state: :published, type: type}} = cs) when not is_nil(type) do
    if changed?(cs, :type), do: add_error(cs, :type, "is invalid"), else: cs
  end

  defp validate_type_change(cs), do: cs

  defp validate_definition(cs) do
    type = get_field(cs, :type)
    definition = get_field(cs, :definition)

    if type not in types() or not is_map(definition) do
      # Casting or required-field validation already added errors; skip embedded validation.
      cs
    else
      case Definitions.validate(type, definition, cs.data.state) do
        {:ok, normalized} ->
          put_change(cs, :definition, normalized)

        {:error, errors} ->
          Enum.reduce(errors, cs, fn {path, {message, opts}}, acc ->
            add_error(acc, :definition, message, Keyword.put(opts, :path, if(path == "", do: "definition", else: "definition." <> path)))
          end)
      end
    end
  end
end
