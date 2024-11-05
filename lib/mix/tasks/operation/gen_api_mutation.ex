defmodule Mix.Tasks.Operation.GenApiMutation do

  def gen(ctx) do
    gen_router_snippet(ctx)
    gen_mutation_file(ctx)
    gen_mutations_test_file(ctx)
  end

  defp gen_router_snippet(ctx) do
    file_path = "lib/operately_web/api.ex"
    content = "  mutation :#{ctx.action}_#{ctx.resource}, M.#{ctx.operation_module_name}"
    line = find_insertion_point(file_path)

    Mix.Operately.inject_into_file(file_path, content, line)
  end

  defp gen_mutation_file(ctx) do
    fields = 
      ctx.activity_fields 
      |> Enum.map(fn {name, type} -> "field :#{name}, :#{type}" end)
      |> Enum.join("\n")

    Mix.Operately.generate_file(ctx.api_mutation_file_path, fn _ ->
      """
      defmodule OperatelyWeb.Api.Mutations.#{ctx.api_module_name} do
        use TurboConnect.Mutation
        use OperatelyWeb.Api.Helpers

        alias Operately.Operations.#{ctx.operation_module_name}

        inputs do
          #{Mix.Operately.indent(fields, 4)}
        end

        outputs do
          field :something, :something  # TODO
        end

        def call(conn, inputs) do
          with(
            {:ok, me} <- find_me(conn),
            {:ok, resource} <- find_resource(me, inputs),
            {:ok, :allowed} <- authorize(company),
            {:ok, result} <- execute(#{ctx.operation_module_name}.run(ctx.me, ctx.attrs) end)
            {:ok, seriliazed} <- %{person: Serializer.serialize(result, level: :full)}
          ) do
            {:ok, %{something: serialized}}
          else
            {:error, :forbidden} -> {:error, :forbidden}
            {:error, :not_found} -> {:error, :not_found}
            {:error, _} -> {:error, :internal_server_error}
          end
        end

        defp authorize(resource) do
          # Permissions.check(resource.request_info.access_level, :can_do_things)
        end

        defp find_resource(me, _inputs) do
          # e.g. Project.get(me, id: inputs.project_id)
        end

        defp execute(me, resource, inputs) do
          #{ctx.operation_module_name}.run(me, resource, inputs)
        end
      end
      """
    end)
  end

  defp gen_mutations_test_file(ctx) do
    Mix.Operately.generate_file(ctx.api_mutation_test_file_path, fn _ ->
      """
      defmodule OperatelyWeb.Api.Mutations.#{ctx.api_module_name}Test do
        use OperatelyWeb.TurboCase

        setup ctx do
          ctx |> Factory.setup()
        end

        describe "security" do
          test "it requires authentication", ctx do
            assert {401, _} = mutation(ctx.conn, :#{ctx.action}_#{ctx.resource}, %{})
          end
        end

        describe "permissions" do
        end

        describe "functionality" do
        end
      end
      """
    end)
  end

  defp find_insertion_point(file_path) do
    file_path
    |> File.read!()
    |> String.split("\n")
    |> Enum.find_index(fn line -> String.contains?(line, "mutation :") end)
  end

end
