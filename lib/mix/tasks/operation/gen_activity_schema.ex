defmodule Mix.Tasks.Operation.GenActivitySchema do

  def gen(ctx) do
    fields = 
      ctx.activity_fields 
      |> Enum.map(fn {name, type} -> "field :#{name}, :#{type}}" end)
      |> Enum.join(",\n")

    Mix.Operately.generate_file(ctx.activity_schema_file_path, fn _ ->
      """
      defmodule Operately.Activities.Content.#{ctx.activity_schema_module_name} do
        use Operately.Activities.Content

        embedded_schema do
          #{Mix.Operately.indent(fields, 4)}
        end

        def changeset(attrs) do
          %__MODULE__{}
          |> cast(attrs, __schema__(:fields))
          |> validate_required(__schema__(:fields))
        end

        def build(params) do
          changeset(params)
        end
      end
      """
    end)
  end

end
