Feature: Key Performance Indicators

  Scenario Outline: Creating a KPI and setting the target value
    Given I am logged in as a user
    When I go to the KPI page
    And I click on the "Create KPI" button
    And I fill in the "Name" field with "<kpi name>"
    And I fill in the "Target value" field with "<target value>"
    And I select the "Target direction" option with "<target direction>"
    And I click on the "Create" button
    Then I should see "<kpi name>" in the KPI list

    Examples:
      | kpi name    | target | unit | target direction | target number |
      | Revenue     | 1000   | USD  | above            | 800           |
      | Engagement  | 70     | %    | above            | 50            |
      | Retention   | 90     | %    | above            | 80            |
