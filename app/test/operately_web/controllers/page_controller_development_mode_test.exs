defmodule OperatelyWeb.PageControllerDevelopmentModeTest do
  use ExUnit.Case, async: true

  test "development_mode?/1 is false in test when CI is disabled but Vite is unavailable" do
    refute OperatelyWeb.PageController.development_mode?(app_env: :test, ci: nil, vite_available?: false)
  end

  test "development_mode?/1 is true in test when Vite is available locally" do
    assert OperatelyWeb.PageController.development_mode?(app_env: :test, ci: nil, vite_available?: true)
  end

  test "development_mode?/1 is false in test when CI=true even if Vite is available" do
    refute OperatelyWeb.PageController.development_mode?(app_env: :test, ci: "true", vite_available?: true)
  end
end
