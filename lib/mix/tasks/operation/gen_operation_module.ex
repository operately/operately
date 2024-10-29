defmodule Mix.Tasks.Operation.GenOperationModule do

  def gen(ctx) do
    fields = 
      ctx.activity_fields 
      |> Enum.map(fn {name, _} -> "#{name}: ...," end) 
      |> Enum.join(",\n")

    Mix.Operately.generate_file(ctx.operation_file_path, fn _ ->
      """
      defmodule Operately.Operations.#{ctx.operation_module_name} do
        alias Ecto.Multi
        alias Operately.Repo
        alias Operately.Activities

        def run(author, attrs) do
          raise "Operation for #{ctx.operation_module_name} not implemented"

          Multi.new()
          |> Multi.insert(:something, ...)
          |> Activities.insert_sync(author.id, :#{ctx.action_name}, fn changes ->
            %{
              #{Mix.Operately.indent(fields, 6)}
            }
          end)
          |> Repo.transaction()
          |> Repo.extract_result(:something)
        end
      end
      """
    end)
  end

end
