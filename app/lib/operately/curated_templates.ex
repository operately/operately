defmodule Operately.CuratedTemplates do
  import Ecto.Query
  alias Operately.CuratedTemplates.Template
  alias Operately.Repo

  def get(id), do: Repo.get(Template, id)
  def get_published(id), do: Repo.one(from t in Template, where: t.id == ^id and t.state == :published)

  def create(account, attrs) do
    %Template{creator_account_id: account.id, updater_account_id: account.id}
    |> Template.changeset(attrs)
    |> Repo.insert()
  end

  def delete(template, expected_updated_at) do
    # Check freshness and delete in one statement so concurrent edits are preserved.
    query = from t in Template, where: t.id == ^template.id and t.updated_at == ^expected_updated_at, select: t

    case Repo.delete_all(query) do
      {1, [deleted]} -> {:ok, deleted}
      {0, []} -> {:error, :conflict}
    end
  end

  def list(filters, visibility) do
    # Public catalogs include only published, unarchived templates.
    query = if visibility == :public, do: from(t in Template, where: t.state == :published and is_nil(t.archived_at)), else: Template

    # Apply exact-match filters, ignoring missing or empty values.
    query =
      Enum.reduce([:type, :state, :category], query, fn field, query ->
        case Map.get(filters, field) do
          nil -> query
          "" -> query
          value -> where(query, [t], field(t, ^field) == ^value)
        end
      end)

    # Optionally restrict results to archived or unarchived templates.
    query =
      case filters[:archived] do
        true -> where(query, [t], not is_nil(t.archived_at))
        false -> where(query, [t], is_nil(t.archived_at))
        nil -> query
      end

    # Search titles case-insensitively, treating wildcard characters literally.
    query =
      case filters[:search] do
        search when is_binary(search) and search != "" -> where(query, [t], ilike(t.title, ^("%" <> escape_like(search) <> "%")))
        _ -> query
      end

    limit = min(max(filters[:limit] || 20, 1), 100)
    offset = max(filters[:offset] || 0, 0)
    total = Repo.aggregate(query, :count)

    templates =
      query
      |> order_by([t], asc: t.title, asc: t.id)
      |> limit(^limit)
      |> offset(^offset)
      |> select([t], struct(t, [:id, :title, :summary, :state, :type, :category, :content_language, :published_at, :archived_at, :inserted_at, :updated_at]))
      |> Repo.all()

    %{templates: templates, total: total}
  end

  defp escape_like(value), do: value |> String.replace("\\", "\\\\") |> String.replace("%", "\\%") |> String.replace("_", "\\_")
end
