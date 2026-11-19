defmodule Operately.Data.Change117BackfillCuratedTemplateSlugs do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.Template

  def run do
    templates = Repo.all(from(t in Template, order_by: t.id))
    used_slugs = MapSet.new(templates, &{&1.slug, &1.content_language})

    templates
    |> Enum.filter(&is_nil(&1.slug))
    |> Enum.reduce(used_slugs, fn template, used ->
      slug = unique_slug(title_slug(template.title), template.content_language, used)
      from(t in Template, where: t.id == ^template.id) |> Repo.update_all(set: [slug: slug])
      MapSet.put(used, {slug, template.content_language})
    end)

    :ok
  end

  defp title_slug(title) do
    slug =
      title
      |> String.normalize(:nfkd)
      |> String.replace(~r/\p{M}/u, "")
      |> String.downcase()
      |> String.replace(~r/[^\p{L}\p{N}]+/u, "-")
      |> String.slice(0, 200)
      |> String.trim("-")

    if slug == "", do: "template", else: slug
  end

  defp unique_slug(base, language, used, attempt \\ 1) do
    suffix = if attempt == 1, do: "", else: "-#{attempt}"
    slug = String.trim_trailing(String.slice(base, 0, 200 - String.length(suffix)), "-") <> suffix

    if MapSet.member?(used, {slug, language}) do
      unique_slug(base, language, used, attempt + 1)
    else
      slug
    end
  end

  defmodule Template do
    use Ecto.Schema

    @primary_key {:id, :binary_id, autogenerate: false}
    schema "curated_templates" do
      field :title, :string
      field :slug, :string
      field :content_language, :string
    end
  end
end
