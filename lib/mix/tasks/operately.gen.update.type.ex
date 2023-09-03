defmodule Mix.Tasks.Operately.Gen.Update.Type do
  def run([module_name | fields]) do
    fields = parse_fields(fields)
    gen_type_module(module_name, fields)
  end

  def gen_type_module(module_name, fields) do
    snake_case_module_name = Macro.underscore(module_name)
    full_module_name = "Operately.Updates.Types.#{module_name}"
    path = Path.join(["lib", "operately", "updates", "types", "#{snake_case_module_name}.ex"])

    content = """
    defmodule #{full_module_name} do
      use Ecto.Schema
      import Ecto.Changeset

      @primary_key false
      embedded_schema do
        #{Enum.map(fields, &field/1) |> Enum.join("\n    ")}
      end

      def changeset(attrs) do
        %__MODULE__{}
        |> cast(attrs, __schema__(:fields))
        |> validate_required(__schema__(:fields))
      end
    end
    """

    IO.puts(path)
    IO.puts(content)
  end

  def field({field_name, field_type}) do
    "field :#{field_name}, :#{field_type}"
  end

  def parse_fields(fields) do
    Enum.map(fields, fn(field) ->
      field = String.split(field, ":")
      {String.to_atom(Enum.at(field, 0)), String.to_atom(Enum.at(field, 1))}
    end)
  end
end
