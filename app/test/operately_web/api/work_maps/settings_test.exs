defmodule OperatelyWeb.Api.WorkMaps.SettingsTest do
  use Operately.DataCase
  alias Ecto.Adapters.SQL.Sandbox
  alias OperatelyWeb.Api.WorkMaps.Settings

  test "concurrent first saves both succeed and the last default wins" do
    Sandbox.unboxed_run(Repo, fn ->
      ctx = Factory.setup(%{})
      scope = %{person: ctx.creator, space_id: nil, can_edit: true}
      first_view = %{default_view: %{view: :timeline}}
      second_view = %{default_view: %{view: :table}}
      parent = self()

      try do
        first = Task.async(fn ->
          Sandbox.unboxed_run(Repo, fn ->
            Settings.save(scope, first_view, fn ->
              send(parent, {:locked, self()})
              receive do
                :continue -> :ok
              after
                5_000 -> raise "writer was not released"
              end
            end)
          end)
        end)

        assert_receive {:locked, writer}, 5_000
        second = Task.async(fn -> Sandbox.unboxed_run(Repo, fn -> Settings.save(scope, second_view, fn -> :ok end) end) end)
        assert Task.yield(second, 50) == nil
        send(writer, :continue)
        assert {:ok, _} = Task.await(first)
        assert {:ok, _} = Task.await(second)
        assert Settings.read(scope).default_view == %{"view" => "table"}
      after
        Repo.delete!(ctx.company)
        Repo.delete!(ctx.account)
      end
    end)
  end
end
