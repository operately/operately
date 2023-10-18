defmodule Mix.Tasks.Operately.Gen.Graphql do
  def run([name | fields]) do
    gen_type_file(name, fields)
    gen_query_file(name)
    gen_mutation_file(name)
  end

  def gen_type_file(name, fields) do
    IO.puts "Generating lib/operately_web/graphql/types/#{name}.ex"

    module_name = Macro.camelize(name)

    content = """
    defmodule OperatelyWeb.Graphql.Types.#{module_name} do
      use Absinthe.Schema.Notation

      object :#{name} do
        #{indent(generate_fields(fields), 4)}
      end
    end
    """

    File.write("lib/operately_web/graphql/types/#{name}.ex", content)
  end

  def gen_query_file(name) do
    IO.puts "Generating lib/operately_web/graphql/queries/#{name}.ex"

    module_name = Macro.camelize(name)
    singular_name = Inflex.singularize(name)

    content = """
    defmodule OperatelyWeb.Graphql.Queries.#{module_name} do
      use Absinthe.Schema.Notation

      object :#{singular_name}_queries do
      end
    end
    """

    File.write("lib/operately_web/graphql/queries/#{name}.ex", content)
  end

  def gen_mutation_file(name) do
    IO.puts "Generating lib/operately_web/graphql/mutations/#{name}.ex"

    module_name = Macro.camelize(name)
    singular_name = Inflex.singularize(name)

    content = """
    defmodule OperatelyWeb.Graphql.Mutations.#{module_name} do
      use Absinthe.Schema.Notation

      object :#{singular_name}_mutations do
      end
    end
    """

    File.write("lib/operately_web/graphql/mutations/#{name}.ex", content)
  end

  def generate_fields(fields) do
    Enum.map(fields, fn field ->
      field_name = String.split(field, ":") |> Enum.at(0)
      field_type = String.split(field, ":") |> Enum.at(1)

      "field :#{field_name}, non_null(:#{field_type})"
    end)
    |> Enum.join("\n")
  end

  def indent(lines, spaces) do
    first_line = Enum.at(String.split(lines, "\n"), 0)
    rest_lines = Enum.drop(String.split(lines, "\n"), 1) |> Enum.map(fn line -> String.duplicate(" ", spaces) <> line end)
    all_lines = [first_line] ++ rest_lines

    Enum.join(all_lines, "\n")
  end
end
