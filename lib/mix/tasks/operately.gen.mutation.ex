defmodule Mix.Tasks.Operately.Gen.Activity.Type do
  import Mix.Operately, only: [generate_file: 2, indent: 2]

  #
  # Usage example:
  # mix operately.gen.mutation tasks edit_task_name TaskNameEditing
  #
  def run([type, mutation_name, operation]) do
    validate_type(type)
    validate_mutation_name(type, mutation_name)
    validate_operation(operation)

    insertion_point = find_file_insertion_point(type)

    inject_input_object(type, mutation_name, insertion_point - 1)
    inject_mutation_field(type, mutation_name, insertion_point + 1)
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
end
