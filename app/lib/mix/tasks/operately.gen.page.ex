defmodule Mix.Tasks.Operately.Gen.Page do
  import Mix.Operately, only: [generate_file: 2]

  def run([name]) do
    check_name(name)
    page_name = Macro.camelize(name)

    File.mkdir_p("assets/js/pages/#{page_name}")

    generate(page_name)
  end

  def generate(page_name) do
    generate_file("assets/js/pages/#{page_name}/index.tsx", fn _path ->
      """
      import * as React from "react";
      import * as Pages from "@/components/Pages";
      import * as Paper from "@/components/PaperContainer";

      interface LoaderResult {
        // TODO: Define what is loaded when you visit this page
      }

      export async function loader({params}) : Promise<LoaderResult> {
        return {} // TODO: Load data here
      }

      export function Page() {
        const data = Pages.useLoadedData<LoaderResult>();

        return (
          <Pages.Page title={"#{page_name}"}>
            <Paper.Root>
              <Paper.Body>
                <div className="text-content-accent text-3xl font-extrabold">#{page_name}</div>
              </Paper.Body>
            </Paper.Root>
          </Pages.Page>
        );
      }
      """
    end)
  end

  defp check_name(name) do
    if String.contains?(name, "-") do
      raise """
      Page name should be camel case. Example: ProfilePage
      """
    end

    if String.contains?(name, "_") do
      raise """
      Page name should be camel case. Example: ProfilePage
      """
    end

    unless String.ends_with?(name, "Page") do
      raise """
      Page name should end with 'Page'. Example: ProfilePage
      """
    end
  end
end
