defmodule Mix.Tasks.Operately.Gen.Mutation do
  import Mix.Operately, only: [generate_file: 2, inject_into_file: 3]

  @supported_types ~w(string integer float boolean)

  #
  # Usage example:
  # mix operately.gen.mutation tasks edit_task_name TaskNameEditing id:string name:string
  #
  def run([type, mutation_name, operation | fields]) do
    validate_type(type)
    validate_mutation_name(type, mutation_name)
    validate_operation(operation)

    fields = parse_fields(fields)

    inject_input_object(type, mutation_name, fields)
    inject_mutation_field(type, mutation_name, operation)
    generate_js_model_mutation(type, mutation_name)
    inject_js_model_index_export(type, mutation_name)
  end

  def generate_js_model_mutation(type, mutation_name) do
    file_name = "use" <> Macro.camelize(mutation_name) <> "Mutation"
    file_path = "assets/js/models/#{type}/#{file_name}.tsx"

    camelized_mutation_name = Macro.camelize(mutation_name)
    camelized_input_name = Macro.camelize(mutation_name) <> "Input"
    camelized_operation_name = String.downcase(String.at(camelized_mutation_name, 0)) <> String.slice(camelized_mutation_name, 1..-1)

    function = "use" <> Macro.camelize(mutation_name)

    generate_file(file_path, fn _ ->
      """
      export { #{Macro.camelize(singular_type_name(type))} } from "@/gql";
      import { gql, useMutation } from "@apollo/client";

      const MUTATION = gql`
        mutation #{camelized_mutation_name}($input: #{camelized_input_name}!) {
          #{camelized_operation_name}(input: $input) {
            id
          }
        }
      `;

      export function #{function}(options: any) {
        return useMutation(MUTATION, options);
      }
      """
    end)
  end

  def inject_js_model_index_export(type, mutation_name) do
    file_name = "index"
    file_path = "assets/js/models/#{type}/#{file_name}.tsx"

    function = "use" <> Macro.camelize(mutation_name) <> "Mutation"
    import_file_path = "./" <> function

    inject_into_file(file_path, "export { #{function} } from '#{import_file_path}';", 1)
  end

  def inject_input_object(type, mutation_name, fields) do
    insertion_point = find_file_insertion_point(type) - 1

    file_name = "lib/operately_web/graphql/mutations/#{type}.ex"

    input_object = """

      input :#{mutation_name}_input do
        #{Enum.join(Enum.map(fields, fn {name, fieldType} -> "field :#{name}, non_null(:#{fieldType})" end), "\n")}
      end
    """

    inject_into_file(file_name, input_object, insertion_point)
  end

  def inject_mutation_field(type, mutation_name, operation) do
    insertion_point = find_file_insertion_point(type) + 1

    file_name = "lib/operately_web/graphql/mutations/#{type}.ex"

    mutation_field = """
        field :#{mutation_name}, non_null(:#{singular_type_name(type)}) do
          arg :input, non_null(:#{mutation_name}_input)

          resolve fn %{input: input}, %{context: context} ->
            author = context.current_account.person

            case Operately.Operations.#{operation}.run(author, input) do
              {:ok, result} -> {:ok, result}
              {:error, changeset} -> {:error, changeset}
            end
          end
        end
    """

    inject_into_file(file_name, mutation_field, insertion_point)
  end

  defp validate_type(name) do
    type_definition_path = "lib/operately_web/graphql/types/#{name}.ex"

    unless File.exists?(type_definition_path) do
      raise """
      GraphQL type definition for #{name} does not exist. Please create it first.
      Used path: #{type_definition_path} for lookup.
      """
    end
  end

  defp validate_mutation_name(type, mutation_name) do
    type_mutations_path = "lib/operately_web/graphql/mutations/#{type}.ex"

    unless File.exists?(type_mutations_path) do
      raise """
      Mutations for #{type} does not exist. Please create it first.
      Used path: #{type_mutations_path} for lookup.
      """
    end

    unless String.match?(mutation_name, ~r/\A[a-z_]+\z/) do
      raise """
      Mutation name can't contain spaces. Please use underscore instead.
      """
    end
  end

  defp validate_operation(operation) do
    file_name = Macro.underscore(operation)
    operation_path = "lib/operately/operations/#{file_name}.ex"

    unless File.exists?(operation_path) do
      raise """
      Operation not found. Please create it first.
      Used path: #{operation_path} for lookup.
      """
    end
  end

  defp find_file_insertion_point(type) do
    mutation_file_path = "lib/operately_web/graphql/mutations/#{type}.ex"
    mutation_file = File.read!(mutation_file_path)

    index = 
      mutation_file
      |> String.split("\n")
      |> Enum.find_index(&String.match?(&1, ~r/object :#{singular_type_name(type)}_mutations do/))

    if index do
      index
    else
      raise """
      Couldn't find definition for #{type} mutations. Please make sure it's defined in #{mutation_file_path}.
      """
    end
  end

  defp singular_type_name(type) do
    String.replace(type, ~r/s\z/, "")
  end

  defp parse_fields(fields) do
    if Enum.empty?(fields) do
      raise """
      A mutation should have at least one field. Example: mix operately.gen.mutation tasks edit_task_name TaskNameEditing id:string name:string
      """
    end

    Enum.each(fields, fn field ->
      unless String.contains?(field, ":") do
        raise """
        Every field should have a type. Example: mix operately.gen.mutation tasks edit_task_name TaskNameEditing id:string name:string
        """
      end
      
      [name, fieldType] = String.split(field, ":")

      unless Enum.member?(@supported_types, fieldType) do
        raise """
        #{fieldType} is not a supported type in #{name}:#{fieldType}. Supported types are: #{@supported_types}
        """
      end
    end)

    fields |> Enum.map(fn field ->
      [name, fieldType] = String.split(field, ":")
      {name, fieldType}
    end)
  end
end
