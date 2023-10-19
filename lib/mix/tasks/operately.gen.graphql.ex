defmodule Mix.Tasks.Operately.Gen.Graphql do
  import Mix.Operately, only: [indent: 2]

  def run([name | fields]) do
    gen_type_file(name, fields)
    gen_query_file(name)
    gen_mutation_file(name)

    Mix.Tasks.Operately.Gen.Elixir.Graphql.Schema.run([])
    Mix.Tasks.Operately.Gen.Typescript.Graphql.Schema.run([])
  end

  def gen_type_file(name, fields) do
    IO.puts "Generating lib/operately_web/graphql/types/#{name}.ex"

    module_name = Macro.camelize(name)
    singular_name = Inflex.singularize(name)

    content = """
    defmodule OperatelyWeb.Graphql.Types.#{module_name} do
      use Absinthe.Schema.Notation

      object :#{singular_name} do
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
        field :get_#{singular_name}, :#{singular_name} do
          arg :id, non_null(:id)

          resolve fn args, %{context: context} ->
            person = context.current_account.person
            
            raise "Not implemented"
          end
        end

        field :list_#{name}, list_of(:#{singular_name}) do
          arg :page, :integer
          arg :per_page, :integer

          resolve fn args, %{context: context} ->
            person = context.current_account.person

            raise "Not implemented"
          end
        end
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

      input_object :#{singular_name}_input do
        field :field1, non_null(:string)
      end

      object :#{singular_name}_mutations do
        field :create_#{singular_name}, :#{singular_name} do
          arg :input, non_null(:#{singular_name}_input)

          resolve fn args, %{context: context} ->
            person = context.current_account.person

            raise "Not implemented"
          end
        end

        field :remove_#{singular_name}, :#{singular_name} do
          arg :id, non_null(:id)

          resolve fn args, %{context: context} ->
            person = context.current_account.person

            raise "Not implemented"
          end
        end
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
end
