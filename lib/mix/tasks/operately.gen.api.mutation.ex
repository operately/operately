defmodule Mix.Tasks.Operately.Gen.Api.Mutation do
  import Mix.Operately, only: [generate_file: 2, inject_into_file: 3]

  def run([name]) do
    check_name(name)
    ensure_mutations_folder_exists()
    ensure_mutations_test_folder_exists()

    file_name = "lib/operately_web/api/mutations/#{name}.ex"
    module_name = "OperatelyWeb.Api.Mutations.#{Macro.camelize(name)}"
    test_file_name = "test/operately_web/api/mutations/#{name}_test.exs"

    generate(file_name, module_name)
    register_mutation(name, module_name)
    generate_test(test_file_name, module_name)
  end

  def generate(file_name, module_name) do
    generate_file(file_name, fn _path ->
      """
      defmodule #{module_name} do
        use TurboConnect.Mutation

        inputs do
          # TODO: Define input fields
        end

        outputs do
          # TODO: Define output fields
        end

        def call(_conn, _inputs) do
          raise "Not implemented"
        end
      end
      """
    end)
  end

  def generate_test(file_name, module_name) do
    generate_file(file_name, fn _path ->
      """
      defmodule #{module_name}Test do
        use OperatelyWeb.ConnCase
      end 
      """
    end)
  end
  
  def register_mutation(name, module_name) do
    file_path = "lib/operately_web/api.ex"
    register = "  mutation :#{name}, #{module_name}"
    line = find_mutation_insertion_point()

    inject_into_file(file_path, register, line + 1)
  end

  def find_mutation_insertion_point do
    "lib/operately_web/api.ex"
    |> File.read!()
    |> String.split("\n")
    |> Enum.find_index(fn line -> String.contains?(line, "mutation:") end)
  end

  defp ensure_query_folder_exists() do
    File.mkdir_p("lib/operately_web/api/mutations")
  end

  defp ensure_query_test_folder_exists() do
    File.mkdir_p("test/operately_web/api/mutations")
  end

  defp check_name(name) do
    if String.contains?(name, "-") do
      raise """
      Mutation name can't contain '-' character. Good example: create_user, Bad example: create-user
      """
    end

    if String.contains?(name, " ") do
      raise """
      Mutation name can't contain space character. Good example: create_user, Bad example: create user
      """
    end

    if String.match?(name, ~r/[A-Z]/) do
      raise """
      Mutation name should be snake case. Good example: create_user, Bad example: CreateUser
      """
    end

    if String.match?(name, ~r/^[0-9]/) do
      raise """
      Mutation name can't start with a number. Good example: create_user, Bad example: 1_create_user
      """
    end

    if not String.match?(name, ~r/[a-z0-9_]/) do
      raise """
      Mutation name should be snake case and only contain characters a-z, 0-9, and '_'. Good example: create_user, Bad example: create_!_user
      """
    end
  end
end
