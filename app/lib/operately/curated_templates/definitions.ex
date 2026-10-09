defmodule Operately.CuratedTemplates.Definitions do
  import Ecto.Changeset
  alias Operately.CuratedTemplates.Definitions.{Kpi, Goal, Project}

  def validate(type, attrs, mode) when is_map(attrs) do
    module =
      case type do
        :kpi -> Kpi
        :goal -> Goal
        :project -> Project
      end

    changeset = module.changeset(struct(module), attrs, mode)
    if changeset.valid?, do: {:ok, changeset |> apply_changes() |> Ecto.embedded_dump(:json) |> Jason.encode!() |> Jason.decode!()}, else: {:error, errors(changeset)}
  end

  def validate(_, _, _), do: {:error, [{"", {"is invalid", []}}]}

  def cast_fields(schema, attrs, fields, required, mode) do
    allowed = Enum.map(fields ++ schema.__struct__.__schema__(:embeds), &Atom.to_string/1)

    cs = schema |> cast(attrs, fields) |> require_fields(required, mode)

    cs =
      Enum.reduce(Map.keys(attrs), cs, fn key, acc ->
        if to_string(key) in allowed, do: acc, else: add_error(acc, :base, "is invalid", path: to_string(key))
      end)

    Enum.reduce(fields, cs, fn field, acc ->
      case schema.__struct__.__schema__(:type, field) do
        :string -> validate_length(acc, field, max: 500)
        _ -> acc
      end
    end)
  end

  defp require_fields(cs, fields, :published), do: validate_required(cs, fields)
  defp require_fields(cs, _fields, :draft), do: cs

  def description(cs) do
    validate_change(cs, :description, fn :description, content ->
      if Operately.CuratedTemplates.RichText.valid?(content), do: [], else: [description: "is invalid"]
    end)
  end

  def nonnegative(cs, field), do: validate_number(cs, field, greater_than_or_equal_to: 0, message: "is invalid")

  def limit_children(cs, field) do
    if length(get_field(cs, field, [])) <= 200, do: cs, else: add_error(cs, field, "is invalid")
  end

  def errors(cs, prefix \\ "") do
    own =
      Enum.map(cs.errors, fn {field, {message, opts}} ->
        suffix = Keyword.get(opts, :path, to_string(field))
        {join(prefix, suffix), {message, opts}}
      end)

    nested =
      Enum.flat_map(cs.types, fn
        {field, {:embed, %{cardinality: :many}}} ->
          cs |> get_change(field, []) |> Enum.with_index() |> Enum.flat_map(fn {child, index} -> errors(child, join(prefix, "#{field}.#{index}")) end)

        _ ->
          []
      end)

    own ++ nested
  end

  defp join("", right), do: right
  defp join(left, ""), do: left
  defp join(left, right), do: left <> "." <> right
end
