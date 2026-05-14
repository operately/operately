defmodule Operately.CliE2E.People.UpdatePictureTest do
  use Operately.CliE2ECase

  alias Operately.Support.CliE2E.People.UpdatePictureSteps, as: Steps

  setup ctx do
    {:ok, Steps.setup(ctx)}
  end

  test "updates the profile picture from a file", ctx do
    ctx
    |> Steps.update_picture_from_mock_file()
    |> Steps.assert_picture_updated_successfully()
  end

  test "clears the current profile picture", ctx do
    ctx
    |> Steps.given_an_existing_profile_picture()
    |> Steps.clear_the_profile_picture()
    |> Steps.assert_picture_cleared_successfully()
  end
end
